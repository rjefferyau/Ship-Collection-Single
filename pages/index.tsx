import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Container, Row, Col, Tabs, Tab, Modal, Button, Nav, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faImages, faCog, faFileImport, faTable, faSpaceShuttle, faUsers, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

import StarshipList from '../components/StarshipList';
import StarshipDetails from '../components/StarshipDetails';
import AddStarshipForm from '../components/AddStarshipForm';
import Statistics from '../components/Statistics';
import FancyStarshipView from '../components/FancyStarshipView';

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

interface StatisticsData {
  totalStarships: number;
  ownedStarships: number;
  factionBreakdown: { [key: string]: { total: number; owned: number } };
  editionBreakdown: { [key: string]: { total: number; owned: number } };
}

const Home: React.FC = () => {
  const [starships, setStarships] = useState<Starship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStarship, setSelectedStarship] = useState<Starship | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('collection');
  const [currentEdition, setCurrentEdition] = useState<string>('Regular');
  const [viewMode, setViewMode] = useState<'editions' | 'factions' | 'all'>('all');
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalStarships: 0,
    ownedStarships: 0,
    factionBreakdown: {},
    editionBreakdown: {}
  });

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
      setStarships([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStarships();
  }, []);

  useEffect(() => {
    // Calculate statistics
    const totalStarships = starships.length;
    const ownedStarships = starships.filter(ship => ship.owned).length;
    
    const factionBreakdown: { [key: string]: { total: number; owned: number } } = {};
    const editionBreakdown: { [key: string]: { total: number; owned: number } } = {};
    
    starships.forEach(ship => {
      // Process faction breakdown
      if (ship.faction) {
        if (!factionBreakdown[ship.faction]) {
          factionBreakdown[ship.faction] = { total: 0, owned: 0 };
        }
        factionBreakdown[ship.faction].total += 1;
        if (ship.owned) {
          factionBreakdown[ship.faction].owned += 1;
        }
      }
      
      // Process edition breakdown
      if (ship.edition) {
        if (!editionBreakdown[ship.edition]) {
          editionBreakdown[ship.edition] = { total: 0, owned: 0 };
        }
        editionBreakdown[ship.edition].total += 1;
        if (ship.owned) {
          editionBreakdown[ship.edition].owned += 1;
        }
      }
    });
    
    setStatistics({
      totalStarships,
      ownedStarships,
      factionBreakdown,
      editionBreakdown
    });
  }, [starships]);

  const handleToggleOwned = async (id: string) => {
    try {
      const response = await fetch(`/api/starships/toggle-owned/${id}`, {
        method: 'PUT'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update ownership status');
      }
      
      // Update the starship in the local state
      setStarships(prevStarships => 
        prevStarships.map(ship => 
          ship._id === id ? { ...ship, owned: !ship.owned } : ship
        )
      );
      
      // If the selected starship is the one being updated, update it too
      if (selectedStarship && selectedStarship._id === id) {
        setSelectedStarship(prev => prev ? { ...prev, owned: !prev.owned } : null);
      }
    } catch (err) {
      console.error('Error toggling ownership:', err);
    }
  };

  const handleSelectStarship = (starship: Starship) => {
    setSelectedStarship(starship);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleTabChange = (tab: string | null) => {
    if (tab) {
      setActiveTab(tab);
    }
  };

  const handleRefreshStarships = async (edition?: string) => {
    await fetchStarships();
    // Close the modal after refresh
    setShowModal(false);
    
    // If an edition was passed, update the current edition
    if (edition) {
      setCurrentEdition(edition);
    }
  };

  const handleEditionChange = (edition: string) => {
    setCurrentEdition(edition);
  };

  return (
    <div>
      <Head>
        <title>Starship Collection Manager</title>
        <meta name="description" content="Manage your Star Trek starship collection" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <h1 className="display-4">Starship Collection Manager</h1>
            <p className="lead">
              Track, manage, and explore your Star Trek starship collection
            </p>
            <div className="mb-3 d-flex flex-wrap">
              <Link href="/setup" passHref>
                <Button variant="outline-secondary" className="me-2 mb-2">
                  <FontAwesomeIcon icon={faCog} className="me-2" />
                  Setup
                </Button>
              </Link>
              <Link href="/setup?tab=import" passHref>
                <Button variant="outline-info" className="me-2 mb-2">
                  <FontAwesomeIcon icon={faFileImport} className="me-2" />
                  Import/Export
                </Button>
              </Link>
            </div>
          </Col>
        </Row>

        <Tabs
          activeKey={activeTab}
          onSelect={handleTabChange}
          className="mb-4"
          fill
        >
          <Tab 
            eventKey="collection" 
            title={
              <span>
                <FontAwesomeIcon icon={faSpaceShuttle} className="me-2" />
                Collection
              </span>
            }
          >
            <Row>
              <Col lg={12}>
                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <Statistics 
                      totalStarships={statistics.totalStarships}
                      ownedStarships={statistics.ownedStarships}
                      factionBreakdown={statistics.factionBreakdown}
                      editionBreakdown={statistics.editionBreakdown}
                      viewMode="summary"
                    />
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            <Row>
              <Col lg={12}>
                {loading ? (
                  <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading starships...</p>
                  </div>
                ) : error ? (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                ) : (
                  <FancyStarshipView 
                    starships={starships}
                    onToggleOwned={handleToggleOwned}
                    onSelectStarship={handleSelectStarship}
                    onEditionChange={handleEditionChange}
                    currentEdition={currentEdition}
                  />
                )}
              </Col>
            </Row>
          </Tab>
          
          <Tab 
            eventKey="table" 
            title={
              <span>
                <FontAwesomeIcon icon={faTable} className="me-2" />
                Table View
              </span>
            }
          >
            <Row>
              <Col lg={12}>
                {loading ? (
                  <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading starships...</p>
                  </div>
                ) : error ? (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                ) : (
                  <StarshipList 
                    starships={starships}
                    onToggleOwned={handleToggleOwned}
                    onSelectStarship={handleSelectStarship}
                    onEditionChange={handleEditionChange}
                    currentEdition={currentEdition}
                  />
                )}
              </Col>
            </Row>
          </Tab>
          
          <Tab 
            eventKey="editions" 
            title={
              <span>
                <FontAwesomeIcon icon={faLayerGroup} className="me-2" />
                Editions
              </span>
            }
          >
            <Row>
              <Col lg={12}>
                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <h3 className="mb-4">Editions Breakdown</h3>
                    {loading ? (
                      <div className="text-center p-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : (
                      <Statistics 
                        totalStarships={statistics.totalStarships}
                        ownedStarships={statistics.ownedStarships}
                        factionBreakdown={{}}
                        editionBreakdown={statistics.editionBreakdown}
                        viewMode="editions"
                      />
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>
          
          <Tab 
            eventKey="factions" 
            title={
              <span>
                <FontAwesomeIcon icon={faUsers} className="me-2" />
                Factions
              </span>
            }
          >
            <Row>
              <Col lg={12}>
                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <h3 className="mb-4">Factions Breakdown</h3>
                    {loading ? (
                      <div className="text-center p-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : (
                      <Statistics 
                        totalStarships={statistics.totalStarships}
                        ownedStarships={statistics.ownedStarships}
                        factionBreakdown={statistics.factionBreakdown}
                        editionBreakdown={{}}
                        viewMode="factions"
                      />
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>
          
          <Tab 
            eventKey="add" 
            title={
              <span>
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Add Starship
              </span>
            }
          >
            <Row>
              <Col lg={12}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <AddStarshipForm onStarshipAdded={fetchStarships} />
                    <div className="mt-4 p-3 border rounded bg-light">
                      <h4>Need to import multiple starships?</h4>
                      <p>
                        You can import starships from a CSV file using our import tool.
                      </p>
                      <Link href="/setup?tab=import" passHref>
                        <Button variant="primary">
                          <FontAwesomeIcon icon={faFileImport} className="me-2" />
                          Go to Import/Export
                        </Button>
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>
        </Tabs>
      </Container>

      <Modal 
        show={showModal} 
        onHide={handleCloseModal}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Starship Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStarship && (
            <StarshipDetails 
              starship={selectedStarship}
              onToggleOwned={handleToggleOwned}
              onRefresh={handleRefreshStarships}
              currentEdition={currentEdition}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            <FontAwesomeIcon icon={faTimes} className="me-2" />
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Home; 