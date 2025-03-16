import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Starship } from '../pages/api/starships';

interface ConditionTrackerProps {
  starship: Starship;
  onUpdate: (updatedData: Partial<Starship>) => Promise<void>;
}

const ConditionTracker: React.FC<ConditionTrackerProps> = ({ starship, onUpdate }) => {
  const [condition, setCondition] = useState(starship.condition || 'Mint');
  const [notes, setNotes] = useState(starship.conditionNotes || '');
  const [photos, setPhotos] = useState<string[]>(starship.conditionPhotos || []);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handlePhotoUpload = async () => {
    if (!newPhoto) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, you would upload to a storage service
      // For now, we'll use a placeholder URL
      const photoUrl = URL.createObjectURL(newPhoto);
      
      const newPhotos = [...photos, photoUrl];
      setPhotos(newPhotos);
      
      await onUpdate({
        conditionPhotos: newPhotos
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setIsLoading(false);
      setNewPhoto(null);
    }
  };
  
  const handleRemovePhoto = async (index: number) => {
    try {
      const newPhotos = [...photos];
      newPhotos.splice(index, 1);
      setPhotos(newPhotos);
      
      await onUpdate({
        conditionPhotos: newPhotos
      });
    } catch (error) {
      console.error('Error removing photo:', error);
    }
  };
  
  const saveConditionChanges = async () => {
    setIsLoading(true);
    try {
      await onUpdate({
        condition,
        conditionNotes: notes,
        lastInspectionDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving condition changes:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mt-3">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <h5 className="text-lg font-medium text-gray-700 mb-0">Condition Details</h5>
      </div>
      <div className="p-5">
        <form>
          <div className="mb-3">
            <label htmlFor="condition-select" className="block text-sm font-medium text-gray-700 mb-1">
              Condition
            </label>
            <select
              id="condition-select"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="Mint">Mint</option>
              <option value="Near Mint">Near Mint</option>
              <option value="Very Good">Very Good</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
          
          <div className="mb-3">
            <label htmlFor="condition-notes" className="block text-sm font-medium text-gray-700 mb-1">
              Condition Notes
            </label>
            <textarea
              id="condition-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe any damage, wear, or special features..."
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition Photos
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo}
                    alt={`Condition photo ${index+1}`}
                    className="w-24 h-24 object-cover border border-gray-300 rounded"
                  />
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-bl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={() => handleRemovePhoto(index)}
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  setNewPhoto(target.files?.[0] || null);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <button
                type="button"
                onClick={handlePhotoUpload}
                disabled={!newPhoto || isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faCamera} className="mr-2" /> Add
              </button>
            </div>
          </div>
          
          <button
            type="button"
            onClick={saveConditionChanges}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Condition Details'}
          </button>
        </form>
      </div>
      <div className="bg-gray-50 px-4 py-3 text-sm text-gray-500 border-t border-gray-200">
        Last inspection: {starship.lastInspectionDate 
          ? new Date(starship.lastInspectionDate).toLocaleDateString() 
          : 'Never'}
      </div>
    </div>
  );
};

export default ConditionTracker; 