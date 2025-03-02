import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Row, Col, Modal, Button, Spinner, Alert, Breadcrumb, Card } from 'react-bootstrap';
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
    <>
      <Head>
        <title>Gallery - Starship Collection Manager</title>
      </Head>

      <div className="mb-4">
        <Breadcrumb>
          <Breadcrumb.Item>
            <Link href="/" className="text-decoration-none">
              <FontAwesomeIcon icon={faHome} className="me-2" />
              Home
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item active>Gallery</Breadcrumb.Item>
        </Breadcrumb>
        <h1>Gallery View</h1>
      </div>

      <Card className="mb-4">
        <Card.Body>
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-3">Loading starships...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <FancyStarshipView
              starships={starships}
              onToggleOwned={handleToggleOwned}
              onSelectStarship={handleSelectStarship}
              onEditionChange={handleEditionChange}
              currentEdition={currentEdition}
            />
          )}
        </Card.Body>
      </Card>

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

export default FancyViewPage; 