import React, { useState, useEffect, useRef } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  
  // Dropdown state
  const [collectionTypeDropdownOpen, setCollectionTypeDropdownOpen] = useState(false);
  const [franchiseDropdownOpen, setFranchiseDropdownOpen] = useState(false);
  
  // Refs for click outside handling
  const collectionTypeDropdownRef = useRef<HTMLDivElement>(null);
  const franchiseDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch collection types and franchises on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchCollectionTypes(),
        fetchFranchises(),
        fetchItemCounts()
      ]);
      setIsLoading(false);
    };
    
    loadData();
    
    // Add click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (
        collectionTypeDropdownRef.current && 
        !collectionTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setCollectionTypeDropdownOpen(false);
      }
      
      if (
        franchiseDropdownRef.current && 
        !franchiseDropdownRef.current.contains(event.target as Node)
      ) {
        setFranchiseDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Notify parent component when filters change
  useEffect(() => {
    // Trigger filter change even if only one filter is selected
    onFilterChange(selectedCollectionType, selectedFranchise);
  }, [selectedCollectionType, selectedFranchise, onFilterChange]);

  const fetchItemCounts = async () => {
    try {
      const response = await fetch(`/api/starships/counts?_t=${Date.now()}`, { cache: 'no-store' });
      
      if (!response.ok) {
        console.warn('Failed to fetch item counts:', response.status);
        return;
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
      console.warn('Error fetching item counts:', err);
    }
  };

  const fetchCollectionTypes = async () => {
    try {
      const response = await fetch('/api/collection-types');
      
      if (!response.ok) {
        console.warn('Failed to fetch collection types:', response.status);
        setCollectionTypes([]);
        return;
      }
      
      const data = await response.json();
      setCollectionTypes(data.data || []);
    } catch (err) {
      console.warn('Error fetching collection types:', err);
      setCollectionTypes([]);
    }
  };

  const fetchFranchises = async () => {
    try {
      const response = await fetch('/api/franchises');
      
      if (!response.ok) {
        console.warn('Failed to fetch franchises:', response.status);
        setFranchises([]);
        return;
      }
      
      const data = await response.json();
      setFranchises(data.data || []);
    } catch (err) {
      console.warn('Error fetching franchises:', err);
      setFranchises([]);
    }
  };

  const clearFilters = () => {
    setSelectedCollectionType('');
    setSelectedFranchise('');
  };

  const hasActiveFilters = selectedCollectionType || selectedFranchise;

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
          <span className="text-sm text-gray-500">Loading filters...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-600">
            <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
            <span>Filters:</span>
          </div>
          
          {/* Compact Collection Type Dropdown */}
          <div className="relative" ref={collectionTypeDropdownRef}>
            <button
              type="button"
              className="flex items-center space-x-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              onClick={() => setCollectionTypeDropdownOpen(!collectionTypeDropdownOpen)}
            >
              <FontAwesomeIcon icon={faLayerGroup} className="text-gray-400" />
              <span className={selectedCollectionType ? 'text-indigo-700 font-medium' : ''}>
                {selectedCollectionType || 'Collection Type'}
              </span>
              <FontAwesomeIcon 
                icon={faChevronDown} 
                className={`text-gray-400 text-xs transition-transform ${collectionTypeDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>
            
            {collectionTypeDropdownOpen && (
              <div className="absolute z-50 mt-1 w-56 bg-white shadow-lg border border-gray-200 rounded-lg py-1 max-h-48 overflow-auto">
                <div 
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => {
                    setSelectedCollectionType('');
                    setCollectionTypeDropdownOpen(false);
                  }}
                >
                  All Collection Types
                </div>
                {collectionTypes.map((type) => (
                  <div 
                    key={type._id}
                    className={`px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm ${selectedCollectionType === type.name ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}`}
                    onClick={() => {
                      setSelectedCollectionType(type.name);
                      setCollectionTypeDropdownOpen(false);
                    }}
                  >
                    {type.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Compact Franchise Dropdown */}
          <div className="relative" ref={franchiseDropdownRef}>
            <button
              type="button"
              className="flex items-center space-x-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              onClick={() => setFranchiseDropdownOpen(!franchiseDropdownOpen)}
            >
              <FontAwesomeIcon icon={faFilm} className="text-gray-400" />
              <span className={selectedFranchise ? 'text-indigo-700 font-medium' : ''}>
                {selectedFranchise || 'Franchise'}
              </span>
              <FontAwesomeIcon 
                icon={faChevronDown} 
                className={`text-gray-400 text-xs transition-transform ${franchiseDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>
            
            {franchiseDropdownOpen && (
              <div className="absolute z-50 mt-1 w-56 bg-white shadow-lg border border-gray-200 rounded-lg py-1 max-h-48 overflow-auto">
                <div 
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => {
                    setSelectedFranchise('');
                    setFranchiseDropdownOpen(false);
                  }}
                >
                  All Franchises
                </div>
                {franchises.map((franchise) => (
                  <div 
                    key={franchise._id}
                    className={`px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm ${selectedFranchise === franchise.name ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}`}
                    onClick={() => {
                      setSelectedFranchise(franchise.name);
                      setFranchiseDropdownOpen(false);
                    }}
                  >
                    {franchise.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
            <span>Clear ({(selectedCollectionType ? 1 : 0) + (selectedFranchise ? 1 : 0)})</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default CollectionFilter;