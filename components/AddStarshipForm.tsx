import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

interface Faction {
  _id: string;
  name: string;
  description?: string;
}

interface Edition {
  _id: string;
  name: string;
  description?: string;
}

interface StarshipFormData {
  issue: string;
  edition: string;
  shipName: string;
  faction: string;
  releaseDate?: string;
  imageUrl?: string;
  owned: boolean;
}

interface AddStarshipFormProps {
  onStarshipAdded: () => void;
}

const AddStarshipForm: React.FC<AddStarshipFormProps> = ({ onStarshipAdded }) => {
  const initialFormData: StarshipFormData = {
    issue: '',
    edition: '',
    shipName: '',
    faction: '',
    releaseDate: '',
    imageUrl: '',
    owned: false
  };

  const [formData, setFormData] = useState<StarshipFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [loadingFactions, setLoadingFactions] = useState(false);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loadingEditions, setLoadingEditions] = useState(false);

  // Fetch factions and editions on component mount
  useEffect(() => {
    fetchFactions();
    fetchEditions();
  }, []);

  const fetchFactions = async () => {
    setLoadingFactions(true);
    
    try {
      const response = await fetch('/api/factions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch factions');
      }
      
      const data = await response.json();
      setFactions(data.data || []);
    } catch (err) {
      console.error('Error fetching factions:', err);
    } finally {
      setLoadingFactions(false);
    }
  };

  const fetchEditions = async () => {
    setLoadingEditions(true);
    
    try {
      const response = await fetch('/api/editions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch editions');
      }
      
      const data = await response.json();
      setEditions(data.data || []);
    } catch (err) {
      console.error('Error fetching editions:', err);
    } finally {
      setLoadingEditions(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.issue.trim() || !formData.edition.trim() || !formData.shipName.trim() || !formData.faction.trim()) {
      setError('Issue, Edition, Ship Name, and Race/Faction are required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Format the date for MongoDB
      let formattedData: Partial<StarshipFormData> = { ...formData };
      
      // Handle the release date
      if (formData.releaseDate && formData.releaseDate.trim() !== '') {
        try {
          // Try to parse the date
          const date = new Date(formData.releaseDate);
          if (!isNaN(date.getTime())) {
            formattedData.releaseDate = date.toISOString();
          } else {
            formattedData.releaseDate = undefined;
          }
        } catch (e) {
          formattedData.releaseDate = undefined;
        }
      } else {
        formattedData.releaseDate = undefined;
      }

      const response = await fetch('/api/starships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add starship');
      }

      setSuccess('Starship added successfully!');
      setFormData(initialFormData);
      onStarshipAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-4 p-3 border rounded">
      <h3>Add New Starship</h3>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Issue</Form.Label>
              <Form.Control
                type="text"
                name="issue"
                value={formData.issue}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Edition</Form.Label>
              <div className="d-flex">
                <Form.Select
                  name="edition"
                  value={formData.edition}
                  onChange={handleChange}
                  required
                  disabled={loadingEditions}
                  className="me-2"
                >
                  <option value="">Select an edition</option>
                  {editions.map(edition => (
                    <option key={edition._id} value={edition.name}>
                      {edition.name}
                    </option>
                  ))}
                </Form.Select>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => window.open('/setup?tab=editions', '_blank')}
                  title="Manage editions"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </Button>
              </div>
              {loadingEditions && (
                <div className="mt-2">
                  <Spinner animation="border" size="sm" /> Loading editions...
                </div>
              )}
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Ship Name</Form.Label>
              <Form.Control
                type="text"
                name="shipName"
                value={formData.shipName}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Race/Faction</Form.Label>
              <div className="d-flex">
                <Form.Select
                  name="faction"
                  value={formData.faction}
                  onChange={handleChange}
                  required
                  disabled={loadingFactions}
                  className="me-2"
                >
                  <option value="">Select a faction</option>
                  {factions.map(faction => (
                    <option key={faction._id} value={faction.name}>
                      {faction.name}
                    </option>
                  ))}
                </Form.Select>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => window.open('/setup?tab=factions', '_blank')}
                  title="Manage factions"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </Button>
              </div>
              {loadingFactions && (
                <div className="mt-2">
                  <Spinner animation="border" size="sm" /> Loading factions...
                </div>
              )}
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Release Date</Form.Label>
              <Form.Control
                type="date"
                name="releaseDate"
                value={formData.releaseDate || ''}
                onChange={handleChange}
              />
              <Form.Text className="text-muted">
                Format: YYYY-MM-DD
              </Form.Text>
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control
                type="text"
                name="imageUrl"
                value={formData.imageUrl || ''}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            label="Owned"
            name="owned"
            checked={formData.owned}
            onChange={handleChange}
          />
        </Form.Group>

        <Button 
          variant="primary" 
          type="submit" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Adding...
            </>
          ) : 'Add Starship'}
        </Button>
      </Form>
    </div>
  );
};

export default AddStarshipForm; 