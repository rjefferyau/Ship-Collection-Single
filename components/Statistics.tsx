import React, { useState, useEffect } from 'react';
import { Card, Row, Col, ProgressBar, Form, Button, Badge, Dropdown, Modal, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShip, faCheck, faPercentage, faList, faSort, faChevronRight, faFilter, faSearch, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import DataTable from './DataTable';

interface Starship {
  _id: string;
  issue: string;
  edition: string;
  shipName: string;
  faction: string;
  releaseDate?: Date;
  imageUrl?: string;
  owned: boolean;
}

interface StatisticsProps {
  totalStarships: number;
  ownedStarships: number;
  factionBreakdown: { [key: string]: { total: number; owned: number } };
  editionBreakdown: { [key: string]: { total: number; owned: number } };
  viewMode?: 'all' | 'editions' | 'factions' | 'summary';
}

type SortOption = 'total-desc' | 'total-asc' | 'owned-desc' | 'owned-asc' | 'percentage-desc' | 'percentage-asc' | 'name-asc' | 'name-desc';

const Statistics: React.FC<StatisticsProps> = ({
  totalStarships,
  ownedStarships,
  factionBreakdown,
  editionBreakdown,
  viewMode = 'all'
}) => {
  const [editionSortOption, setEditionSortOption] = useState<SortOption>('total-desc');
  const [factionSortOption, setFactionSortOption] = useState<SortOption>('owned-desc');
  const [editionFilter, setEditionFilter] = useState('');
  const [factionFilter, setFactionFilter] = useState('');
  const [showEmptyEditions, setShowEmptyEditions] = useState(true);
  const [showEmptyFactions, setShowEmptyFactions] = useState(true);
  const [showAllFactionsModal, setShowAllFactionsModal] = useState(false);
  
  // New state for missing ships modal
  const [missingShips, setMissingShips] = useState<Starship[]>([]);
  const [showMissingShipsModal, setShowMissingShipsModal] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [loadingMissingShips, setLoadingMissingShips] = useState(false);
  const [missingShipsError, setMissingShipsError] = useState<string | null>(null);

  const ownedPercentage = totalStarships > 0 
    ? Math.round((ownedStarships / totalStarships) * 100) 
    : 0;

  const getSortFunction = (sortOption: SortOption) => {
    switch (sortOption) {
      case 'total-desc':
        return ([, a]: [string, { total: number; owned: number }], [, b]: [string, { total: number; owned: number }]) => b.total - a.total;
      case 'total-asc':
        return ([, a]: [string, { total: number; owned: number }], [, b]: [string, { total: number; owned: number }]) => a.total - b.total;
      case 'owned-desc':
        return ([, a]: [string, { total: number; owned: number }], [, b]: [string, { total: number; owned: number }]) => b.owned - a.owned;
      case 'owned-asc':
        return ([, a]: [string, { total: number; owned: number }], [, b]: [string, { total: number; owned: number }]) => a.owned - b.owned;
      case 'percentage-desc':
        return ([, a]: [string, { total: number; owned: number }], [, b]: [string, { total: number; owned: number }]) => 
          (b.total > 0 ? (b.owned / b.total) : 0) - (a.total > 0 ? (a.owned / a.total) : 0);
      case 'percentage-asc':
        return ([, a]: [string, { total: number; owned: number }], [, b]: [string, { total: number; owned: number }]) => 
          (a.total > 0 ? (a.owned / a.total) : 0) - (b.total > 0 ? (b.owned / b.total) : 0);
      case 'name-asc':
        return ([nameA]: [string, any], [nameB]: [string, any]) => nameA.localeCompare(nameB);
      case 'name-desc':
        return ([nameA]: [string, any], [nameB]: [string, any]) => nameB.localeCompare(nameA);
      default:
        return ([, a]: [string, { total: number; owned: number }], [, b]: [string, { total: number; owned: number }]) => b.total - a.total;
    }
  };

  const getProgressVariant = (percentage: number) => {
    if (percentage === 100) return "success";
    if (percentage >= 75) return "info";
    if (percentage >= 50) return "primary";
    if (percentage >= 25) return "warning";
    return "danger";
  };

  const filteredEditions = Object.entries(editionBreakdown)
    .filter(([edition]) => edition.toLowerCase().includes(editionFilter.toLowerCase()))
    .filter(([, data]) => showEmptyEditions || data.total > 0);

  const filteredFactions = Object.entries(factionBreakdown)
    .filter(([faction]) => faction.toLowerCase().includes(factionFilter.toLowerCase()))
    .filter(([, data]) => showEmptyFactions || data.total > 0);

  const sortedEditions = filteredEditions.sort(getSortFunction(editionSortOption));
  const sortedFactions = filteredFactions.sort(getSortFunction(factionSortOption));
  const topFactions = sortedFactions.slice(0, 6); // Only show top 6 factions on dashboard

  const getSortLabel = (sortOption: SortOption) => {
    switch (sortOption) {
      case 'total-desc': return 'Total (High to Low)';
      case 'total-asc': return 'Total (Low to High)';
      case 'owned-desc': return 'Owned (High to Low)';
      case 'owned-asc': return 'Owned (Low to High)';
      case 'percentage-desc': return 'Completion % (High to Low)';
      case 'percentage-asc': return 'Completion % (Low to High)';
      case 'name-asc': return 'Name (A to Z)';
      case 'name-desc': return 'Name (Z to A)';
      default: return 'Sort by';
    }
  };

  // Function to fetch missing ships for a specific edition or faction
  const fetchMissingShips = async (type: 'edition' | 'faction', name: string) => {
    setLoadingMissingShips(true);
    setMissingShipsError(null);
    setSelectedTitle(name);
    
    try {
      const response = await fetch('/api/starships');
      
      if (!response.ok) {
        throw new Error('Failed to fetch starships');
      }
      
      const data = await response.json();
      const starships = data.data || [];
      
      // Filter for missing ships (not owned) of the selected edition or faction
      const filtered = starships.filter((ship: Starship) => {
        if (type === 'edition') {
          return ship.edition === name && !ship.owned;
        } else {
          return ship.faction === name && !ship.owned;
        }
      });
      
      setMissingShips(filtered);
      setShowMissingShipsModal(true);
    } catch (err) {
      setMissingShipsError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoadingMissingShips(false);
    }
  };

  // Handle click on edition title
  const handleEditionClick = (edition: string) => {
    fetchMissingShips('edition', edition);
  };

  // Handle click on faction title
  const handleFactionClick = (faction: string) => {
    fetchMissingShips('faction', faction);
  };

  return (
    <div className="mb-4">
      {(viewMode === 'all' || viewMode === 'summary') && (
        <>
          <h3 className="mb-3">Collection Statistics</h3>
          
          <Row>
            <Col md={3} sm={6} className="mb-3">
              <Card className="h-100">
                <Card.Body className="text-center">
                  <FontAwesomeIcon icon={faList} size="2x" className="mb-2 text-primary" />
                  <h5>Total Starships</h5>
                  <div className="display-4">{totalStarships}</div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3} sm={6} className="mb-3">
              <Card className="h-100">
                <Card.Body className="text-center">
                  <FontAwesomeIcon icon={faCheck} size="2x" className="mb-2 text-success" />
                  <h5>Owned Starships</h5>
                  <div className="display-4">{ownedStarships}</div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} sm={12} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <div className="text-center">
                    <FontAwesomeIcon icon={faPercentage} size="2x" className="mb-2 text-info" />
                    <h5>Collection Completion</h5>
                  </div>
                  <div className="display-4 text-center mb-2">{ownedPercentage}%</div>
                  <ProgressBar 
                    now={ownedPercentage} 
                    variant={getProgressVariant(ownedPercentage)} 
                    className="mb-0"
                    style={{ height: '25px' }}
                  />
                  <div className="text-center mt-2">
                    <strong>{ownedStarships}</strong> of <strong>{totalStarships}</strong> starships owned
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
      
      {(viewMode === 'all' || viewMode === 'editions') && Object.keys(editionBreakdown).length > 0 && (
        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Edition Breakdown</h5>
            <div className="d-flex">
              <Form.Check 
                type="switch"
                id="show-empty-editions"
                label="Show Empty"
                checked={showEmptyEditions}
                onChange={(e) => setShowEmptyEditions(e.target.checked)}
                className="me-3"
              />
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" size="sm" id="edition-sort-dropdown">
                  <FontAwesomeIcon icon={faSort} className="me-1" />
                  {getSortLabel(editionSortOption)}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => setEditionSortOption('name-asc')}>Name (A to Z)</Dropdown.Item>
                  <Dropdown.Item onClick={() => setEditionSortOption('name-desc')}>Name (Z to A)</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => setEditionSortOption('total-desc')}>Total (High to Low)</Dropdown.Item>
                  <Dropdown.Item onClick={() => setEditionSortOption('total-asc')}>Total (Low to High)</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => setEditionSortOption('owned-desc')}>Owned (High to Low)</Dropdown.Item>
                  <Dropdown.Item onClick={() => setEditionSortOption('owned-asc')}>Owned (Low to High)</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => setEditionSortOption('percentage-desc')}>Completion % (High to Low)</Dropdown.Item>
                  <Dropdown.Item onClick={() => setEditionSortOption('percentage-asc')}>Completion % (Low to High)</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Filter editions..."
                value={editionFilter}
                onChange={(e) => setEditionFilter(e.target.value)}
                className="mb-3"
              />
            </Form.Group>
            <Row>
              {sortedEditions.map(([edition, data]) => {
                const percentage = data.total > 0 
                  ? Math.round((data.owned / data.total) * 100) 
                  : 0;
                  
                return (
                  <Col md={6} lg={4} key={edition} className="mb-4">
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <h6 className="d-flex justify-content-between align-items-center mb-2">
                          <span 
                            className="text-truncate cursor-pointer" 
                            title={`Click to see missing ships for ${edition}`}
                            onClick={() => handleEditionClick(edition)}
                            style={{ cursor: 'pointer', color: '#0d6efd', textDecoration: 'underline' }}
                          >
                            {edition}
                          </span>
                          <Badge bg={getProgressVariant(percentage)}>
                            {percentage}%
                          </Badge>
                        </h6>
                        <ProgressBar 
                          now={percentage} 
                          variant={getProgressVariant(percentage)} 
                          className="mb-2"
                          style={{ height: '20px' }}
                        />
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            <strong>{data.owned}</strong> of <strong>{data.total}</strong> owned
                          </small>
                          <small className="text-muted">
                            {data.total - data.owned} remaining
                          </small>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
              {sortedEditions.length === 0 && (
                <Col xs={12}>
                  <div className="text-center py-4">
                    <p className="text-muted">No editions match your filter criteria.</p>
                  </div>
                </Col>
              )}
            </Row>
          </Card.Body>
        </Card>
      )}
      
      {(viewMode === 'all' || viewMode === 'factions') && Object.keys(factionBreakdown).length > 0 && (
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Faction Breakdown</h5>
            <div className="d-flex">
              <Form.Check 
                type="switch"
                id="show-empty-factions"
                label="Show Empty"
                checked={showEmptyFactions}
                onChange={(e) => setShowEmptyFactions(e.target.checked)}
                className="me-3"
              />
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" size="sm" id="faction-sort-dropdown">
                  <FontAwesomeIcon icon={faSort} className="me-1" />
                  {getSortLabel(factionSortOption)}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => setFactionSortOption('name-asc')}>Name (A to Z)</Dropdown.Item>
                  <Dropdown.Item onClick={() => setFactionSortOption('name-desc')}>Name (Z to A)</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => setFactionSortOption('total-desc')}>Total (High to Low)</Dropdown.Item>
                  <Dropdown.Item onClick={() => setFactionSortOption('total-asc')}>Total (Low to High)</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => setFactionSortOption('owned-desc')}>Owned (High to Low)</Dropdown.Item>
                  <Dropdown.Item onClick={() => setFactionSortOption('owned-asc')}>Owned (Low to High)</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => setFactionSortOption('percentage-desc')}>Completion % (High to Low)</Dropdown.Item>
                  <Dropdown.Item onClick={() => setFactionSortOption('percentage-asc')}>Completion % (Low to High)</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </Card.Header>
          <Card.Body>
            <Row>
              {topFactions.map(([faction, data]) => {
                const percentage = data.total > 0 
                  ? Math.round((data.owned / data.total) * 100) 
                  : 0;
                  
                return (
                  <Col md={6} lg={4} key={faction} className="mb-4">
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <h6 className="d-flex justify-content-between align-items-center mb-2">
                          <span 
                            className="text-truncate cursor-pointer" 
                            title={`Click to see missing ships for ${faction}`}
                            onClick={() => handleFactionClick(faction)}
                            style={{ cursor: 'pointer', color: '#0d6efd', textDecoration: 'underline' }}
                          >
                            {faction}
                          </span>
                          <Badge bg={getProgressVariant(percentage)}>
                            {percentage}%
                          </Badge>
                        </h6>
                        <ProgressBar 
                          now={percentage} 
                          variant={getProgressVariant(percentage)} 
                          className="mb-2"
                          style={{ height: '20px' }}
                        />
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            <strong>{data.owned}</strong> of <strong>{data.total}</strong> owned
                          </small>
                          <small className="text-muted">
                            {data.total - data.owned} remaining
                          </small>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
              
              {topFactions.length === 0 && (
                <Col xs={12}>
                  <div className="text-center py-4">
                    <p className="text-muted">No factions match your filter criteria.</p>
                  </div>
                </Col>
              )}
            </Row>
            
            {sortedFactions.length > 6 && (
              <div className="text-center mt-2">
                <Button 
                  variant="outline-primary" 
                  onClick={() => setShowAllFactionsModal(true)}
                >
                  View All Factions <FontAwesomeIcon icon={faChevronRight} />
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      )}
      
      {/* Modal for showing all factions */}
      <Modal 
        show={showAllFactionsModal} 
        onHide={() => setShowAllFactionsModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>All Factions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Filter factions..."
              value={factionFilter}
              onChange={(e) => setFactionFilter(e.target.value)}
              className="mb-3"
            />
          </Form.Group>
          <Row>
            {sortedFactions.map(([faction, data]) => {
              const percentage = data.total > 0 
                ? Math.round((data.owned / data.total) * 100) 
                : 0;
                
              return (
                <Col md={6} lg={4} key={faction} className="mb-4">
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body>
                      <h6 className="d-flex justify-content-between align-items-center mb-2">
                        <span 
                          className="text-truncate cursor-pointer" 
                          title={`Click to see missing ships for ${faction}`}
                          onClick={() => handleFactionClick(faction)}
                          style={{ cursor: 'pointer', color: '#0d6efd', textDecoration: 'underline' }}
                        >
                          {faction}
                        </span>
                        <Badge bg={getProgressVariant(percentage)}>
                          {percentage}%
                        </Badge>
                      </h6>
                      <ProgressBar 
                        now={percentage} 
                        variant={getProgressVariant(percentage)} 
                        className="mb-2"
                        style={{ height: '20px' }}
                      />
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <strong>{data.owned}</strong> of <strong>{data.total}</strong> owned
                        </small>
                        <small className="text-muted">
                          {data.total - data.owned} remaining
                        </small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
            {sortedFactions.length === 0 && (
              <Col xs={12}>
                <div className="text-center py-4">
                  <p className="text-muted">No factions match your filter criteria.</p>
                </div>
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAllFactionsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* New Modal for showing missing ships */}
      <Modal 
        show={showMissingShipsModal} 
        onHide={() => setShowMissingShipsModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Missing Ships - {selectedTitle}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingMissingShips ? (
            <div className="text-center p-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading missing ships...</p>
            </div>
          ) : missingShipsError ? (
            <div className="alert alert-danger" role="alert">
              {missingShipsError}
            </div>
          ) : missingShips.length === 0 ? (
            <div className="text-center p-4">
              <FontAwesomeIcon icon={faCheck} size="3x" className="text-success mb-3" />
              <h5>Congratulations!</h5>
              <p>You own all ships in this category.</p>
            </div>
          ) : (
            <>
              <p>
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning me-2" />
                You are missing {missingShips.length} ships from this category.
              </p>
              <DataTable 
                id="missing-ships-table"
                striped
                hover
                responsive
                options={{
                  paging: true,
                  info: true,
                  lengthChange: true,
                  pageLength: 5
                }}
              >
                <thead>
                  <tr>
                    <th>Issue</th>
                    <th>Ship Name</th>
                    <th>Edition</th>
                    <th>Faction</th>
                  </tr>
                </thead>
                <tbody>
                  {missingShips.map(ship => (
                    <tr key={ship._id}>
                      <td>{ship.issue}</td>
                      <td>{ship.shipName}</td>
                      <td>{ship.edition}</td>
                      <td>{ship.faction}</td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMissingShipsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Statistics; 