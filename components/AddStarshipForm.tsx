import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSpinner, faSave, faUndo } from '@fortawesome/free-solid-svg-icons';

interface Faction {
  _id: string;
  name: string;
  description?: string;
  franchise?: string; // Associated franchise
}

interface Edition {
  _id: string;
  name: string;
  internalName: string; // Internal unique identifier
  description?: string;
  retailPrice?: number;
  franchise: string; // Associated franchise
}

interface CollectionType {
  _id: string;
  name: string;
  description?: string;
}

interface Franchise {
  _id: string;
  name: string;
  description?: string;
  collectionType?: string; // Associated collection type
}

interface Manufacturer {
  _id: string;
  name: string;
  description?: string;
  website?: string;
  country?: string;
  franchises?: string[];
}

interface StarshipFormData {
  issue: string;
  edition: string;
  editionDisplayName?: string;
  shipName: string;
  faction: string;
  collectionType: string;
  franchise: string;
  manufacturer?: string;
  releaseDate?: string;
  imageUrl?: string;
  magazinePdfUrl?: string;
  owned: boolean;
  retailPrice?: number;
  purchasePrice?: number;
  marketValue?: number;
}

interface AddStarshipFormProps {
  onStarshipAdded: () => void;
  defaultCollectionType?: string;
  defaultFranchise?: string;
}

