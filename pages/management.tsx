import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form } from 'react-bootstrap';
import InsuranceReport from '../components/InsuranceReport';
import ConditionTracker from '../components/ConditionTracker';
import { Starship } from './api/starships';

const ManagementPage: React.FC = () => {
  const [starships, setStarships] = useState<Starship[]>([]);
  const [selectedStarshipId, setSelectedStarshipId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerInfo, setOwnerInfo] = useState({
    name: 'Your Name',
    address: 'Your Address',
    email: 'your.email@example.com',
    phone: '123-456-7890'
  });
  
  useEffect(() => {
    const fetchStarships = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/starships');
        if (!response.ok) {
          throw new Error('Failed to fetch starships');
        }
        const result = await response.json();
        // Handle the API response format which includes { success: true, data: [...] }
        const data = result.data || [];
        setStarships(data);
        
        // Select the first owned starship by default
        const ownedShips = data.filter((ship: Starship) => ship.owned);
        if (ownedShips.length > 0) {
          setSelectedStarshipId(ownedShips[0]._id);
        }
      } catch (error) {
        console.error('Error fetching starships:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStarships();
  }, []);
  
  const handleStarshipUpdate = async (updatedData: Partial<Starship>) => {
    if (!selectedStarshipId) return;
    
    try {
      const response = await fetch(`/api/starships/${selectedStarshipId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update starship');
      }
      
      const result = await response.json();
      const updatedStarship = result.data;
      
      // Update the starship in the local state
      setStarships(starships.map(ship => 
        ship._id === selectedStarshipId ? { ...ship, ...updatedData } : ship
      ));
      
      return updatedStarship;
    } catch (error) {
      console.error('Error updating starship:', error);
      throw error;
    }
  };
  
  const selectedStarship = starships.find(ship => ship._id === selectedStarshipId);
  
  return (
    <Container fluid>
      <h1 className="mb-4">Management</h1>
      
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>Owner Information</Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={ownerInfo.name}
                        onChange={(e) => setOwnerInfo({...ownerInfo, name: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control 
                        type="email" 
                        value={ownerInfo.email}
                        onChange={(e) => setOwnerInfo({...ownerInfo, email: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={ownerInfo.address}
                        onChange={(e) => setOwnerInfo({...ownerInfo, address: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={ownerInfo.phone}
                        onChange={(e) => setOwnerInfo({...ownerInfo, phone: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col>
          <InsuranceReport 
            starships={starships} 
            ownerInfo={ownerInfo} 
          />
        </Col>
      </Row>
      
      <Row>
        <Col md={4}>
          <Card>
            <Card.Header>Your Starships</Card.Header>
            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {isLoading ? (
                <p>Loading starships...</p>
              ) : (
                <>
                  {starships.filter(ship => ship.owned).length === 0 ? (
                    <p>No owned starships found. Add some to your collection first!</p>
                  ) : (
                    <Form.Group>
                      <Form.Label>Select a starship to manage</Form.Label>
                      <Form.Select
                        value={selectedStarshipId || ''}
                        onChange={(e) => setSelectedStarshipId(e.target.value)}
                      >
                        {starships
                          .filter(ship => ship.owned)
                          .map(ship => (
                            <option key={ship._id} value={ship._id}>
                              {ship.shipName} (Issue {ship.issue})
                            </option>
                          ))}
                      </Form.Select>
                    </Form.Group>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          {selectedStarship && (
            <ConditionTracker 
              starship={selectedStarship}
              onUpdate={handleStarshipUpdate}
            />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ManagementPage; 