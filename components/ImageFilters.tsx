import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';

interface Franchise {
  _id: string;
  name: string;
}

interface Edition {
  _id: string;
  name: string;
  internalName: string;
  franchise: string;
}

interface ImageFiltersProps {
  selectedFranchise: string;
  selectedEdition: string;
  onFranchiseChange: (franchise: string) => void;
  onEditionChange: (edition: string) => void;
  onClearFilters: () => void;
}

const ImageFilters: React.FC<ImageFiltersProps> = ({
  selectedFranchise,
  selectedEdition,
  onFranchiseChange,
  onEditionChange,
  onClearFilters
}) => {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFranchises();
    fetchEditions();
  }, []);

  const fetchFranchises = async () => {
    try {
      const response = await fetch('/api/franchises');
      if (response.ok) {
        const data = await response.json();
        setFranchises(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching franchises:', error);
    }
  };

  const fetchEditions = async () => {
    try {
      const response = await fetch('/api/editions');
      if (response.ok) {
        const data = await response.json();
        setEditions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching editions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFranchiseChange = (franchise: string) => {
    onFranchiseChange(franchise);
    // Reset edition when franchise changes
    if (selectedEdition) {
      onEditionChange('');
    }
  };

  const filteredEditions = selectedFranchise 
    ? editions.filter(edition => edition.franchise === selectedFranchise)
    : editions;

  const hasActiveFilters = selectedFranchise || selectedEdition;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <FontAwesomeIcon icon={faFilter} className="mr-2 text-gray-500" />
          Filter Items
        </h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Franchise Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Franchise
            </label>
            <select
              value={selectedFranchise}
              onChange={(e) => handleFranchiseChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">All Franchises</option>
              {franchises.map((franchise) => (
                <option key={franchise._id} value={franchise.name}>
                  {franchise.name}
                </option>
              ))}
            </select>
          </div>

          {/* Edition Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Edition
            </label>
            <select
              value={selectedEdition}
              onChange={(e) => onEditionChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading || !selectedFranchise}
            >
              <option value="">All Editions</option>
              {filteredEditions.map((edition) => (
                <option key={edition._id} value={edition.internalName}>
                  {edition.name}
                </option>
              ))}
            </select>
            {!selectedFranchise && (
              <p className="mt-1 text-sm text-gray-500">
                Select a franchise first
              </p>
            )}
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={onClearFilters}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!hasActiveFilters}
            >
              <FontAwesomeIcon icon={faTimes} className="mr-2" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Active Filters:</strong>{' '}
              {[
                selectedFranchise, 
                selectedEdition && editions.find(e => e.internalName === selectedEdition)?.name
              ].filter(Boolean).join(' → ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageFilters;