import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCheck, faExclamationTriangle, faUpload } from '@fortawesome/free-solid-svg-icons';
import { Starship } from '../types';

interface ImageUploadRowProps {
  ship: Starship;
  onUploadSuccess: (shipId: string) => void;
  onUploadError: (shipId: string, error: string) => void;
}

type UploadStatus = 'idle' | 'dragover' | 'uploading' | 'success' | 'error';

const ImageUploadRow: React.FC<ImageUploadRowProps> = ({
  ship,
  onUploadSuccess,
  onUploadError
}) => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadStatus === 'idle') {
      setUploadStatus('dragover');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadStatus === 'dragover') {
      setUploadStatus('idle');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadStatus('idle');

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (!imageFile) {
      setErrorMessage('Please drop an image file');
      setUploadStatus('error');
      onUploadError(ship._id, 'Please drop an image file');
      setTimeout(() => setUploadStatus('idle'), 3000);
      return;
    }

    await uploadImage(imageFile);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadImage(file);
    
    // Reset the input
    e.target.value = '';
  };

  const uploadImage = async (file: File) => {
    try {
      setUploadStatus('uploading');
      setErrorMessage('');

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
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      setUploadStatus('success');
      
      // Brief success animation before notifying parent to remove item
      setTimeout(() => {
        onUploadSuccess(ship._id);
      }, 800);

    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error occurred';
      setErrorMessage(error);
      setUploadStatus('error');
      onUploadError(ship._id, error);
      
      // Clear error status after 5 seconds
      setTimeout(() => {
        setUploadStatus('idle');
      }, 5000);
    }
  };

  const getRowClasses = () => {
    const baseClasses = 'border-2 rounded-lg p-4 transition-all duration-200 cursor-pointer';
    
    switch (uploadStatus) {
      case 'dragover':
        return `${baseClasses} border-blue-500 bg-blue-50 border-solid`;
      case 'uploading':
        return `${baseClasses} border-yellow-300 bg-yellow-50 border-solid cursor-wait`;
      case 'success':
        return `${baseClasses} border-green-500 bg-green-50 border-solid`;
      case 'error':
        return `${baseClasses} border-red-300 bg-red-50 border-solid`;
      default:
        return `${baseClasses} border-gray-300 hover:border-gray-400 border-dashed hover:bg-gray-50`;
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <FontAwesomeIcon icon={faSpinner} className="animate-spin text-yellow-600" />;
      case 'success':
        return <FontAwesomeIcon icon={faCheck} className="text-green-600" />;
      case 'error':
        return <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'dragover':
        return 'Drop image here...';
      case 'uploading':
        return 'Uploading...';
      case 'success':
        return 'Image uploaded successfully!';
      case 'error':
        return `Error: ${errorMessage}`;
      default:
        return 'Drag & drop an image here or click to select';
    }
  };

  return (
    <div
      className={getRowClasses()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => {
        if (uploadStatus === 'idle') {
          document.getElementById(`file-input-${ship._id}`)?.click();
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <div className="font-medium text-gray-900">
              Issue {ship.issue || 'N/A'}
            </div>
            <div className="text-gray-900">
              {ship.shipName || 'Unnamed Ship'}
            </div>
            <div className="text-sm text-gray-600">
              {ship.faction || 'Unknown Faction'}
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {getStatusText()}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          
          {uploadStatus === 'idle' && (
            <div className="text-gray-400">
              <FontAwesomeIcon icon={faUpload} className="text-lg" />
            </div>
          )}
        </div>
      </div>
      
      {/* Hidden file input */}
      <input
        id={`file-input-${ship._id}`}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploadStatus === 'uploading'}
      />
    </div>
  );
};

export default ImageUploadRow;