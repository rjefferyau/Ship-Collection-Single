import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

interface Manufacturer {
  _id: string;
  name: string;
}

interface Franchise {
  _id: string;
  name: string;
}

interface CollectionType {
  _id: string;
  name: string;
}

const ManufacturerAssignment: React.FC = () => {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [collectionTypes, setCollectionTypes] = useState<CollectionType[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [selectedFranchises, setSelectedFranchises] = useState<string[]>([]);
  const [selectedCollectionTypes, setSelectedCollectionTypes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch manufacturers
        const manufacturersResponse = await fetch('/api/manufacturers');
        if (!manufacturersResponse.ok) {
          throw new Error('Failed to fetch manufacturers');
        }
        const manufacturersData = await manufacturersResponse.json();
        setManufacturers(manufacturersData.data || []);
        
        // Fetch franchises
        const franchisesResponse = await fetch('/api/franchises');
        if (!franchisesResponse.ok) {
          throw new Error('Failed to fetch franchises');
        }
        const franchisesData = await franchisesResponse.json();
        setFranchises(franchisesData.data || []);
        
        // Fetch collection types
        const collectionTypesResponse = await fetch('/api/collection-types');
        if (!collectionTypesResponse.ok) {
          throw new Error('Failed to fetch collection types');
        }
        const collectionTypesData = await collectionTypesResponse.json();
        setCollectionTypes(collectionTypesData.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleManufacturerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedManufacturer(e.target.value);
  };

  const handleFranchiseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const values: string[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        values.push(options[i].value);
      }
    }
    
    setSelectedFranchises(values);
  };

  const handleCollectionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const values: string[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        values.push(options[i].value);
      }
    }
    
    setSelectedCollectionTypes(values);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedManufacturer) {
      setResult({
        success: false,
        message: 'Please select a manufacturer'
      });
      return;
    }
    
    if (selectedFranchises.length === 0 && selectedCollectionTypes.length === 0) {
      setResult({
        success: false,
        message: 'Please select at least one franchise or collection type'
      });
      return;
    }
    
    setIsSubmitting(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/starships/update-manufacturers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manufacturerId: selectedManufacturer,
          franchises: selectedFranchises,
          collectionTypes: selectedCollectionTypes
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update manufacturers');
      }
      
      setResult({
        success: true,
        message: data.message || `Updated ${data.data?.modifiedCount} starships successfully`
      });
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'An unknown error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Mass Assign Manufacturers</h2>
        
        {result && (
          <div className={`mb-4 p-4 rounded ${result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <div className="flex items-center">
              <FontAwesomeIcon 
                icon={result.success ? faCheck : faExclamationTriangle} 
                className="mr-2" 
              />
              <span>{result.message}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-1">
              Manufacturer *
            </label>
            <select
              id="manufacturer"
              value={selectedManufacturer}
              onChange={handleManufacturerChange}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              required
            >
              <option value="">Select a manufacturer</option>
              {manufacturers.map(manufacturer => (
                <option key={manufacturer._id} value={manufacturer._id}>
                  {manufacturer.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="franchises" className="block text-sm font-medium text-gray-700 mb-1">
                Franchises
              </label>
              <select
                id="franchises"
                multiple
                value={selectedFranchises}
                onChange={handleFranchiseChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                size={6}
              >
                {franchises.map(franchise => (
                  <option key={franchise._id} value={franchise.name}>
                    {franchise.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple franchises</p>
            </div>
            
            <div>
              <label htmlFor="collectionTypes" className="block text-sm font-medium text-gray-700 mb-1">
                Collection Types
              </label>
              <select
                id="collectionTypes"
                multiple
                value={selectedCollectionTypes}
                onChange={handleCollectionTypeChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                size={6}
              >
                {collectionTypes.map(type => (
                  <option key={type._id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple collection types</p>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin -ml-1 mr-2 h-4 w-4 border-t-2 border-white"></span>
                  Processing...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSync} className="mr-2" />
                  Assign Manufacturer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManufacturerAssignment; 