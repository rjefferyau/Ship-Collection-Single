import React, { useState } from 'react';
import { Card, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faUpload, faSpinner } from '@fortawesome/free-solid-svg-icons';

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

interface StarshipDetailsProps {
  starship: Starship;
  onToggleOwned: (id: string) => Promise<void>;
  onRefresh: () => void;
}

const StarshipDetails: React.FC<StarshipDetailsProps> = ({ 
  starship, 
  onToggleOwned,
  onRefresh
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('image', files[0]);
    formData.append('starshipId', starship._id);

    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }

      setUploadSuccess(true);
      onRefresh(); // Refresh to get updated starship data with new image URL
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setUploading(false);
    }
  };

  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="mb-4">
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{starship.issue}</h5>
          <Button 
            variant={starship.owned ? "success" : "outline-secondary"}
            size="sm"
            onClick={() => onToggleOwned(starship._id)}
          >
            {starship.owned ? (
              <>
                <FontAwesomeIcon icon={faCheck} /> Owned
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faTimes} /> Not Owned
              </>
            )}
          </Button>
        </Card.Header>
        
        <Card.Body>
          <Row>
            <Col md={starship.imageUrl ? 7 : 12}>
              <dl className="row">
                <dt className="col-sm-4">Ship Name:</dt>
                <dd className="col-sm-8">{starship.shipName}</dd>
                
                <dt className="col-sm-4">Edition:</dt>
                <dd className="col-sm-8">{starship.edition}</dd>
                
                <dt className="col-sm-4">Race/Faction:</dt>
                <dd className="col-sm-8">{starship.faction}</dd>
                
                <dt className="col-sm-4">Release Date:</dt>
                <dd className="col-sm-8">{formatDate(starship.releaseDate)}</dd>
              </dl>
            </Col>
            
            {starship.imageUrl && (
              <Col md={5} className="text-center">
                <img 
                  src={starship.imageUrl} 
                  alt={`${starship.shipName}`} 
                  className="img-fluid rounded" 
                  style={{ maxHeight: '250px', maxWidth: '100%' }}
                />
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Header>
          <h6 className="mb-0">Upload Image</h6>
        </Card.Header>
        <Card.Body>
          {uploadError && <Alert variant="danger">{uploadError}</Alert>}
          {uploadSuccess && <Alert variant="success">Image uploaded successfully!</Alert>}
          
          <Form.Group controlId={`formFile-${starship._id}`}>
            <div className="d-flex">
              <Form.Control 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="me-2"
              />
              {uploading && (
                <div className="d-flex align-items-center">
                  <FontAwesomeIcon icon={faSpinner} spin />
                </div>
              )}
            </div>
          </Form.Group>
        </Card.Body>
      </Card>
    </div>
  );
};

export default StarshipDetails; 