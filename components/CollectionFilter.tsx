import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup, faFilm, faFilter, faTimes, faChevronDown } from '@fortawesome/free-solid-svg-icons';

interface CollectionFilterProps {
  onFilterChange: (collectionType: string, franchise: string) => void;
  className?: string;
}

const CollectionFilter: React.FC<CollectionFilterProps> = ({ 
  onFilterChange,
  className = ''
}) => {
  const [collectionTypes, setCollectionTypes] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [selectedCollectionType, setSelectedCollectionType] = useState<string>('');
  const [selectedFranchise, setSelectedFranchise] = useState<string>('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch collection types and franchises on component mount
  useEffect(() => {
    fetchCollectionTypes();
    fetchFranchises();
    fetchItemCounts();
  }, []);

  // Notify parent component when filters change
  useEffect(() => {
    // Trigger filter change even if only one filter is selected
    onFilterChange(selectedCollectionType, selectedFranchise);
  }, [selectedCollectionType, selectedFranchise, onFilterChange]);

  const fetchItemCounts = async () => {
    try {
      const response = await fetch('/api/starships/counts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch item counts');
      }
      
      const data = await response.json();
      
      if (data.success && isInitialLoad) {
        // Find collection type with most items
        if (data.collectionTypeCounts && Object.keys(data.collectionTypeCounts).length > 0) {
          const mostPopularType = Object.entries(data.collectionTypeCounts)
            .sort((a, b) => (b[1] as number) - (a[1] as number))[0][0];
          setSelectedCollectionType(mostPopularType);
        }
        
        // Find franchise with most items
        if (data.franchiseCounts && Object.keys(data.franchiseCounts).length > 0) {
          const mostPopularFranchise = Object.entries(data.franchiseCounts)
            .sort((a, b) => (b[1] as number) - (a[1] as number))[0][0];
          setSelectedFranchise(mostPopularFranchise);
        }
        
        setIsInitialLoad(false);
      }
    } catch (err) {
      console.error('Error fetching item counts:', err);
    }
  };

  const fetchCollectionTypes = async () => {
    try {
      const response = await fetch('/api/collection-types');
      
      if (!response.ok) {
        throw new Error('Failed to fetch collection types');
      }
      
      const data = await response.json();
      setCollectionTypes(data.data || []);
    } catch (err) {
      console.error('Error fetching collection types:', err);
    }
  };

  const fetchFranchises = async () => {
    try {
      const response = await fetch('/api/franchises');
      
      if (!response.ok) {
        throw new Error('Failed to fetch franchises');
      }
      
      const data = await response.json();
      setFranchises(data.data || []);
    } catch (err) {
      console.error('Error fetching franchises:', err);
    }
  };

  const clearFilters = () => {
    setSelectedCollectionType('');
    setSelectedFranchise('');
  };

  const hasActiveFilters = selectedCollectionType || selectedFranchise;

  return (
    <div className={`bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-300 ${className}`}>
      {/* Header with toggle */}
      <div 
        className="bg-indigo-600 px-5 py-4 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faFilter} className="text-white" />
            <span className="text-lg font-medium text-white ml-3">Filter Collection</span>
          </div>
        </div>
        <div className="flex items-center">
          {hasActiveFilters && (
            <div className="bg-white bg-opacity-20 text-white text-xs font-semibold px-2.5 py-1 rounded-full mr-3">
              Filters Active
            </div>
          )}
          {hasActiveFilters && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                clearFilters();
              }}
              className="text-white hover:text-red-100 mr-4 text-sm flex items-center"
            >
              <FontAwesomeIcon icon={faTimes} className="mr-1" />
              Clear
            </button>
          )}
          <FontAwesomeIcon 
            icon={faChevronDown} 
            className={`text-white transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`} 
          />
        </div>
      </div>
      
      {/* Filter content */}
      {isExpanded && (
        <div className="p-5 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Collection Type Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <FontAwesomeIcon icon={faLayerGroup} className="text-indigo-500 mr-2" />
                Collection Type
              </label>
              <div className="relative">
                <select
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-3 pr-10 py-2.5 text-gray-700 appearance-none bg-white"
                  value={selectedCollectionType}
                  onChange={(e) => setSelectedCollectionType(e.target.value)}
                >
                  <option value="">All Collection Types</option>
                  {collectionTypes.map((type) => (
                    <option key={type._id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <FontAwesomeIcon icon={faChevronDown} className="h-4 w-4" />
                </div>
              </div>
              {selectedCollectionType && (
                <div className="flex items-center mt-2">
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
                    {selectedCollectionType}
                    <button 
                      onClick={() => setSelectedCollectionType('')}
                      className="ml-1.5 text-indigo-600 hover:text-indigo-800"
                    >
                      <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                    </button>
                  </span>
                </div>
              )}
            </div>
            
            {/* Franchise Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                <FontAwesomeIcon icon={faFilm} className="text-indigo-500 mr-2" />
                Franchise
              </label>
              <div className="relative">
                <select
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-3 pr-10 py-2.5 text-gray-700 appearance-none bg-white"
                  value={selectedFranchise}
                  onChange={(e) => setSelectedFranchise(e.target.value)}
                >
                  <option value="">All Franchises</option>
                  {franchises.map((franchise) => (
                    <option key={franchise._id} value={franchise.name}>
                      {franchise.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <FontAwesomeIcon icon={faChevronDown} className="h-4 w-4" />
                </div>
              </div>
              {selectedFranchise && (
                <div className="flex items-center mt-2">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
                    {selectedFranchise}
                    <button 
                      onClick={() => setSelectedFranchise('')}
                      className="ml-1.5 text-blue-600 hover:text-blue-800"
                    >
                      <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                    </button>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionFilter; 