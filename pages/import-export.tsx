import React, { useState } from 'react';
import ImportExport from '../components/ImportExport';
import CsvUpload from '../components/CsvUpload';
import ShipImageUploader from '../components/ShipImageUploader';

const ImportExportPage: React.FC = () => {
  const [selectedEditionId, setSelectedEditionId] = useState<string>('');
  const [selectedEditionName, setSelectedEditionName] = useState<string>('');
  const [selectedFranchise, setSelectedFranchise] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="w-full px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Import/Export Collection</h1>
        
        <div className="space-y-6">
          <ImportExport 
            onSelectionChange={(editionId, franchise, editionName) => {
              setSelectedEditionId(editionId);
              setSelectedFranchise(franchise);
              setSelectedEditionName(editionName);
            }}
          />
          
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Upload Modified Template</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                After downloading and modifying the template CSV file, upload it here to import your ships into the selected edition and franchise.
                {selectedFranchise && selectedEditionName && (
                  <span className="block mt-2 font-medium text-gray-800">
                    Selected: {selectedFranchise} - {selectedEditionName}
                  </span>
                )}
              </p>
              <CsvUpload 
                selectedEdition={selectedEditionId}
                selectedFranchise={selectedFranchise}
                onUploadComplete={() => setRefreshKey(prev => prev + 1)}
              />
            </div>
          </div>
          
          {/* Image Upload Section */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Add Images to Ships</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Quickly add images to ships that don't have them yet. Drag and drop images or click to select files.
                {selectedFranchise && selectedEditionName && (
                  <span className="block mt-2 font-medium text-gray-800">
                    Showing ships from: {selectedFranchise} - {selectedEditionName}
                  </span>
                )}
              </p>
              <ShipImageUploader
                key={refreshKey}
                franchise={selectedFranchise}
                edition={selectedEditionName}
                onUploadComplete={() => setRefreshKey(prev => prev + 1)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExportPage; 