import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Container, Row, Col, Modal, Button, Spinner, Alert, Breadcrumb } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faTimes, faSpaceShuttle } from '@fortawesome/free-solid-svg-icons';

import FancyStarshipView from '../components/FancyStarshipView';
import StarshipDetails from '../components/StarshipDetails';

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

const FancyViewPage: React.FC = () => {
  const [starships, setStarships] = useState<Starship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStarship, setSelectedStarship] = useState<Starship | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentEdition, setCurrentEdition] = useState<string>('Regular');

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

  const handleEditionChange = (edition: string) => {
    setCurrentEdition(edition);
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

  return (
    <div>
      <Head>
        <title>Fancy View - Starship Collection Manager</title>
        <meta name="description" content="Visual gallery of your Star Trek starship collection" />
      </Head>

      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <Breadcrumb>
              <Breadcrumb.Item linkAs={Link} href="/">
                <FontAwesomeIcon icon={faHome} className="me-1" /> Home
              </Breadcrumb.Item>
              <Breadcrumb.Item active>
                <FontAwesomeIcon icon={faSpaceShuttle} className="me-1" /> Fancy View
              </Breadcrumb.Item>
            </Breadcrumb>
            
            <h1 className="display-4">Starship Gallery</h1>
            <p className="lead">
              A visual showcase of your Star Trek starship collection
            </p>
          </Col>
        </Row>

        <Row>
          <Col>
            {loading ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading starships...</p>
              </div>
            ) : error ? (
              <Alert variant="danger">
                {error}
              </Alert>
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

export default FancyViewPage; 