import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign, faTag, faShoppingCart, faChartLine } from '@fortawesome/free-solid-svg-icons';

interface Starship {
  _id: string;
  issue: string;
  edition: string;
  shipName: string;
  faction: string;
  releaseDate?: Date;
  imageUrl?: string;
  owned: boolean;
  retailPrice?: number;
  purchasePrice?: number;
  marketValue?: number;
}

interface PriceVaultProps {
  starships: Starship[];
  viewMode: 'all' | 'owned' | 'missing';
}

const PriceVault: React.FC<PriceVaultProps> = ({ starships, viewMode }) => {
  const [currencySettings, setCurrencySettings] = useState({
    currency: 'GBP',
    symbol: '£',
    locale: 'en-GB'
  });

  // Load currency settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('currencySettings');
      if (savedSettings) {
        setCurrencySettings(JSON.parse(savedSettings));
      }
    }
  }, []);

  // Filter starships based on viewMode
  const filteredStarships = viewMode === 'all' 
    ? starships 
    : viewMode === 'owned' 
      ? starships.filter(s => s.owned) 
      : starships.filter(s => !s.owned);

  // Calculate total retail price
  const totalRetailPrice = filteredStarships.reduce((sum, ship) => {
    return sum + (ship.retailPrice || 0);
  }, 0);

  // Calculate total purchase price (only for owned ships)
  const totalPurchasePrice = filteredStarships
    .filter(ship => ship.owned)
    .reduce((sum, ship) => {
      return sum + (ship.purchasePrice || 0);
    }, 0);

  // Calculate total market value (only for owned ships)
  const totalMarketValue = filteredStarships
    .filter(ship => ship.owned)
    .reduce((sum, ship) => {
      return sum + (ship.marketValue || 0);
    }, 0);

  // Format currency based on settings
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    
    return new Intl.NumberFormat(currencySettings.locale, {
      style: 'currency',
      currency: currencySettings.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div>
      <Row className="mb-4">
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <FontAwesomeIcon icon={faTag} className="fa-3x text-primary mb-3" />
              <h5>Total Retail Price</h5>
              <h3>{formatCurrency(totalRetailPrice)}</h3>
              <div className="text-muted small">
                {viewMode === 'all' ? 'All starships' : viewMode === 'owned' ? 'Owned starships' : 'Missing starships'}
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <FontAwesomeIcon icon={faShoppingCart} className="fa-3x text-success mb-3" />
              <h5>Total Purchase Price</h5>
              <h3>{formatCurrency(totalPurchasePrice)}</h3>
              <div className="text-muted small">
                Owned starships only
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <FontAwesomeIcon icon={faChartLine} className="fa-3x text-info mb-3" />
              <h5>Total Market Value</h5>
              <h3>{formatCurrency(totalMarketValue)}</h3>
              <div className="text-muted small">
                Owned starships only
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <FontAwesomeIcon icon={faDollarSign} className="fa-3x text-warning mb-3" />
              <h5>Value Difference</h5>
              <h3>{formatCurrency(totalMarketValue - totalPurchasePrice)}</h3>
              <div className="text-muted small">
                Market Value - Purchase Price
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card>
        <Card.Header>
          <h5 className="mb-0">Price Details</h5>
        </Card.Header>
        <Card.Body>
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>Issue</th>
                <th>Edition</th>
                <th>Ship Name</th>
                <th>Retail Price (RRP)</th>
                <th>Purchase Price</th>
                <th>Market Value</th>
                <th>Profit/Loss</th>
              </tr>
            </thead>
            <tbody>
              {filteredStarships.map(ship => {
                const profitLoss = ship.owned 
                  ? (ship.marketValue || 0) - (ship.purchasePrice || 0)
                  : 0;
                
                return (
                  <tr key={ship._id}>
                    <td>{ship.issue}</td>
                    <td>{ship.edition}</td>
                    <td>{ship.shipName}</td>
                    <td>{formatCurrency(ship.retailPrice)}</td>
                    <td>{ship.owned ? formatCurrency(ship.purchasePrice) : '-'}</td>
                    <td>{ship.owned ? formatCurrency(ship.marketValue) : '-'}</td>
                    <td>
                      {ship.owned ? (
                        <span className={profitLoss > 0 ? 'text-success' : profitLoss < 0 ? 'text-danger' : ''}>
                          {formatCurrency(profitLoss)}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PriceVault; 