import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faUpload, faSpinner, faEdit, faSave, faUndo, faPlus } from '@fortawesome/free-solid-svg-icons';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Omit<Starship, '_id' | 'owned'>>({
    issue: starship.issue,
    edition: starship.edition,
    shipName: starship.shipName,
    faction: starship.faction,
    releaseDate: starship.releaseDate,
    imageUrl: starship.imageUrl
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [loadingFactions, setLoadingFactions] = useState(false);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loadingEditions, setLoadingEditions] = useState(false);

  // Fetch factions and editions when entering edit mode
  useEffect(() => {
    if (isEditing) {
      fetchFactions();
      fetchEditions();
    }
  }, [isEditing]);

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

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'releaseDate' && value ? new Date(value) : value
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/starships/${starship._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update starship');
      }

      setSaveSuccess(true);
      setIsEditing(false);
      onRefresh(); // Refresh to get updated starship data
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({
      issue: starship.issue,
      edition: starship.edition,
      shipName: starship.shipName,
      faction: starship.faction,
      releaseDate: starship.releaseDate,
      imageUrl: starship.imageUrl
    });
    setSaveError(null);
  };

  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  // Format date for input field
  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="mb-4">
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Issue {starship.issue}</h5>
          <div>
            <Button 
              variant={starship.owned ? "success" : "outline-secondary"}
              size="sm"
              onClick={() => onToggleOwned(starship._id)}
              className="me-2"
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
            {!isEditing ? (
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <FontAwesomeIcon icon={faEdit} /> Edit
              </Button>
            ) : (
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={handleCancelEdit}
              >
                <FontAwesomeIcon icon={faUndo} /> Cancel
              </Button>
            )}
          </div>
        </Card.Header>
        
        <Card.Body>
          {saveError && <Alert variant="danger">{saveError}</Alert>}
          {saveSuccess && <Alert variant="success">Starship updated successfully!</Alert>}
          
          {!isEditing ? (
            <Row>
              <Col md={starship.imageUrl ? 7 : 12}>
                <dl className="row">
                  <dt className="col-sm-4">Ship Name:</dt>
                  <dd className="col-sm-8">{starship.shipName}</dd>
                  
                  <dt className="col-sm-4">Issue:</dt>
                  <dd className="col-sm-8">{starship.issue}</dd>
                  
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
          ) : (
            <Form onSubmit={handleEditSubmit}>
              <Row>
                <Col md={starship.imageUrl ? 7 : 12}>
                  <Form.Group className="mb-3" controlId="formShipName">
                    <Form.Label>Ship Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="shipName"
                      value={editFormData.shipName}
                      onChange={handleEditChange}
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3" controlId="formIssue">
                    <Form.Label>Issue</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="issue"
                      value={editFormData.issue}
                      onChange={handleEditChange}
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3" controlId="formEdition">
                    <Form.Label>Edition</Form.Label>
                    <div className="d-flex">
                      <Form.Select
                        name="edition"
                        value={editFormData.edition}
                        onChange={handleEditChange}
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
                  
                  <Form.Group className="mb-3" controlId="formFaction">
                    <Form.Label>Race/Faction</Form.Label>
                    <div className="d-flex">
                      <Form.Select
                        name="faction"
                        value={editFormData.faction}
                        onChange={handleEditChange}
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
                        onClick={() => window.open('/setup', '_blank')}
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
                  
                  <Form.Group className="mb-3" controlId="formReleaseDate">
                    <Form.Label>Release Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      name="releaseDate"
                      value={formatDateForInput(editFormData.releaseDate)}
                      onChange={handleEditChange}
                    />
                  </Form.Group>
                  
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={saving}
                    className="mt-2"
                  >
                    {saving ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} className="me-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
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
            </Form>
          )}
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