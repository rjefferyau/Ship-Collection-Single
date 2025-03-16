import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup, faFilm, faFilter } from '@fortawesome/free-solid-svg-icons';

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
      console.log('Item counts data:', data);
      
      if (data.success && isInitialLoad) {
        // Find collection type with most items
        if (data.collectionTypeCounts && Object.keys(data.collectionTypeCounts).length > 0) {
          const mostPopularType = Object.entries(data.collectionTypeCounts)
            .sort((a, b) => (b[1] as number) - (a[1] as number))[0][0];
          console.log('Most popular collection type:', mostPopularType, 'with', data.collectionTypeCounts[mostPopularType], 'items');
          setSelectedCollectionType(mostPopularType);
        }
        
        // Find franchise with most items
        if (data.franchiseCounts && Object.keys(data.franchiseCounts).length > 0) {
          const mostPopularFranchise = Object.entries(data.franchiseCounts)
            .sort((a, b) => (b[1] as number) - (a[1] as number))[0][0];
          console.log('Most popular franchise:', mostPopularFranchise, 'with', data.franchiseCounts[mostPopularFranchise], 'items');
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
      console.log('Fetching franchises...');
      const response = await fetch('/api/franchises');
      
      if (!response.ok) {
        throw new Error('Failed to fetch franchises');
      }
      
      const data = await response.json();
      console.log('Franchises data:', data);
      setFranchises(data.data || []);
    } catch (err) {
      console.error('Error fetching franchises:', err);
    }
  };

  return (
    <div className={`bg-white shadow-md rounded-lg p-4 mb-6 ${className}`}>
      <div className="flex items-center mb-3">
        <FontAwesomeIcon icon={faFilter} className="text-indigo-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-700">Filter Collection</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Collection Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FontAwesomeIcon icon={faLayerGroup} className="mr-2" />
            Collection Type
          </label>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
        </div>
        
        {/* Franchise Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FontAwesomeIcon icon={faFilm} className="mr-2" />
            Franchise
          </label>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
        </div>
      </div>
    </div>
  );
};

export default CollectionFilter; 