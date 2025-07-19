import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImages, faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';
import ShipImageUploader from '../components/ShipImageUploader';

interface Franchise {
  _id: string;
  name: string;
}

interface Edition {
  _id: string;
  name: string;
  franchise: string;
}

const ImageUploadPage: React.FC = () => {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [selectedFranchise, setSelectedFranchise] = useState<string>('');
  const [selectedEdition, setSelectedEdition] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
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
    setSelectedFranchise(franchise);
    setSelectedEdition(''); // Reset edition when franchise changes
    setRefreshKey(prev => prev + 1);
  };

  const handleEditionChange = (edition: string) => {
    setSelectedEdition(edition);
    setRefreshKey(prev => prev + 1);
  };

  const clearFilters = () => {
    setSelectedFranchise('');
    setSelectedEdition('');
    setRefreshKey(prev => prev + 1);
  };

  const filteredEditions = selectedFranchise 
    ? editions.filter(edition => edition.franchise === selectedFranchise)
    : editions;

  const selectedEditionObj = editions.find(e => e.name === selectedEdition);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="w-full px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <FontAwesomeIcon icon={faImages} className="mr-3 text-blue-600" />
            Ship Image Upload
          </h1>
          <p className="text-gray-600">
            Add images to ships that don't have them yet. Use drag-and-drop or click to select files.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FontAwesomeIcon icon={faFilter} className="mr-2 text-gray-500" />
              Filter Ships
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
                  onChange={(e) => handleEditionChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading || !selectedFranchise}
                >
                  <option value="">All Editions</option>
                  {filteredEditions.map((edition) => (
                    <option key={edition._id} value={edition.name}>
                      {edition.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
                  disabled={!selectedFranchise && !selectedEdition}
                >
                  <FontAwesomeIcon icon={faTimes} className="mr-2" />
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedFranchise || selectedEdition) && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Active Filters:</strong>{' '}
                  {[selectedFranchise, selectedEdition].filter(Boolean).join(' → ')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Ship Image Uploader */}
        <ShipImageUploader
          key={refreshKey}
          franchise={selectedFranchise}
          edition={selectedEdition}
          onUploadComplete={() => setRefreshKey(prev => prev + 1)}
        />
      </div>
    </div>
  );
};

export default ImageUploadPage; 