const AddStarshipForm: React.FC<AddStarshipFormProps> = ({ 
  onStarshipAdded, 
  defaultCollectionType,
  defaultFranchise 
}) => {
  const initialFormData: StarshipFormData = {
    issue: '',
    edition: '',
    editionDisplayName: '',
    shipName: '',
    faction: '',
    collectionType: defaultCollectionType || '',
    franchise: defaultFranchise || '',
    manufacturer: '',
    releaseDate: '',
    imageUrl: '',
    magazinePdfUrl: '',
    owned: false,
    retailPrice: undefined,
    purchasePrice: undefined,
    marketValue: undefined
  };

  const [formData, setFormData] = useState<StarshipFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Data states
  const [allFactions, setAllFactions] = useState<Faction[]>([]);
  const [allEditions, setAllEditions] = useState<Edition[]>([]);
  const [allCollectionTypes, setAllCollectionTypes] = useState<CollectionType[]>([]);
  const [allFranchises, setAllFranchises] = useState<Franchise[]>([]);
  const [allManufacturers, setAllManufacturers] = useState<Manufacturer[]>([]);
  
  // Filtered data states
  const [availableFranchises, setAvailableFranchises] = useState<Franchise[]>([]);
  const [availableFactions, setAvailableFactions] = useState<Faction[]>([]);
  const [availableEditions, setAvailableEditions] = useState<Edition[]>([]);
  const [availableManufacturers, setAvailableManufacturers] = useState<Manufacturer[]>([]);
  
  // Loading states
  const [loadingFactions, setLoadingFactions] = useState(false);
  const [loadingEditions, setLoadingEditions] = useState(false);
  const [loadingCollectionTypes, setLoadingCollectionTypes] = useState(false);
  const [loadingFranchises, setLoadingFranchises] = useState(false);
  const [loadingManufacturers, setLoadingManufacturers] = useState(false);

  // Fetch all data on component mount
  useEffect(() => {
    fetchCollectionTypes();
    fetchFranchises();
    fetchFactions();
    fetchEditions();
    fetchManufacturers();
  }, []);

  // Filter franchises when collection type changes
  useEffect(() => {
    if (formData.collectionType && allFranchises.length > 0) {
      // Filter franchises based on collection type
      // For now, we'll show all franchises since we don't have the association data yet
      setAvailableFranchises(allFranchises);
      
      // Reset franchise selection if the current selection is not valid for this collection type
      if (formData.franchise) {
        const isValidFranchise = allFranchises.some(f => f.name === formData.franchise);
        if (!isValidFranchise) {
          setFormData(prev => ({ ...prev, franchise: '' }));
        }
      }
    } else {
      setAvailableFranchises([]);
      setFormData(prev => ({ ...prev, franchise: '' }));
    }
  }, [formData.collectionType, allFranchises]);

  // Filter factions and editions when franchise changes
  useEffect(() => {
    if (formData.franchise) {
      // Filter factions based on franchise
      const filteredFactions = allFactions.filter(f => 
        !f.franchise || f.franchise === formData.franchise
      );
      setAvailableFactions(filteredFactions);
      
      // Filter editions based on franchise
      const filteredEditions = allEditions.filter(e => 
        e.franchise === formData.franchise
      );
      setAvailableEditions(filteredEditions);
      
      // Reset faction and edition selections if they're not valid for this franchise
      if (formData.faction) {
        const isValidFaction = filteredFactions.some(f => f.name === formData.faction);
        if (!isValidFaction) {
          setFormData(prev => ({ ...prev, faction: '' }));
        }
      }
      
      if (formData.edition) {
        const isValidEdition = filteredEditions.some(e => e.name === formData.edition);
        if (!isValidEdition) {
          setFormData(prev => ({ ...prev, edition: '' }));
        }
      }
    } else {
      setAvailableFactions([]);
      setAvailableEditions([]);
      setFormData(prev => ({ ...prev, faction: '', edition: '' }));
    }
  }, [formData.franchise, allFactions, allEditions]);

  // Set default values when data is loaded
  useEffect(() => {
    if (allCollectionTypes.length > 0 && !formData.collectionType && defaultCollectionType) {
      const defaultType = allCollectionTypes.find(t => t.name === defaultCollectionType)?.name || allCollectionTypes[0].name;
      setFormData(prev => ({ ...prev, collectionType: defaultType }));
    }
  }, [allCollectionTypes, defaultCollectionType]);

  useEffect(() => {
    if (availableFranchises.length > 0 && !formData.franchise && defaultFranchise) {
      const defaultFranchiseValue = availableFranchises.find(f => f.name === defaultFranchise)?.name || '';
      if (defaultFranchiseValue) {
        setFormData(prev => ({ ...prev, franchise: defaultFranchiseValue }));
      }
    }
  }, [availableFranchises, defaultFranchise]);

  // Add fetchManufacturers function
  const fetchManufacturers = async () => {
    setLoadingManufacturers(true);
    
    try {
      const response = await fetch('/api/manufacturers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch manufacturers');
      }
      
      const data = await response.json();
      setAllManufacturers(data.data || []);
      setAvailableManufacturers(data.data || []);
    } catch (err) {
      console.error('Error fetching manufacturers:', err);
    } finally {
      setLoadingManufacturers(false);
    }
  };

  // Update useEffect for franchise changes to filter manufacturers
  useEffect(() => {
    if (formData.franchise) {
      // Filter manufacturers by franchise if available
      const filteredManufacturers = allManufacturers.filter(
        manufacturer => !manufacturer.franchises || 
                        manufacturer.franchises.length === 0 || 
                        manufacturer.franchises.includes(formData.franchise)
      );
      setAvailableManufacturers(filteredManufacturers);
    } else {
      setAvailableManufacturers(allManufacturers);
    }
  }, [formData.franchise, allManufacturers]);

  const fetchFactions = async () => {
    setLoadingFactions(true);
    
    try {
      const response = await fetch('/api/factions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch factions');
      }
      
      const data = await response.json();
      setAllFactions(data.data || []);
    } catch (err) {
      console.error('Error fetching factions:', err);
    } finally {
      setLoadingFactions(false);
    }
  };

  const fetchEditions = async () => {
    try {
      setLoadingEditions(true);
      const res = await fetch('/api/editions');
      const data = await res.json();
      
      if (data.success) {
        setAllEditions(data.data);
      } else {
        setError('Failed to fetch editions');
      }
    } catch (err) {
      setError('Error connecting to the server');
    } finally {
      setLoadingEditions(false);
    }
  };

  const fetchCollectionTypes = async () => {
    setLoadingCollectionTypes(true);
    
    try {
      const response = await fetch('/api/collection-types');
      
      if (!response.ok) {
        throw new Error('Failed to fetch collection types');
      }
      
      const data = await response.json();
      setAllCollectionTypes(data.data || []);
    } catch (err) {
      console.error('Error fetching collection types:', err);
    } finally {
      setLoadingCollectionTypes(false);
    }
  };

  const fetchFranchises = async () => {
    setLoadingFranchises(true);
    
    try {
      const response = await fetch('/api/franchises');
      
      if (!response.ok) {
        throw new Error('Failed to fetch franchises');
      }
      
      const data = await response.json();
      setAllFranchises(data.data || []);
    } catch (err) {
      console.error('Error fetching franchises:', err);
    } finally {
      setLoadingFranchises(false);
    }
  };

  // Fetch edition details to get default RRP
  const fetchEditionDetails = async (editionInternalName: string) => {
    try {
      const response = await fetch(`/api/editions/by-internal-name?internalName=${encodeURIComponent(editionInternalName)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.retailPrice) {
          // Set the retail price from the edition
          setFormData(prev => ({
            ...prev,
            retailPrice: data.data.retailPrice
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching edition details:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: target.checked
      });
    } else {
      // Default update for most fields
      setFormData({
        ...formData,
        [name]: value
      });

      // Special handling for edition to store both internal name and display name
      if (name === 'edition' && value) {
        // Find the selected edition to get its display name
        const selectedEdition = availableEditions.find(e => e.internalName === value);
        if (selectedEdition) {
          setFormData(prev => ({
            ...prev,
            edition: value,
            editionDisplayName: selectedEdition.name
          }));
          
          // If the edition has a retail price, set it
          if (selectedEdition.retailPrice) {
            setFormData(prev => ({
              ...prev,
              retailPrice: selectedEdition.retailPrice
            }));
          } else {
            // Otherwise, fetch details from the server
            fetchEditionDetails(value);
          }
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields based on collection type
    const requiredFields = ['collectionType', 'franchise'];
    const missingFields = [];
    
    // For Die Cast Models, require issue, edition, shipName, and faction
    if (formData.collectionType === 'Die Cast Models') {
      // Individual check for each required field to provide specific error messages
      if (!formData.issue || formData.issue.trim() === '') {
        missingFields.push('Issue number');
      }
      if (!formData.edition || formData.edition.trim() === '') {
        missingFields.push('Edition');
      }
      if (!formData.shipName || formData.shipName.trim() === '') {
        missingFields.push('Item Name');
      }
      if (!formData.faction || formData.faction.trim() === '') {
        missingFields.push('Race/Faction');
      }
    } else {
      // For other collection types, at least require a name
      if (!formData.shipName || formData.shipName.trim() === '') {
        missingFields.push('Item Name');
      }
    }
    
    // Check collection type and franchise are selected
    if (!formData.collectionType || formData.collectionType.trim() === '') {
      missingFields.push('Collection Type');
    }
    if (!formData.franchise || formData.franchise.trim() === '') {
      missingFields.push('Franchise');
    }
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
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
          // Check if the date is in DD/MM/YYYY format
          const dateParts = formData.releaseDate.split('/');
          if (dateParts.length === 3) {
            // Convert from DD/MM/YYYY to YYYY-MM-DD
            const day = dateParts[0];
            const month = dateParts[1];
            const year = dateParts[2];
            formattedData.releaseDate = `${year}-${month}-${day}`;
          }
          
          // Try to parse the date to make sure it's valid
          const date = new Date(formattedData.releaseDate as string);
          if (isNaN(date.getTime())) {
            formattedData.releaseDate = undefined;
          } else {
            // Use ISO format for MongoDB
            formattedData.releaseDate = date.toISOString();
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
        throw new Error(errorData.message || errorData.error?.message || 'Failed to add item');
      }

      setSuccess('Item added successfully!');
      setFormData(initialFormData);
      onStarshipAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine which fields to show based on collection type
  const showStarshipFields = formData.collectionType === 'Die Cast Models';

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> {success}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Collection Type and Franchise - Always shown first */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Collection Type */}
          <div>
            <label htmlFor="collectionType" className="block text-sm font-medium text-gray-700 mb-1">
              Collection Type <span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <select
                id="collectionType"
                name="collectionType"
                value={formData.collectionType}
                onChange={handleChange}
                required
                disabled={loadingCollectionTypes}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 mr-2"
              >
                <option value="">Select a collection type</option>
                {allCollectionTypes.map(type => (
                  <option key={type._id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => window.open('/collection-type-setup', '_blank')}
                title="Manage collection types"
                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
            {loadingCollectionTypes && (
              <div className="mt-1 text-sm text-gray-500">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" /> Loading collection types...
              </div>
            )}
          </div>
          
          {/* Franchise - Only enabled if collection type is selected */}
          <div>
            <label htmlFor="franchise" className="block text-sm font-medium text-gray-700 mb-1">
              Franchise <span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <select
                id="franchise"
                name="franchise"
                value={formData.franchise}
                onChange={handleChange}
                required
                disabled={!formData.collectionType || loadingFranchises}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 mr-2"
              >
                <option value="">Select a franchise</option>
                {availableFranchises.map(franchise => (
                  <option key={franchise._id} value={franchise.name}>
                    {franchise.name}
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
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" /> Loading franchises...
              </div>
            )}
            {!formData.collectionType && (
              <div className="mt-1 text-sm text-amber-600">
                Please select a collection type first
              </div>
            )}
          </div>
        </div>

        {/* Conditional fields based on collection type */}
        {formData.collectionType && formData.franchise && (
          <>
            {/* Ship Name - Always shown */}
            <div>
              <label htmlFor="shipName" className="block text-sm font-medium text-gray-700 mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="shipName"
                name="shipName"
                value={formData.shipName}
                onChange={handleChange}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Starship-specific fields */}
            {showStarshipFields && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Issue */}
                  <div>
                    <label htmlFor="issue" className="block text-sm font-medium text-gray-700 mb-1">
                      Issue <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="issue"
                      name="issue"
                      value={formData.issue}
                      onChange={handleChange}
                      required={showStarshipFields}
                      className={`block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${!formData.issue && showStarshipFields ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                      placeholder="Enter issue number"
                    />
                    {!formData.issue && showStarshipFields && (
                      <p className="mt-1 text-sm text-red-600">Issue number is required</p>
                    )}
                  </div>
                  
                  {/* Edition */}
                  <div>
                    <label htmlFor="edition" className="block text-sm font-medium text-gray-700 mb-1">
                      Edition <span className="text-red-500">*</span>
                    </label>
                    <div className="flex">
                      <select
                        id="edition"
                        name="edition"
                        value={formData.edition}
                        onChange={handleChange}
                        required={showStarshipFields}
                        disabled={loadingEditions || !formData.franchise}
                        className={`block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 mr-2 ${!formData.edition && showStarshipFields ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                      >
                        <option value="">Select an edition</option>
                        {availableEditions.map(edition => (
                          <option key={edition._id} value={edition.internalName}>
                            {edition.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => window.open('/setup?tab=editions', '_blank')}
                        title="Manage editions"
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>
                    {!formData.edition && showStarshipFields && (
                      <p className="mt-1 text-sm text-red-600">Edition is required</p>
                    )}
                    {loadingEditions && (
                      <div className="mt-1 text-sm text-gray-500">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" /> Loading editions...
                      </div>
                    )}
                  </div>
                </div>

                {/* Race/Faction */}
                <div>
                  <label htmlFor="faction" className="block text-sm font-medium text-gray-700 mb-1">
                    Race/Faction <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <select
                      id="faction"
                      name="faction"
                      value={formData.faction}
                      onChange={handleChange}
                      required={showStarshipFields}
                      disabled={loadingFactions || !formData.franchise}
                      className={`block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 mr-2 ${!formData.faction && showStarshipFields ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    >
                      <option value="">Select a faction</option>
                      {availableFactions.map(faction => (
                        <option key={faction._id} value={faction.name}>
                          {faction.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => window.open('/setup?tab=factions', '_blank')}
                      title="Manage factions"
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                  {!formData.faction && showStarshipFields && (
                    <p className="mt-1 text-sm text-red-600">Faction is required</p>
                  )}
                  {loadingFactions && (
                    <div className="mt-1 text-sm text-gray-500">
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" /> Loading factions...
                    </div>
                  )}
                </div>

                {/* Manufacturer */}
                <div>
                  <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer
                  </label>
                  <div className="flex">
                    <select
                      id="manufacturer"
                      name="manufacturer"
                      value={formData.manufacturer || ''}
                      onChange={handleChange}
                      disabled={loadingManufacturers || !formData.franchise}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 mr-2"
                    >
                      <option value="">Select a manufacturer</option>
                      {availableManufacturers.map(manufacturer => (
                        <option key={manufacturer._id} value={manufacturer.name}>
                          {manufacturer.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => window.open('/manufacturer-setup', '_blank')}
                      title="Manage manufacturers"
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                  {loadingManufacturers && (
                    <div className="mt-1 text-sm text-gray-500">
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" /> Loading manufacturers...
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Release Date */}
              <div>
                <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Release Date
                </label>
                <input
                  type="date"
                  id="releaseDate"
                  name="releaseDate"
                  value={formData.releaseDate || ''}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <p className="mt-1 text-sm text-gray-500">Format: YYYY-MM-DD</p>
              </div>
              
              {/* Image URL */}
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl || ''}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Owned Checkbox */}
            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="owned"
                  name="owned"
                  checked={formData.owned}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="owned" className="ml-2 block text-sm text-gray-900">
                  Owned
                </label>
              </div>
            </div>

            {/* Pricing Information */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      name="retailPrice"
                      value={formData.retailPrice || ''}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="block w-full pl-7 pr-12 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                
                {/* Purchase Price */}
                <div>
                  <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Price
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="purchasePrice"
                      name="purchasePrice"
                      value={formData.purchasePrice || ''}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="block w-full pl-7 pr-12 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                
                {/* Market Value */}
                <div>
                  <label htmlFor="marketValue" className="block text-sm font-medium text-gray-700 mb-1">
                    Market Value
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="marketValue"
                      name="marketValue"
                      value={formData.marketValue || ''}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="block w-full pl-7 pr-12 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Form Actions */}
        <div className="flex justify-between pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                Add Item
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => setFormData(initialFormData)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FontAwesomeIcon icon={faUndo} className="mr-2" />
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStarshipForm; 