import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup, faFilm, faFilter, faTimes, faChevronDown, faSearch } from '@fortawesome/free-solid-svg-icons';

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
  
  // Dropdown state
  const [collectionTypeDropdownOpen, setCollectionTypeDropdownOpen] = useState(false);
  const [franchiseDropdownOpen, setFranchiseDropdownOpen] = useState(false);
  
  // Refs for click outside handling
  const collectionTypeDropdownRef = useRef<HTMLDivElement>(null);
  const franchiseDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch collection types and franchises on component mount
  useEffect(() => {
    fetchCollectionTypes();
    fetchFranchises();
    fetchItemCounts();
    
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
    <div className={`backdrop-blur-sm bg-white/95 rounded-2xl shadow-xl border border-gray-200/50 overflow-visible transition-all duration-500 hover:shadow-2xl relative z-30 ${className}`}>
      {/* Modern Header with gradient */}
      <div 
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-6 py-5 flex justify-between items-center cursor-pointer transition-all duration-300 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl backdrop-blur-sm">
            <FontAwesomeIcon icon={faSearch} className="text-white text-lg" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Smart Filters</h3>
            <p className="text-indigo-100 text-sm font-medium">Refine your collection view</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {hasActiveFilters && (
            <div className="flex items-center space-x-2">
              <div className="bg-emerald-400 text-emerald-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                {(selectedCollectionType ? 1 : 0) + (selectedFranchise ? 1 : 0)} Active
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  clearFilters();
                }}
                className="group flex items-center space-x-1.5 bg-white/20 hover:bg-red-500/80 text-white hover:text-white px-3 py-1.5 rounded-lg transition-all duration-200 backdrop-blur-sm text-sm font-medium"
              >
                <FontAwesomeIcon icon={faTimes} className="group-hover:rotate-90 transition-transform duration-200" />
                <span>Clear All</span>
              </button>
            </div>
          )}
          <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg backdrop-blur-sm">
            <FontAwesomeIcon 
              icon={faChevronDown} 
              className={`text-white transition-all duration-300 ${isExpanded ? 'transform rotate-180' : ''}`} 
            />
          </div>
        </div>
      </div>
      
      {/* Enhanced Filter Content with Animation */}
      <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-visible`}>
        <div className="p-6 bg-gradient-to-br from-gray-50 to-white overflow-visible">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Modern Collection Type Selection */}
            <div className="space-y-3 group">
              <label className="block text-sm font-bold text-gray-800 flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors duration-200">
                  <FontAwesomeIcon icon={faLayerGroup} className="text-indigo-600 text-sm" />
                </div>
                <span>Collection Type</span>
              </label>
              <div className="relative" ref={collectionTypeDropdownRef}>
                <button
                  type="button"
                  className="group w-full bg-white border-2 border-gray-200 hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-xl px-4 py-3.5 text-left transition-all duration-200 shadow-sm hover:shadow-md relative z-10"
                  onClick={() => setCollectionTypeDropdownOpen(!collectionTypeDropdownOpen)}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${selectedCollectionType ? 'text-gray-900' : 'text-gray-500'}`}>
                      {selectedCollectionType || 'Select collection type...'}
                    </span>
                    <FontAwesomeIcon 
                      icon={faChevronDown} 
                      className={`text-gray-400 transition-transform duration-200 ${collectionTypeDropdownOpen ? 'rotate-180' : ''} group-hover:text-indigo-500`} 
                    />
                  </div>
                </button>
                
                {collectionTypeDropdownOpen && (
                  <div className="absolute z-[9999] mt-2 w-full bg-white shadow-2xl border border-gray-200 rounded-xl py-2 max-h-64 overflow-auto backdrop-blur-lg">
                    <div 
                      className="px-4 py-3 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 cursor-pointer transition-all duration-150 border-b border-gray-100"
                      onClick={() => {
                        setSelectedCollectionType('');
                        setCollectionTypeDropdownOpen(false);
                      }}
                    >
                      <span className="text-gray-700 font-medium">All Collection Types</span>
                    </div>
                    {collectionTypes.map((type) => (
                      <div 
                        key={type._id}
                        className={`px-4 py-3 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 cursor-pointer transition-all duration-150 ${selectedCollectionType === type.name ? 'bg-gradient-to-r from-indigo-100 to-purple-100 border-l-4 border-indigo-500' : ''}`}
                        onClick={() => {
                          setSelectedCollectionType(type.name);
                          setCollectionTypeDropdownOpen(false);
                        }}
                      >
                        <span className={`font-medium ${selectedCollectionType === type.name ? 'text-indigo-900' : 'text-gray-700'}`}>
                          {type.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedCollectionType && (
                <div className="flex items-center">
                  <span className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                    <span>{selectedCollectionType}</span>
                    <button 
                      onClick={() => setSelectedCollectionType('')}
                      className="flex items-center justify-center w-5 h-5 bg-white/20 hover:bg-white/30 rounded-full transition-colors duration-200"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-xs" />
                    </button>
                  </span>
                </div>
              )}
            </div>
            
            {/* Modern Franchise Selection */}
            <div className="space-y-3 group">
              <label className="block text-sm font-bold text-gray-800 flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                  <FontAwesomeIcon icon={faFilm} className="text-blue-600 text-sm" />
                </div>
                <span>Franchise</span>
              </label>
              <div className="relative" ref={franchiseDropdownRef}>
                <button
                  type="button"
                  className="group w-full bg-white border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-3.5 text-left transition-all duration-200 shadow-sm hover:shadow-md relative z-10"
                  onClick={() => setFranchiseDropdownOpen(!franchiseDropdownOpen)}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${selectedFranchise ? 'text-gray-900' : 'text-gray-500'}`}>
                      {selectedFranchise || 'Select franchise...'}
                    </span>
                    <FontAwesomeIcon 
                      icon={faChevronDown} 
                      className={`text-gray-400 transition-transform duration-200 ${franchiseDropdownOpen ? 'rotate-180' : ''} group-hover:text-blue-500`} 
                    />
                  </div>
                </button>
                
                {franchiseDropdownOpen && (
                  <div className="absolute z-[9999] mt-2 w-full bg-white shadow-2xl border border-gray-200 rounded-xl py-2 max-h-64 overflow-auto backdrop-blur-lg">
                    <div 
                      className="px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-150 border-b border-gray-100"
                      onClick={() => {
                        setSelectedFranchise('');
                        setFranchiseDropdownOpen(false);
                      }}
                    >
                      <span className="text-gray-700 font-medium">All Franchises</span>
                    </div>
                    {franchises.map((franchise) => (
                      <div 
                        key={franchise._id}
                        className={`px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-150 ${selectedFranchise === franchise.name ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-l-4 border-blue-500' : ''}`}
                        onClick={() => {
                          setSelectedFranchise(franchise.name);
                          setFranchiseDropdownOpen(false);
                        }}
                      >
                        <span className={`font-medium ${selectedFranchise === franchise.name ? 'text-blue-900' : 'text-gray-700'}`}>
                          {franchise.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedFranchise && (
                <div className="flex items-center">
                  <span className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                    <span>{selectedFranchise}</span>
                    <button 
                      onClick={() => setSelectedFranchise('')}
                      className="flex items-center justify-center w-5 h-5 bg-white/20 hover:bg-white/30 rounded-full transition-colors duration-200"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-xs" />
                    </button>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionFilter; 