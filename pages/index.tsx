import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Row, Col, Modal, Button, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faImages } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

import StarshipList from '../components/StarshipList';
import StarshipDetails from '../components/StarshipDetails';
import AddStarshipForm from '../components/AddStarshipForm';

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

const Home: React.FC = () => {
  const [starships, setStarships] = useState<Starship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStarship, setSelectedStarship] = useState<Starship | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
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
  };

  const handleRefreshStarships = async (edition?: string) => {
    await fetchStarships();
    // Close the add modal after refresh
    setShowAddModal(false);
    
    // If an edition was passed, update the current edition
    if (edition) {
      setCurrentEdition(edition);
    }
  };

  const handleEditionChange = (edition: string) => {
    setCurrentEdition(edition);
  };

  return (
    <>
      <Head>
        <title>Starship Collection Manager</title>
      </Head>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Starship Collection Manager</h1>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <FontAwesomeIcon icon={faPlus} /> Add New Starship
        </Button>
      </div>
      
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  {/* Removing the Fancy View button */}
                </div>
                <div>
                  {/* ... existing filter controls ... */}
                </div>
              </div>
              <StarshipList
                starships={starships}
                onToggleOwned={handleToggleOwned}
                onSelectStarship={handleSelectStarship}
                onEditionChange={handleEditionChange}
                currentEdition={currentEdition}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal for adding a new starship */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Starship</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AddStarshipForm onStarshipAdded={handleRefreshStarships} />
        </Modal.Body>
      </Modal>

      {/* Modal for starship details */}
      <Modal show={!!selectedStarship} onHide={() => setSelectedStarship(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedStarship?.shipName} - {selectedStarship?.edition} #{selectedStarship?.issue}
          </Modal.Title>
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
      </Modal>
    </>
  );
};

export default Home; 