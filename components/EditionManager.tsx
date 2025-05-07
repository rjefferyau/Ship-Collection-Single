import React, { useState, useEffect, useRef, Fragment } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSync, faMagic, faDollarSign, faRefresh, faUpload, faDownload, faFileAlt, faTimes, faExclamationTriangle, faInfoCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

interface Edition {
  _id: string;
  name: string;
  internalName: string;
  description?: string;
  retailPrice?: number;
  franchise: string;
  isDefault?: boolean;
}

interface Franchise {
  _id: string;
  name: string;
  description?: string;
}

interface CollectionType {
  _id: string;
  name: string;
  description?: string;
}

const EditionManager: React.FC = () => {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [filteredEditions, setFilteredEditions] = useState<Edition[]>([]);
  const [selectedFranchiseFilter, setSelectedFranchiseFilter] = useState<string>('');
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
  
  // Franchises and Collection Types
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loadingFranchises, setLoadingFranchises] = useState(false);
  const [collectionTypes, setCollectionTypes] = useState<CollectionType[]>([]);
  const [loadingCollectionTypes, setLoadingCollectionTypes] = useState(false);

  // Form state
  const [editMode, setEditMode] = useState(false);
  const [currentEdition, setCurrentEdition] = useState<Edition | null>(null);
  const [name, setName] = useState('');
  const [internalName, setInternalName] = useState('');
  const [description, setDescription] = useState('');
  const [retailPrice, setRetailPrice] = useState<string>('');
  const [franchise, setFranchise] = useState('');
  const [autoGenerateInternalName, setAutoGenerateInternalName] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editionToDelete, setEditionToDelete] = useState<Edition | null>(null);

  useEffect(() => {
    fetchEditions();
    fetchFranchises();
    fetchCollectionTypes();
  }, []);

  // Apply franchise filter when editions or selected franchise changes
  useEffect(() => {
    if (selectedFranchiseFilter) {
      setFilteredEditions(editions.filter(edition => 
        edition.franchise === selectedFranchiseFilter
      ));
    } else {
      setFilteredEditions(editions);
    }
  }, [editions, selectedFranchiseFilter]);

  const fetchEditions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/editions');
      const data = await res.json();
      
      if (data.success) {
        setEditions(data.data);
        // Initial filtered editions will be set by the useEffect
      } else {
        setError(data.error || 'Failed to fetch editions');
      }
    } catch (err) {
      setError('Error fetching editions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFranchises = async () => {
    try {
      setLoadingFranchises(true);
      const res = await fetch('/api/franchises');
      const data = await res.json();
      
      if (data.success) {
        setFranchises(data.data);
        // Set default franchise if none is selected and franchises are available
        if (!franchise && data.data.length > 0) {
          setFranchise(data.data[0].name);
        }
      } else {
        setError('Failed to fetch franchises');
      }
    } catch (err) {
      setError('Error connecting to the server');
    } finally {
      setLoadingFranchises(false);
    }
  };

  const fetchCollectionTypes = async () => {
    try {
      setLoadingCollectionTypes(true);
      const res = await fetch('/api/collection-types');
      const data = await res.json();
      
      if (data.success) {
        setCollectionTypes(data.data);
      } else {
        setError('Failed to fetch collection types');
      }
    } catch (err) {
      setError('Error connecting to the server');
    } finally {
      setLoadingCollectionTypes(false);
    }
  };

  // Function to generate internal name from name and franchise
  const generateInternalName = (editionName: string, franchiseName: string) => {
    if (!editionName || !franchiseName) return '';
    const nameSlug = editionName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const franchiseSlug = franchiseName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    return `${nameSlug}-${franchiseSlug}`;
  };

  // Update internal name when name or franchise changes
  useEffect(() => {
    if (autoGenerateInternalName) {
      setInternalName(generateInternalName(name, franchise));
    }
  }, [name, franchise, autoGenerateInternalName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    if (!name) {
      setError('Edition name is required');
      return;
    }

    if (!franchise) {
      setError('Franchise is required');
      return;
    }

    if (!internalName) {
      setError('Internal name is required');
      return;
    }

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
          internalName,
          description,
          retailPrice: retailPrice ? parseFloat(retailPrice) : null,
          franchise,
          isDefault
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
        // Handle MongoDB duplicate key error
        if (data.error && typeof data.error === 'object') {
          if (data.error.code === 11000) {
            setError(`An edition with this name already exists. Please use a different name.`);
          } else if (data.error.message) {
            setError(data.error.message);
          } else {
            setError('Failed to save edition: ' + JSON.stringify(data.error));
          }
        } else {
          setError(data.error || 'Failed to save edition');
        }
      }
    } catch (err) {
      setError('Error connecting to the server');
    }
  };

  const handleEdit = (edition: Edition) => {
    if (!edition || !edition._id) {
      setError('Error! Could not find edition. It may have been deleted.');
      return;
    }
    
    // First, verify this edition still exists in the database
    fetch(`/api/editions/${edition._id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Edition not found in database. It may have been deleted or restored from a backup.');
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          // Proceed with edit using the fresh data from the database
          const freshEdition = data.data;
          setCurrentEdition(freshEdition);
          setEditMode(true);
          setName(freshEdition.name);
          setInternalName(freshEdition.internalName || '');
          setDescription(freshEdition.description || '');
          setRetailPrice(freshEdition.retailPrice?.toString() || '');
          setFranchise(freshEdition.franchise || '');
          setIsDefault(freshEdition.isDefault || false);
          setAutoGenerateInternalName(false);
          
          // Clear any previous errors
          setError('');
        } else {
          setError(data.error || 'Failed to fetch edition details');
        }
      })
      .catch(err => {
        console.error('Error fetching edition:', err);
        setError(`${err.message || 'Error fetching edition'} Try refreshing the page to get the latest data.`);
        // Refresh the editions list to ensure UI is in sync with database
        fetchEditions();
      });
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
    setEditMode(false);
    setCurrentEdition(null);
    setName('');
    setInternalName('');
    setDescription('');
    setRetailPrice('');
    setFranchise(franchises.length > 0 ? franchises[0].name : '');
    setIsDefault(false);
    setAutoGenerateInternalName(true);
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
      setError('This edition does not have a retail price set');
      return;
    }
    
    try {
      setIsUpdatingPrices(true);
      setPriceUpdateStatus('');
      
      const response = await fetch(`/api/editions/${edition._id}/update-prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          retailPrice: edition.retailPrice
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPriceUpdateStatus(`Successfully updated prices for ${data.updatedCount} starships`);
      } else {
        setError(data.error || 'Failed to update prices');
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

  const handleSetDefault = async (edition: Edition) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Make sure we have a valid ID
      if (!edition._id) {
        setError('Invalid edition ID');
        return;
      }
      
      console.log('Setting default edition with ID:', edition._id);
      
      // First fetch the edition to make sure it exists
      const checkResponse = await fetch(`/api/editions/${edition._id}`);
      if (!checkResponse.ok) {
        setError('Could not find edition. It may have been deleted or restored from a backup. Try refreshing the page.');
        // Refresh the editions list
        fetchEditions();
        return;
      }
      
      const checkData = await checkResponse.json();
      if (!checkData.success) {
        setError(checkData.error || 'Could not verify edition exists');
        return;
      }
      
      const response = await fetch(`/api/editions/${edition._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          isDefault: true
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`${edition.name} set as default edition for ${edition.franchise}`);
        fetchEditions();
      } else {
        setError(data.error || 'Failed to set default edition');
      }
    } catch (err) {
      console.error('Error setting default edition:', err);
      setError('Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <button 
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError('')}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> {success}</span>
          <button 
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setSuccess('')}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      {/* Edition Form */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {editMode ? 'Edit Edition' : 'Add New Edition'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Edition Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            {/* Franchise */}
            <div>
              <label htmlFor="franchise" className="block text-sm font-medium text-gray-700 mb-1">
                Franchise <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <select
                  id="franchise"
                  value={franchise}
                  onChange={(e) => setFranchise(e.target.value)}
                  required
                  disabled={loadingFranchises}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 mr-2"
                >
                  <option value="">Select a franchise</option>
                  {franchises.map((f) => (
                    <option key={f._id} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => window.open('/franchise-setup', '_blank')}
                  title="Manage franchises"
                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
              {loadingFranchises && (
                <div className="mt-1 text-sm text-gray-500">
                  <FontAwesomeIcon icon={faSync} className="animate-spin mr-1" /> Loading franchises...
                </div>
              )}
            </div>
          </div>

          {/* Internal Name */}
          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="internalName" className="block text-sm font-medium text-gray-700 mb-1">
                Internal Name <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoGenerateInternalName"
                  checked={autoGenerateInternalName}
                  onChange={(e) => setAutoGenerateInternalName(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="autoGenerateInternalName" className="ml-2 block text-xs text-gray-600">
                  Auto-generate
                </label>
              </div>
            </div>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                id="internalName"
                value={internalName}
                onChange={(e) => setInternalName(e.target.value)}
                disabled={autoGenerateInternalName}
                required
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  autoGenerateInternalName ? 'bg-gray-100' : ''
                }`}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              This is the unique identifier used internally. It must be unique across all franchises.
            </p>
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          {/* Retail Price */}
          <div>
            <label htmlFor="retailPrice" className="block text-sm font-medium text-gray-700 mb-1">
              Retail Price (RRP)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="retailPrice"
                value={retailPrice}
                onChange={(e) => setRetailPrice(e.target.value)}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="block w-full pl-7 pr-12 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          {/* Default Edition Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
              Set as default edition (shown by default on the collection page)
            </label>
          </div>
          
          {/* Update Starship Prices Checkbox - Only show when editing */}
          {editMode && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="updateStarshipPrices"
                checked={updateStarshipPrices}
                onChange={(e) => setUpdateStarshipPrices(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="updateStarshipPrices" className="ml-2 block text-sm text-gray-900">
                Update retail price for all starships in this edition
              </label>
            </div>
          )}
          
          {/* Form Actions */}
          <div className="flex justify-between pt-4">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {editMode ? 'Update Edition' : 'Add Edition'}
            </button>
            
            {editMode && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Editions List */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Editions
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Manage editions for your collection
              </p>
            </div>
            
            {/* Franchise Filter */}
            <div className="mt-3 md:mt-0">
              <label htmlFor="franchiseFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Franchise
              </label>
              <select
                id="franchiseFilter"
                className="block w-full md:w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={selectedFranchiseFilter}
                onChange={(e) => setSelectedFranchiseFilter(e.target.value)}
              >
                <option value="">All Franchises</option>
                {franchises.map((f) => (
                  <option key={f._id} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="p-4 text-center">
            <FontAwesomeIcon icon={faSync} className="animate-spin mr-2" />
            Loading editions...
          </div>
        ) : filteredEditions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {selectedFranchiseFilter 
              ? `No editions found for ${selectedFranchiseFilter}. Add your first edition above.`
              : 'No editions found. Add your first edition above.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Franchise
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Internal Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retail Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Default
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEditions.map((edition) => (
                  <tr key={edition._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {edition.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {edition.franchise || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {edition.internalName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {edition.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {edition.retailPrice ? `$${edition.retailPrice.toFixed(2)}` : 'Not set'}
                      {edition.retailPrice && (
                        <button
                          onClick={() => handleUpdatePrices(edition)}
                          disabled={isUpdatingPrices}
                          title="Update starship prices with this RRP"
                          className="ml-2 text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                        >
                          <FontAwesomeIcon icon={faDollarSign} />
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {edition.isDefault ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FontAwesomeIcon icon={faCheckCircle} className="mr-1" /> Default
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            console.log('Setting default edition:', edition);
                            handleSetDefault(edition);
                          }}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                          title="Set as default edition"
                        >
                          Set Default
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(edition)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => confirmDelete(edition)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Utility Actions */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Utilities</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <FontAwesomeIcon icon={faSync} className="animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                  Import Editions
                </>
              )}
            </button>
            {importStatus && (
              <p className="mt-2 text-sm text-gray-600">{importStatus}</p>
            )}
          </div>
          
          <div>
            <button
              onClick={handleUpdateStarships}
              disabled={isUpdating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <FontAwesomeIcon icon={faSync} className="animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faMagic} className="mr-2" />
                  Standardize Editions
                </>
              )}
            </button>
            {updateStatus && (
              <p className="mt-2 text-sm text-gray-600">{updateStatus}</p>
            )}
          </div>
        </div>
        
        {priceUpdateStatus && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
            {priceUpdateStatus}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">Delete Edition</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the edition "{editionToDelete?.name}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center gap-4 mt-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditionManager; 