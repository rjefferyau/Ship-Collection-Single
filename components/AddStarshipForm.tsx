import React, { useState } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
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
              <Form.Control
                type="text"
                name="edition"
                value={formData.edition}
                onChange={handleChange}
                required
              />
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
              <Form.Control
                type="text"
                name="faction"
                value={formData.faction}
                onChange={handleChange}
                required
              />
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
          {isSubmitting ? 'Adding...' : 'Add Starship'}
        </Button>
      </Form>
    </div>
  );
};

export default AddStarshipForm; 