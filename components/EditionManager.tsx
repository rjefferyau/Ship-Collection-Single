import React, { useState, useEffect } from 'react';
import { Button, Form, ListGroup, Badge, Spinner, Alert, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSync, faMagic } from '@fortawesome/free-solid-svg-icons';

interface Edition {
  _id: string;
  name: string;
  description?: string;
}

const EditionManager: React.FC = () => {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form state
  const [editMode, setEditMode] = useState(false);
  const [currentEdition, setCurrentEdition] = useState<Edition | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editionToDelete, setEditionToDelete] = useState<Edition | null>(null);

  useEffect(() => {
    fetchEditions();
  }, []);

  const fetchEditions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/editions');
      const data = await res.json();
      
      if (data.success) {
        setEditions(data.data);
      } else {
        setError('Failed to fetch editions');
      }
    } catch (err) {
      setError('Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const editionData = {
        name,
        description: description || undefined
      };
      
      let url = '/api/editions';
      let method = 'POST';
      
      if (editMode && currentEdition) {
        url = `/api/editions/${currentEdition._id}`;
        method = 'PUT';
      }
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editionData),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess(editMode ? 'Edition updated successfully' : 'Edition added successfully');
        resetForm();
        fetchEditions();
      } else {
        setError(data.error || 'Failed to save edition');
      }
    } catch (err) {
      setError('Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (edition: Edition) => {
    setCurrentEdition(edition);
    setName(edition.name);
    setDescription(edition.description || '');
    setEditMode(true);
  };

  const confirmDelete = (edition: Edition) => {
    setEditionToDelete(edition);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!editionToDelete) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const res = await fetch(`/api/editions/${editionToDelete._id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess('Edition deleted successfully');
        fetchEditions();
      } else {
        setError(data.error || 'Failed to delete edition');
      }
    } catch (err) {
      setError('Error connecting to the server');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setEditionToDelete(null);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setEditMode(false);
    setCurrentEdition(null);
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      setImportStatus('Importing editions...');
      setError('');
      
      const res = await fetch('/api/editions/import', {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (data.success) {
        setImportStatus(`Import complete: Found ${data.data.totalUnique} unique editions, ${data.data.existing} already existed, imported ${data.data.imported} new editions.`);
        fetchEditions();
      } else {
        setError(data.error || 'Failed to import editions');
        setImportStatus('');
      }
    } catch (err) {
      setError('Error connecting to the server');
      setImportStatus('');
    } finally {
      setIsImporting(false);
    }
  };

  const handleUpdateStarships = async () => {
    try {
      setIsUpdating(true);
      setUpdateStatus('Updating starships with standardized edition names...');
      setError('');
      
      const res = await fetch('/api/starships/update-editions', {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (data.success) {
        setUpdateStatus(`Update complete: Processed ${data.data.total} starships, updated ${data.data.updated}, unchanged ${data.data.unchanged}, errors ${data.data.errors}.`);
      } else {
        setError(data.error || 'Failed to update starships');
        setUpdateStatus('');
      }
    } catch (err) {
      setError('Error connecting to the server');
      setUpdateStatus('');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="edition-manager">
      <h2>Manage Editions</h2>
      
      <div className="mb-4">
        <Button 
          variant="outline-primary" 
          className="me-2 mb-2"
          onClick={handleImport}
          disabled={isImporting}
        >
          {isImporting ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="ms-2">Importing...</span>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faSync} className="me-2" />
              Import Editions from Starships
            </>
          )}
        </Button>
        
        <Button 
          variant="outline-success" 
          className="mb-2"
          onClick={handleUpdateStarships}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="ms-2">Updating...</span>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faMagic} className="me-2" />
              Standardize Edition Names in Starships
            </>
          )}
        </Button>
      </div>
      
      {importStatus && <Alert variant="info" className="mb-3">{importStatus}</Alert>}
      {updateStatus && <Alert variant="info" className="mb-3">{updateStatus}</Alert>}
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
      {success && <Alert variant="success" className="mb-3">{success}</Alert>}
      
      <div className="row">
        <div className="col-md-6">
          <h3>Editions List</h3>
          {loading && !editions.length ? (
            <div className="text-center my-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : (
            <ListGroup className="mb-4">
              {editions.length === 0 ? (
                <ListGroup.Item>No editions found</ListGroup.Item>
              ) : (
                editions.map(edition => (
                  <ListGroup.Item key={edition._id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold">{edition.name}</div>
                      {edition.description && <small className="text-muted">{edition.description}</small>}
                    </div>
                    <div>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleEdit(edition)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => confirmDelete(edition)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          )}
        </div>
        
        <div className="col-md-6">
          <h3>{editMode ? 'Edit Edition' : 'Add New Edition'}</h3>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description (optional)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>
            
            <div className="d-flex">
              <Button 
                variant="primary" 
                type="submit" 
                className="me-2"
                disabled={loading}
              >
                {loading ? (
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    {editMode ? 'Update Edition' : 'Add Edition'}
                  </>
                )}
              </Button>
              
              {editMode && (
                <Button 
                  variant="secondary" 
                  onClick={resetForm}
                  disabled={loading}
                >
                  Cancel
                </Button>
              )}
            </div>
          </Form>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the edition "{editionToDelete?.name}"?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EditionManager; 