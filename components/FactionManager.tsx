import React, { useState, useEffect, Fragment } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSave, faTimes, faCheck, faDownload, faSync, faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

interface Faction {
  _id: string;
  name: string;
  description?: string;
  franchise: string;
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
  const [availableFranchises, setAvailableFranchises] = useState<string[]>(['Star Trek', 'Battlestar Galactica', 'Star Wars', 'Marvel', 'DC']);
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
        description: faction.description,
        franchise: faction.franchise || 'Star Trek'
      });
    } else {
      setEditingFaction({ name: '', description: '', franchise: 'Star Trek' });
    }
    setShowModal(true);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFaction(null);
    setFormError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h5 className="text-lg font-medium text-gray-900 mb-0">Manage Factions/Races</h5>
          <div className="flex space-x-2">
            <button 
              className={`px-3 py-1.5 text-sm border border-gray-300 rounded-md flex items-center ${
                importStatus.loading ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={handleImportFactions}
              disabled={importStatus.loading}
              title="Import existing factions from starship collection"
            >
              {importStatus.loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                  Import Existing
                </>
              )}
            </button>
            <button 
              className={`px-3 py-1.5 text-sm border border-gray-300 rounded-md flex items-center ${
                standardizeStatus.loading || factions.length === 0 ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50 border-blue-300'
              }`}
              onClick={handleStandardizeFactions}
              disabled={standardizeStatus.loading || factions.length === 0}
              title="Update all starships to use standardized faction names"
            >
              {standardizeStatus.loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Standardizing...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSync} className="mr-2" />
                  Standardize Names
                </>
              )}
            </button>
            <button 
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
              onClick={() => handleOpenModal()}
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add New Faction
            </button>
          </div>
        </div>
        <div className="p-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {importStatus.error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{importStatus.error}</span>
              <button
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                onClick={() => setImportStatus(prev => ({ ...prev, error: null }))}
              >
                <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {importStatus.result && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <div>
                <strong className="font-bold">Import completed:</strong>
                <ul className="mt-1 mb-0 ml-5 list-disc">
                  <li>Total unique factions found: {importStatus.result.total}</li>
                  <li>Already in database: {importStatus.result.existing}</li>
                  <li>Newly imported: {importStatus.result.imported}</li>
                </ul>
              </div>
              <button
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                onClick={() => setImportStatus(prev => ({ ...prev, result: null }))}
              >
                <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {standardizeStatus.error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{standardizeStatus.error}</span>
              <button
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                onClick={() => setStandardizeStatus(prev => ({ ...prev, error: null }))}
              >
                <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {standardizeStatus.result && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <div>
                <strong className="font-bold">Standardization completed:</strong>
                <ul className="mt-1 mb-0 ml-5 list-disc">
                  <li>Total starships processed: {standardizeStatus.result.total}</li>
                  <li>Updated with standardized names: {standardizeStatus.result.updated}</li>
                  <li>Already using standard names: {standardizeStatus.result.unchanged}</li>
                  {standardizeStatus.result.errors > 0 && (
                    <li className="text-red-600">Errors encountered: {standardizeStatus.result.errors}</li>
                  )}
                </ul>
              </div>
              <button
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                onClick={() => setStandardizeStatus(prev => ({ ...prev, result: null }))}
              >
                <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {loading ? (
            <div className="text-center p-4">
              <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-gray-600">Loading factions...</p>
            </div>
          ) : factions.length === 0 ? (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faInfoCircle} className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm">
                    No factions found. Click "Add New Faction" to create one or "Import Existing" to import from your starship collection.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table 
                id="factions-table"
                className="min-w-full divide-y divide-gray-200"
              >
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Franchise</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {factions.map(faction => (
                    <tr key={faction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{faction.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {faction.description || '-'}
                        {faction.description?.includes('Imported from starship collection') && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Imported
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{faction.franchise || 'Star Trek'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button 
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50"
                            onClick={() => handleOpenModal(faction)}
                            title="Edit faction"
                          >
                            <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                          </button>
                          
                          {deleteConfirmation === faction._id ? (
                            <>
                              <button 
                                className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                                onClick={() => handleDelete(faction._id)}
                                title="Confirm delete"
                              >
                                <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                              </button>
                              <button 
                                className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-50"
                                onClick={handleCancelDelete}
                                title="Cancel delete"
                              >
                                <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button 
                              className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                              onClick={() => handleDeleteConfirm(faction._id)}
                              title="Delete faction"
                            >
                              <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Tailwind Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={handleCloseModal}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              {/* Modal header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {editingFaction && editingFaction._id ? 'Edit Faction' : 'Add New Faction'}
                </h3>
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={handleCloseModal}
                >
                  <span className="sr-only">Close</span>
                  <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                </button>
              </div>
              
              {/* Modal body */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                {formError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{formError}</span>
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="factionName" className="block text-sm font-medium text-gray-700 mb-1">
                      Faction Name
                    </label>
                    <input 
                      type="text" 
                      id="factionName"
                      name="name"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={editingFaction?.name || ''}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter faction name"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="factionDescription" className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea 
                      id="factionDescription"
                      name="description"
                      rows={3}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={editingFaction?.description || ''}
                      onChange={handleInputChange}
                      placeholder="Enter faction description"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="factionFranchise" className="block text-sm font-medium text-gray-700 mb-1">
                      Franchise
                    </label>
                    <select 
                      id="factionFranchise"
                      name="franchise"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={editingFaction?.franchise || 'Star Trek'}
                      onChange={handleInputChange}
                    >
                      {availableFranchises.map(franchise => (
                        <option key={franchise} value={franchise}>{franchise}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button 
                      type="submit"
                      className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm ${
                        isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faSave} className="mr-2" />
                          Save
                        </>
                      )}
                    </button>
                    <button 
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                      onClick={handleCloseModal}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactionManager; 