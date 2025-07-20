import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUpload, 
  faSpinner, 
  faCheck, 
  faExclamationTriangle,
  faImage,
  faRefresh
} from '@fortawesome/free-solid-svg-icons';
import { Starship } from '../types';

interface ShipImageUploaderProps {
  onUploadComplete?: () => void;
  franchise?: string;
  edition?: string;
}

interface UploadStatus {
  [shipId: string]: 'uploading' | 'success' | 'error';
}

const ShipImageUploader: React.FC<ShipImageUploaderProps> = ({
  onUploadComplete,
  franchise,
  edition
}) => {
  const [shipsWithoutImages, setShipsWithoutImages] = useState<Starship[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({});
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchShipsWithoutImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/api/starships?noImage=true';
      const params = new URLSearchParams();
      
      if (franchise) params.append('franchise', franchise);
      if (edition) params.append('edition', edition);
      
      if (params.toString()) {
        url += '&' + params.toString();
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch ships');
      }
      
      const data = await response.json();
      const ships = data.data || [];
      
      // Filter ships that don't have images
      const shipsWithoutImages = ships.filter((ship: Starship) => 
        !ship.imageUrl || ship.imageUrl.trim() === ''
      );
      
      setShipsWithoutImages(shipsWithoutImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ships');
    } finally {
      setLoading(false);
    }
  }, [franchise, edition]);

  useEffect(() => {
    fetchShipsWithoutImages();
  }, [fetchShipsWithoutImages]);

  const handleDragOver = (e: React.DragEvent, shipId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOver(shipId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOver(null);
  };

  const handleDrop = async (e: React.DragEvent, ship: Starship) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOver(null);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (!imageFile) {
      alert('Please drop an image file');
      return;
    }

    await uploadImage(ship, imageFile);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, ship: Starship) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadImage(ship, file);
    
    // Reset the input
    e.target.value = '';
  };

  const uploadImage = async (ship: Starship, file: File) => {
    try {
      setUploadStatus(prev => ({ ...prev, [ship._id]: 'uploading' }));

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file (JPEG, PNG, GIF, etc.)');
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image file size must be less than 10MB');
      }

      const formData = new FormData();
      formData.append('image', file);
      formData.append('starshipId', ship._id);


      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });


      if (!response.ok) {
        let errorMessage = `Upload failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('Server error response:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      setUploadStatus(prev => ({ ...prev, [ship._id]: 'success' }));
      
      // Remove the ship from the list since it now has an image
      setShipsWithoutImages(prev => prev.filter(s => s._id !== ship._id));
      
      // Call the completion callback
      if (onUploadComplete) {
        onUploadComplete();
      }

      // Clear success status after 3 seconds
      setTimeout(() => {
        setUploadStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[ship._id];
          return newStatus;
        });
      }, 3000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error uploading image for ship:', ship.shipName, 'Error:', errorMessage, err);
      
      setUploadStatus(prev => ({ ...prev, [ship._id]: 'error' }));
      
      // Show user-friendly error message
      alert(`Failed to upload image for ${ship.shipName}: ${errorMessage}`);
      
      // Clear error status after 5 seconds
      setTimeout(() => {
        setUploadStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[ship._id];
          return newStatus;
        });
      }, 5000);
    }
  };

  const getStatusIcon = (shipId: string) => {
    const status = uploadStatus[shipId];
    switch (status) {
      case 'uploading':
        return <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-500" />;
      case 'success':
        return <FontAwesomeIcon icon={faCheck} className="text-green-500" />;
      case 'error':
        return <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-gray-400 mr-3" />
          <span className="text-gray-600">Loading ships without images...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-red-500" />
            Error Loading Ships
          </h2>
          <button
            onClick={fetchShipsWithoutImages}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          >
            <FontAwesomeIcon icon={faRefresh} className="mr-1" />
            Retry
          </button>
        </div>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            <FontAwesomeIcon icon={faImage} className="mr-2 text-blue-500" />
            Ships Without Images ({shipsWithoutImages.length})
          </h2>
          <button
            onClick={fetchShipsWithoutImages}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
          >
            <FontAwesomeIcon icon={faRefresh} className="mr-1" />
            Refresh
          </button>
        </div>
        {(franchise || edition) && (
          <p className="text-sm text-gray-600 mt-1">
            Filtered by: {[franchise, edition].filter(Boolean).join(' - ')}
          </p>
        )}
      </div>

      <div className="p-6">
        {shipsWithoutImages.length === 0 ? (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faCheck} className="text-4xl text-green-500 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Set!</h3>
            <p className="text-gray-600">
              All ships in this collection have images. Great work!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {shipsWithoutImages.map((ship) => (
              <div
                key={ship._id}
                className={`border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
                  draggedOver === ship._id
                    ? 'border-blue-500 bg-blue-50'
                    : uploadStatus[ship._id] === 'success'
                    ? 'border-green-300 bg-green-50'
                    : uploadStatus[ship._id] === 'error'
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={(e) => handleDragOver(e, ship._id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, ship)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{ship.shipName}</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="mr-4">Issue: {ship.issue}</span>
                      <span className="mr-4">Edition: {ship.edition}</span>
                      <span>Faction: {ship.faction}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(ship._id)}
                    
                    <div className="text-center">
                      <label className="cursor-pointer inline-flex flex-col items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                        <FontAwesomeIcon 
                          icon={uploadStatus[ship._id] === 'uploading' ? faSpinner : faUpload} 
                          className={`mb-1 ${uploadStatus[ship._id] === 'uploading' ? 'animate-spin' : ''}`}
                        />
                        <span>
                          {uploadStatus[ship._id] === 'uploading' ? 'Uploading...' : 'Select Image'}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileSelect(e, ship)}
                          disabled={uploadStatus[ship._id] === 'uploading'}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Or drag & drop
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipImageUploader; 