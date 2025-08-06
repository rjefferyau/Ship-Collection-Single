import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImages, faUpload } from '@fortawesome/free-solid-svg-icons';
import ImageManager from '../components/ImageManager';
import ImageFilters from '../components/ImageFilters';

const ManageImagesPage: React.FC = () => {
  const [selectedFranchise, setSelectedFranchise] = useState('');
  const [selectedEdition, setSelectedEdition] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFranchiseChange = (franchise: string) => {
    setSelectedFranchise(franchise);
    setRefreshKey(prev => prev + 1);
  };

  const handleEditionChange = (edition: string) => {
    setSelectedEdition(edition);
    setRefreshKey(prev => prev + 1);
  };

  const handleClearFilters = () => {
    setSelectedFranchise('');
    setSelectedEdition('');
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="w-full px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <FontAwesomeIcon icon={faImages} className="mr-3 text-blue-600" />
            Manage Images
          </h1>
          <p className="text-gray-600">
            Quickly add images to items in your collection. Items are organized by franchise and edition for easy browsing.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <FontAwesomeIcon icon={faUpload} className="text-blue-600 mt-1 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">How to use:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Drag & Drop:</strong> Drag an image file onto any item row to upload it</li>
                <li>• <strong>Click to Select:</strong> Click on any item row to open the file picker</li>
                <li>• <strong>Auto-Remove:</strong> Items disappear automatically after successful upload</li>
                <li>• <strong>Search:</strong> Use the search box to find specific items or franchises</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Filters */}
        <ImageFilters
          selectedFranchise={selectedFranchise}
          selectedEdition={selectedEdition}
          onFranchiseChange={handleFranchiseChange}
          onEditionChange={handleEditionChange}
          onClearFilters={handleClearFilters}
        />

        {/* Image Manager */}
        <ImageManager 
          key={refreshKey}
          selectedFranchise={selectedFranchise}
          selectedEdition={selectedEdition}
        />
      </div>
    </div>
  );
};

export default ManageImagesPage;