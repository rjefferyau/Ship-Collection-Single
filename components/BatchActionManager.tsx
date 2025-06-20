import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faTag, faBuilding, faFlag } from '@fortawesome/free-solid-svg-icons';

export interface BatchActionManagerProps {
  selectedCount: number;
  onClearSelection: () => void;
  onUpdateManufacturer: (manufacturerId: string) => void;
  onUpdateFaction: (factionId: string) => void;
  onUpdateEdition: (editionId: string) => void;
  onDelete: () => void;
  manufacturers: any[];
  factions: string[];
  editions: string[];
}

const BatchActionManager: React.FC<BatchActionManagerProps> = ({
  selectedCount,
  onClearSelection,
  onUpdateManufacturer,
  onUpdateFaction,
  onUpdateEdition,
  onDelete,
  manufacturers,
  factions,
  editions
}) => {
  const [showManufacturerDropdown, setShowManufacturerDropdown] = useState(false);
  const [showFactionDropdown, setShowFactionDropdown] = useState(false);
  const [showEditionDropdown, setShowEditionDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  if (selectedCount === 0) return null;
  
  return (
    <div className="bg-white border border-gray-200 shadow-md rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="font-medium text-gray-700 mr-2">
            {selectedCount} items selected
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
              <div className="absolute top-full mt-1 right-0 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {manufacturers.map(manufacturer => (
                  <button
                    key={manufacturer._id}
                    onClick={() => {
                      onUpdateManufacturer(manufacturer._id);
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
              <div className="absolute top-full mt-1 right-0 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {factions.map(faction => (
                  <button
                    key={faction}
                    onClick={() => {
                      onUpdateFaction(faction);
                      setShowFactionDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    {faction}
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
              <div className="absolute top-full mt-1 right-0 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {editions.map(edition => (
                  <button
                    key={edition}
                    onClick={() => {
                      onUpdateEdition(edition);
                      setShowEditionDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    {edition}
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
              Are you sure you want to delete {selectedCount} selected items? This action cannot be undone.
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
                  onDelete();
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