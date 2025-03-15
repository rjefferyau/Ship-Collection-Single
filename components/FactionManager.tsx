import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Alert, Spinner, Card, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSave, faTimes, faCheck, faDownload, faSync } from '@fortawesome/free-solid-svg-icons';

interface Faction {
  _id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ImportResult {
  total: number;
  existing: number;
  imported: number;
  factions: Faction[];
}

interface StandardizeResult {
  total: number;
  updated: number;
  unchanged: number;
  errors: number;
}

const FactionManager: React.FC = () => {
  const [factions, setFactions] = useState<Faction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingFaction, setEditingFaction] = useState<Partial<Faction> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ loading: boolean; result: ImportResult | null; error: string | null }>({
    loading: false,
    result: null,
    error: null
  });
  const [standardizeStatus, setStandardizeStatus] = useState<{ loading: boolean; result: StandardizeResult | null; error: string | null }>({
    loading: false,
    result: null,
    error: null
  });

  // Fetch factions on component mount
  useEffect(() => {
    fetchFactions();
  }, []);

  const fetchFactions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/factions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch factions');
      }
      
      const data = await response.json();
      setFactions(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (faction?: Faction) => {
    if (faction) {
      setEditingFaction({
        _id: faction._id,
        name: faction.name,
        description: faction.description
      });
    } else {
      setEditingFaction({ name: '', description: '' });
    }
    setShowModal(true);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFaction(null);
    setFormError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditingFaction(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingFaction || !editingFaction.name) {
      setFormError('Faction name is required');
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      const isEditing = editingFaction._id;
      const url = isEditing 
        ? `/api/factions/${editingFaction._id}` 
        : '/api/factions';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingFaction),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} faction`);
      }
      
      // Refresh the factions list
      await fetchFactions();
      
      // Close the modal
      handleCloseModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = (factionId: string) => {
    setDeleteConfirmation(factionId);
  };

  const handleDelete = async (factionId: string) => {
    try {
      const response = await fetch(`/api/factions/${factionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete faction');
      }
      
      // Refresh the factions list
      await fetchFactions();
      
      // Clear the delete confirmation
      setDeleteConfirmation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const handleImportFactions = async () => {
    setImportStatus({
      loading: true,
      result: null,
      error: null
    });

    try {
      const response = await fetch('/api/factions/import', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to import factions');
      }
      
      const data = await response.json();
      
      setImportStatus({
        loading: false,
        result: data.data,
        error: null
      });
      
      // Refresh the factions list
      await fetchFactions();
      
      // Auto-clear the import status after 5 seconds
      setTimeout(() => {
        setImportStatus(prev => ({
          ...prev,
          result: null
        }));
      }, 5000);
    } catch (err) {
      setImportStatus({
        loading: false,
        result: null,
        error: err instanceof Error ? err.message : 'An unknown error occurred'
      });
    }
  };

  const handleStandardizeFactions = async () => {
    setStandardizeStatus({
      loading: true,
      result: null,
      error: null
    });

    try {
      const response = await fetch('/api/starships/update-factions', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to standardize faction names');
      }
      
      const data = await response.json();
      
      setStandardizeStatus({
        loading: false,
        result: data.data,
        error: null
      });
      
      // Auto-clear the standardize status after 5 seconds
      setTimeout(() => {
        setStandardizeStatus(prev => ({
          ...prev,
          result: null
        }));
      }, 5000);
    } catch (err) {
      setStandardizeStatus({
        loading: false,
        result: null,
        error: err instanceof Error ? err.message : 'An unknown error occurred'
      });
    }
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Manage Factions/Races</h5>
          <div>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={handleImportFactions}
              disabled={importStatus.loading}
              className="me-2"
              title="Import existing factions from starship collection"
            >
              {importStatus.loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Importing...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faDownload} className="me-2" />
                  Import Existing
                </>
              )}
            </Button>
            <Button 
              variant="outline-info" 
              size="sm" 
              onClick={handleStandardizeFactions}
              disabled={standardizeStatus.loading || factions.length === 0}
              className="me-2"
              title="Update all starships to use standardized faction names"
            >
              {standardizeStatus.loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Standardizing...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSync} className="me-2" />
                  Standardize Names
                </>
              )}
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => handleOpenModal()}
            >
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Add New Faction
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {importStatus.error && (
            <Alert variant="danger" dismissible onClose={() => setImportStatus(prev => ({ ...prev, error: null }))}>
              {importStatus.error}
            </Alert>
          )}
          
          {importStatus.result && (
            <Alert variant="success" dismissible onClose={() => setImportStatus(prev => ({ ...prev, result: null }))}>
              <div>
                <strong>Import completed:</strong>
                <ul className="mb-0 mt-1">
                  <li>Total unique factions found: {importStatus.result.total}</li>
                  <li>Already in database: {importStatus.result.existing}</li>
                  <li>Newly imported: {importStatus.result.imported}</li>
                </ul>
              </div>
            </Alert>
          )}
          
          {standardizeStatus.error && (
            <Alert variant="danger" dismissible onClose={() => setStandardizeStatus(prev => ({ ...prev, error: null }))}>
              {standardizeStatus.error}
            </Alert>
          )}
          
          {standardizeStatus.result && (
            <Alert variant="success" dismissible onClose={() => setStandardizeStatus(prev => ({ ...prev, result: null }))}>
              <div>
                <strong>Standardization completed:</strong>
                <ul className="mb-0 mt-1">
                  <li>Total starships processed: {standardizeStatus.result.total}</li>
                  <li>Updated with standardized names: {standardizeStatus.result.updated}</li>
                  <li>Already using standard names: {standardizeStatus.result.unchanged}</li>
                  {standardizeStatus.result.errors > 0 && (
                    <li className="text-danger">Errors encountered: {standardizeStatus.result.errors}</li>
                  )}
                </ul>
              </div>
            </Alert>
          )}
          
          {loading ? (
            <div className="text-center p-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading factions...</p>
            </div>
          ) : factions.length === 0 ? (
            <Alert variant="info">
              No factions found. Click "Add New Faction" to create one or "Import Existing" to import from your starship collection.
            </Alert>
          ) : (
            <Table 
              id="factions-table"
              striped
              bordered
              hover
              responsive
            >
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th style={{ width: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {factions.map(faction => (
                  <tr key={faction._id}>
                    <td>{faction.name}</td>
                    <td>
                      {faction.description || '-'}
                      {faction.description?.includes('Imported from starship collection') && (
                        <Badge bg="info" className="ms-2">Imported</Badge>
                      )}
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleOpenModal(faction)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Button>
                      
                      {deleteConfirmation === faction._id ? (
                        <>
                          <Button 
                            variant="danger" 
                            size="sm" 
                            className="me-1"
                            onClick={() => handleDelete(faction._id)}
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={handleCancelDelete}
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDeleteConfirm(faction._id)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingFaction && editingFaction._id ? 'Edit Faction' : 'Add New Faction'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="factionName">
              <Form.Label>Faction Name</Form.Label>
              <Form.Control 
                type="text" 
                name="name"
                value={editingFaction?.name || ''}
                onChange={handleInputChange}
                required
                placeholder="Enter faction name"
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="factionDescription">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                name="description"
                value={editingFaction?.description || ''}
                onChange={handleInputChange}
                placeholder="Enter faction description"
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                onClick={handleCloseModal}
                className="me-2"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
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
                    Saving...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="me-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default FactionManager; 