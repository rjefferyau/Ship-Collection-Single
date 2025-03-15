import React, { useState, useEffect, useRef, Fragment } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSync, faMagic, faDollarSign, faRefresh, faUpload, faDownload, faFileAlt, faTimes, faExclamationTriangle, faInfoCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

interface Edition {
  _id: string;
  name: string;
  description?: string;
  retailPrice?: number;
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
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [priceUpdateStatus, setPriceUpdateStatus] = useState('');
  const [updateStarshipPrices, setUpdateStarshipPrices] = useState(false);
  const [csvUploadStatus, setCsvUploadStatus] = useState('');
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCsvModal, setShowCsvModal] = useState(false);

  // Form state
  const [editMode, setEditMode] = useState(false);
  const [currentEdition, setCurrentEdition] = useState<Edition | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [retailPrice, setRetailPrice] = useState<string>('');

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
    setError('');
    setSuccess('');

    try {
      const endpoint = editMode && currentEdition 
        ? `/api/editions/${currentEdition._id}${updateStarshipPrices ? '?updateStarships=true' : ''}` 
        : '/api/editions';
      
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          description,
          retailPrice: retailPrice ? parseFloat(retailPrice) : null
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(editMode 
          ? `Edition updated successfully!${updateStarshipPrices ? ' Starship prices have been updated.' : ''}` 
          : 'Edition added successfully!');
        resetForm();
        fetchEditions();
      } else {
        setError(data.error || 'Failed to save edition');
      }
    } catch (err) {
      setError('Error connecting to the server');
    }
  };

  const handleEdit = (edition: Edition) => {
    setCurrentEdition(edition);
    setName(edition.name);
    setDescription(edition.description || '');
    setRetailPrice(edition.retailPrice?.toString() || '');
    setEditMode(true);
    setUpdateStarshipPrices(false);
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
    setCurrentEdition(null);
    setName('');
    setDescription('');
    setRetailPrice('');
    setEditMode(false);
    setUpdateStarshipPrices(false);
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

  const handleUpdatePrices = async (edition: Edition) => {
    if (!edition.retailPrice) {
      setError('This edition does not have a retail price set.');
      return;
    }

    try {
      setIsUpdatingPrices(true);
      setPriceUpdateStatus('');
      setError('');
      setSuccess('');

      const response = await fetch('/api/editions/update-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          editionName: edition.name,
          retailPrice: edition.retailPrice
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPriceUpdateStatus(`Updated retail price for ${data.modifiedCount} starships in ${edition.name} edition.`);
        setSuccess(`Updated retail price for ${data.modifiedCount} starships in ${edition.name} edition.`);
      } else {
        setError(data.error || 'Failed to update starship prices');
      }
    } catch (err) {
      setError('Error connecting to the server');
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's a CSV file
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    try {
      setIsUploadingCsv(true);
      setCsvUploadStatus('Uploading and processing CSV...');
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/editions/import-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setCsvUploadStatus(`CSV import complete: Imported ${data.imported} editions, ${data.errors} errors.`);
        setSuccess(`Successfully imported ${data.imported} editions from CSV.`);
        fetchEditions();
      } else {
        setError(data.error || 'Failed to import editions from CSV');
        setCsvUploadStatus('');
      }
    } catch (err) {
      setError('Error uploading or processing the CSV file');
      setCsvUploadStatus('');
    } finally {
      setIsUploadingCsv(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadSampleCsv = () => {
    const sampleData = 'name,description,retailPrice\n' +
      'Regular,Standard edition ships,14.99\n' +
      'Special,Limited edition ships,19.99\n' +
      'XL,Extra large ships,49.99\n';
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_editions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="edition-manager">
      <h2>Manage Editions</h2>
      
      <div className="mb-4">
        <button 
          className="btn btn-outline-primary me-2 mb-2"
          onClick={handleImport}
          disabled={isImporting}
        >
          {isImporting ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span className="ms-2">Importing...</span>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faSync} className="me-2" />
              Import Editions from Starships
            </>
          )}
        </button>
        
        <button 
          className="btn btn-outline-success me-2 mb-2"
          onClick={handleUpdateStarships}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span className="ms-2">Updating...</span>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faMagic} className="me-2" />
              Standardize Edition Names in Starships
            </>
          )}
        </button>

        <button 
          className="btn btn-outline-info mb-2"
          onClick={() => setShowCsvModal(true)}
        >
          <FontAwesomeIcon icon={faUpload} className="me-2" />
          Import Editions from CSV
        </button>
      </div>
      
      {importStatus && <div className="alert alert-info mb-3">{importStatus}</div>}
      {updateStatus && <div className="alert alert-info mb-3">{updateStatus}</div>}
      {priceUpdateStatus && <div className="alert alert-info mb-3">{priceUpdateStatus}</div>}
      {csvUploadStatus && <div className="alert alert-info mb-3">{csvUploadStatus}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}
      {success && <div className="alert alert-success mb-3">{success}</div>}
      
      <div className="row">
        <div className="col-md-6">
          <h3>Editions List</h3>
          {loading && !editions.length ? (
            <div className="text-center my-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="list-group mb-4">
              {editions.length === 0 ? (
                <div className="list-group-item">No editions found</div>
              ) : (
                editions.map(edition => (
                  <div key={edition._id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold">{edition.name}</div>
                      {edition.description && <small className="text-muted">{edition.description}</small>}
                      {edition.retailPrice && (
                        <div>
                          <small className="text-muted">
                            <FontAwesomeIcon icon={faDollarSign} className="me-1" />
                            RRP: ${edition.retailPrice.toFixed(2)}
                          </small>
                        </div>
                      )}
                    </div>
                    <div>
                      {edition.retailPrice && (
                        <button 
                          className="btn btn-outline-success btn-sm me-2"
                          onClick={() => handleUpdatePrices(edition)}
                          disabled={isUpdatingPrices}
                          title="Update all starships in this edition with this retail price"
                        >
                          {isUpdatingPrices ? (
                            <div className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
                          ) : (
                            <FontAwesomeIcon icon={faRefresh} />
                          )}
                        </button>
                      )}
                      <button 
                        className="btn btn-outline-primary btn-sm me-2"
                        onClick={() => handleEdit(edition)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => confirmDelete(edition)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        <div className="col-md-6">
          <h3>{editMode ? 'Edit Edition' : 'Add New Edition'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="editionName" className="form-label">Name</label>
              <input 
                type="text" 
                className="form-control" 
                id="editionName" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="editionDescription" className="form-label">Description (optional)</label>
              <textarea 
                className="form-control" 
                id="editionDescription" 
                rows="3" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
            
            <div className="mb-3">
              <label htmlFor="editionRetailPrice" className="form-label">Collection Retail Price (RRP)</label>
              <div className="input-group">
                <span className="input-group-text">
                  <FontAwesomeIcon icon={faDollarSign} />
                </span>
                <input 
                  type="number" 
                  className="form-control" 
                  id="editionRetailPrice" 
                  placeholder="Enter retail price (optional)" 
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(e.target.value)}
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="form-text">
                This will be used as the default RRP for starships in this edition
              </div>
            </div>
            
            {editMode && retailPrice && (
              <div className="mb-3">
                <input 
                  type="checkbox"
                  className="form-check-input"
                  id="updateStarshipPrices"
                  checked={updateStarshipPrices}
                  onChange={(e) => setUpdateStarshipPrices(e.target.checked)}
                />
                <label htmlFor="updateStarshipPrices" className="form-check-label">
                  Update all starships in this edition with this retail price
                </label>
                <div className="form-text">
                  This will only update starships that don't already have a retail price set
                </div>
              </div>
            )}
            
            <div className="d-flex justify-content-between">
              <button type="submit" className="btn btn-primary">
                {editMode ? 'Update Edition' : 'Add Edition'}
              </button>
              {editMode && (
                <button type="reset" className="btn btn-secondary">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      
      {/* CSV Upload Modal */}
      <div className="modal" style={{ display: showCsvModal ? 'block' : 'none' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Import Editions from CSV</h5>
              <button type="button" className="btn-close" onClick={() => setShowCsvModal(false)}></button>
            </div>
            <div className="modal-body">
              <p>Upload a CSV file with edition data to import multiple editions at once.</p>
              
              <div className="card mb-3">
                <div className="card-header">CSV Format</div>
                <div className="card-body">
                  <p>Your CSV file should have the following columns:</p>
                  <ul>
                    <li><strong>name</strong> (required): The name of the edition</li>
                    <li><strong>description</strong> (optional): A description of the edition</li>
                    <li><strong>retailPrice</strong> (optional): The retail price of ships in this edition</li>
                  </ul>
                  
                  <div className="bg-light p-2 rounded mb-3">
                    <pre className="mb-0">
                      name,description,retailPrice<br/>
                      Regular,Standard edition ships,14.99<br/>
                      Special,Limited edition ships,19.99<br/>
                      XL,Extra large ships,49.99
                    </pre>
                  </div>
                  
                  <button 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={downloadSampleCsv}
                  >
                    <FontAwesomeIcon icon={faDownload} className="me-2" />
                    Download Sample CSV
                  </button>
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="csvFileUpload" className="form-label">Select CSV File</label>
                <input 
                  type="file" 
                  className="form-control" 
                  id="csvFileUpload" 
                  accept=".csv" 
                  onChange={handleCsvUpload}
                  ref={fileInputRef}
                  disabled={isUploadingCsv}
                />
                <div className="form-text">
                  Only CSV files are supported
                </div>
              </div>
              
              {isUploadingCsv && (
                <div className="text-center my-3">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Uploading...</span>
                  </div>
                  <p className="mt-2">Uploading and processing your CSV file...</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCsvModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className="modal" style={{ display: showDeleteModal ? 'block' : 'none' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm Delete</h5>
              <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
            </div>
            <div className="modal-body">
              Are you sure you want to delete the edition "{editionToDelete?.name}"?
              This action cannot be undone.
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditionManager; 