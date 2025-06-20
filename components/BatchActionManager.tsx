import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faTag, faBuilding, faFlag } from '@fortawesome/free-solid-svg-icons';

interface BatchActionManagerProps {
  selectedItems: string[];
  onClearSelection: () => void;
  onBatchUpdateManufacturer: (manufacturerId: string) => void;
  onBatchUpdateFaction: (factionId: string) => void;
  onBatchUpdateEdition: (editionId: string) => void;
  onBatchDelete: () => void;
  availableManufacturers: { _id: string; name: string }[];
  availableFactions: { _id: string; name: string }[];
  availableEditions: { _id: string; name: string }[];
}

const BatchActionManager: React.FC<BatchActionManagerProps> = ({
  selectedItems,
  onClearSelection,
  onBatchUpdateManufacturer,
  onBatchUpdateFaction,
  onBatchUpdateEdition,
  onBatchDelete,
  availableManufacturers,
  availableFactions,
  availableEditions
}) => {
  const [showManufacturerDropdown, setShowManufacturerDropdown] = useState(false);
  const [showFactionDropdown, setShowFactionDropdown] = useState(false);
  const [showEditionDropdown, setShowEditionDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  if (selectedItems.length === 0) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-40">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <span className="font-medium text-gray-700 mr-2">
            {selectedItems.length} items selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear selection
          </button>
        </div>
        
        <div className="flex space-x-2">
          {/* Manufacturer dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowManufacturerDropdown(!showManufacturerDropdown)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm flex items-center"
            >
              <FontAwesomeIcon icon={faBuilding} className="mr-2" />
              Set Manufacturer
            </button>
            
            {showManufacturerDropdown && (
              <div className="absolute bottom-full mb-2 right-0 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {availableManufacturers.map(manufacturer => (
                  <button
                    key={manufacturer._id}
                    onClick={() => {
                      onBatchUpdateManufacturer(manufacturer._id);
                      setShowManufacturerDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    {manufacturer.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Faction dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFactionDropdown(!showFactionDropdown)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm flex items-center"
            >
              <FontAwesomeIcon icon={faFlag} className="mr-2" />
              Set Faction
            </button>
            
            {showFactionDropdown && (
              <div className="absolute bottom-full mb-2 right-0 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {availableFactions.map(faction => (
                  <button
                    key={faction._id}
                    onClick={() => {
                      onBatchUpdateFaction(faction._id);
                      setShowFactionDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    {faction.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Edition dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowEditionDropdown(!showEditionDropdown)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm flex items-center"
            >
              <FontAwesomeIcon icon={faTag} className="mr-2" />
              Set Edition
            </button>
            
            {showEditionDropdown && (
              <div className="absolute bottom-full mb-2 right-0 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {availableEditions.map(edition => (
                  <button
                    key={edition._id}
                    onClick={() => {
                      onBatchUpdateEdition(edition._id);
                      setShowEditionDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    {edition.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Delete button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-2 bg-red-50 border border-red-300 text-red-700 rounded-md text-sm flex items-center"
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2" />
            Delete
          </button>
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-red-600 mb-4">Confirm Deletion</h3>
            <p className="mb-4">
              Are you sure you want to delete {selectedItems.length} selected items? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onBatchDelete();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Delete Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchActionManager; 