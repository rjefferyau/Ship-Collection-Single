import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Breadcrumb, Card, Nav, Tab, Button, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faDollarSign, faSync, faTag } from '@fortawesome/free-solid-svg-icons';

import PriceVault from '../components/PriceVault';

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

const PriceVaultPage: React.FC = () => {
  const [starships, setStarships] = useState<Starship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'owned' | 'missing'>('all');
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

  useEffect(() => {
    fetchStarships();
  }, []);

  const fetchStarships = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/starships');
      
      if (!response.ok) {
        throw new Error('Failed to fetch starships');
      }
      
      const data = await response.json();
      setStarships(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPurchasePrices = async () => {
    setIsUpdatingPrices(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/starships/update-purchase-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to update purchase prices');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Updated purchase prices for ${data.modifiedCount} owned starships to match their RRP.`);
        // Refresh the starships data to show the updated prices
        fetchStarships();
      } else {
        setError(data.error || 'Failed to update purchase prices');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  return (
    <>
      <Head>
        <title>Price Vault - Starship Collection Manager</title>
      </Head>

      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h1>Price Vault</h1>
          <Breadcrumb>
            <Link href="/" passHref legacyBehavior>
              <Breadcrumb.Item>
                <FontAwesomeIcon icon={faHome} className="me-2" /> Home
              </Breadcrumb.Item>
            </Link>
            <Breadcrumb.Item active>
              <FontAwesomeIcon icon={faDollarSign} className="me-2" /> Price Vault
            </Breadcrumb.Item>
          </Breadcrumb>
        </div>
        <div>
          <Button 
            variant="outline-primary"
            onClick={handleSetPurchasePrices}
            disabled={isUpdatingPrices || loading}
            title="Set purchase prices equal to RRP for all owned ships that don't have a purchase price set"
          >
            {isUpdatingPrices ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating Prices...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faTag} className="me-2" />
                Set Purchase = RRP
              </>
            )}
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      {success && <Alert variant="success" className="mb-4">{success}</Alert>}

      <Card className="mb-4">
        <Card.Header>
          <Nav variant="tabs" className="card-header-tabs" onSelect={(k) => setViewMode(k as any)}>
            <Nav.Item>
              <Nav.Link active={viewMode === 'all'} eventKey="all">
                All Starships
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link active={viewMode === 'owned'} eventKey="owned">
                Owned Only
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link active={viewMode === 'missing'} eventKey="missing">
                Missing Only
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading price data...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : (
            <PriceVault
              starships={starships}
              viewMode={viewMode}
            />
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default PriceVaultPage; 