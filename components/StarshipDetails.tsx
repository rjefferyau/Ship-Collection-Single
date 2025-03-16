import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faUpload, faSpinner, faEdit, faSave, faUndo, faPlus, faStar as faStarSolid, faShoppingCart, faBoxOpen, faFilePdf, faInfoCircle, faTag, faCalendarAlt, faUsers, faCube } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import PdfViewer from './PdfViewer';

interface Faction {
  _id: string;
  name: string;
  description?: string;
}

interface Edition {
  _id: string;
  name: string;
  description?: string;
}

interface Starship {
  _id: string;
  issue: string;
  edition: string;
  shipName: string;
  faction: string;
  releaseDate?: Date;
  imageUrl?: string;
  magazinePdfUrl?: string;
  owned: boolean;
  wishlist: boolean;
  wishlistPriority?: number;
  onOrder: boolean;
  pricePaid?: number;
  orderDate?: Date;
  retailPrice?: number;
  purchasePrice?: number;
  marketValue?: number;
}

interface StarshipDetailsProps {
  starship: Starship;
  onToggleOwned: (id: string) => Promise<void>;
  onRefresh: (edition?: string) => void;
  onToggleWishlist?: (id: string) => Promise<void>;
  currentEdition?: string;
}

const StarshipDetails: React.FC<StarshipDetailsProps> = ({ 
  starship, 
  onToggleOwned,
  onRefresh,
  onToggleWishlist,
  currentEdition
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  
  // Add state for editable fields
  const [editedValues, setEditedValues] = useState({
    issue: starship.issue,
    edition: starship.edition,
    shipName: starship.shipName,
    faction: starship.faction,
    releaseDate: starship.releaseDate ? new Date(starship.releaseDate).toISOString().split('T')[0] : '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Update edited values when starship changes
  useEffect(() => {
    setEditedValues({
      issue: starship.issue,
      edition: starship.edition,
      shipName: starship.shipName,
      faction: starship.faction,
      releaseDate: starship.releaseDate ? new Date(starship.releaseDate).toISOString().split('T')[0] : '',
    });
  }, [starship]);

  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown';
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const response = await fetch(`/api/starships/${starship._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editedValues,
          releaseDate: editedValues.releaseDate ? new Date(editedValues.releaseDate) : undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update item');
      }
      
      setIsEditing(false);
      onRefresh(currentEdition);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    formData.append('starshipId', starship._id);
    
    setUploadingImage(true);
    setUploadError(null);
    setUploadSuccess(null);
    
    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }
      
      const data = await response.json();
      setUploadSuccess('Image uploaded successfully');
      onRefresh(currentEdition);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle PDF upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('starshipId', starship._id);
    
    setUploadingPdf(true);
    setUploadError(null);
    setUploadSuccess(null);
    
    try {
      const response = await fetch('/api/upload/pdf', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload PDF');
      }
      
      const data = await response.json();
      setUploadSuccess('Magazine PDF uploaded successfully');
      onRefresh(currentEdition);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setUploadingPdf(false);
    }
  };

  // Render PDF viewer
  const renderPdfViewer = () => {
    if (!starship.magazinePdfUrl || !showPdfViewer) return null;
    
    return (
      <PdfViewer
        pdfUrl={starship.magazinePdfUrl}
        title={`${starship.shipName} - Magazine`}
        onClose={() => setShowPdfViewer(false)}
      />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with image background */}
      <div className="relative">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-90"></div>
        
        {/* Item image or placeholder */}
        <div className="relative flex items-center justify-between p-6 z-10">
          <div className="flex items-center">
            {starship.imageUrl ? (
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md mr-4">
                <img 
                  src={starship.imageUrl} 
                  alt={starship.shipName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-4 border-white shadow-md mr-4">
                <FontAwesomeIcon icon={faCube} className="text-white text-2xl" />
              </div>
            )}
            <div>
              {isEditing ? (
                <input
                  type="text"
                  name="shipName"
                  value={editedValues.shipName}
                  onChange={handleInputChange}
                  className="text-xl font-bold text-white bg-white/20 border border-white/30 rounded px-2 py-1 w-full backdrop-blur-sm"
                  placeholder="Item Name"
                />
              ) : (
                <h3 className="text-xl font-bold text-white">
                  {starship.shipName}
                </h3>
              )}
              <p className="text-white/80 text-sm mt-1">
                {isEditing ? (
                  <span className="flex space-x-2">
                    <input
                      type="text"
                      name="edition"
                      value={editedValues.edition}
                      onChange={handleInputChange}
                      className="bg-white/20 border border-white/30 rounded px-2 py-0.5 text-sm text-white w-24 backdrop-blur-sm"
                      placeholder="Edition"
                    />
                    <span className="text-white/80">#</span>
                    <input
                      type="text"
                      name="issue"
                      value={editedValues.issue}
                      onChange={handleInputChange}
                      className="bg-white/20 border border-white/30 rounded px-2 py-0.5 text-sm text-white w-16 backdrop-blur-sm"
                      placeholder="Issue"
                    />
                  </span>
                ) : (
                  <span>{starship.edition} #{starship.issue}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            {isEditing && (
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-white/30 text-sm font-medium rounded-md text-white bg-green-500/80 hover:bg-green-600/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500/50 backdrop-blur-sm transition-all"
                onClick={handleSave}
                disabled={isSaving}
              >
                <FontAwesomeIcon 
                  icon={isSaving ? faSpinner : faSave} 
                  className={`mr-2 ${isSaving ? 'animate-spin' : ''}`}
                />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            )}
            <button
              type="button"
              className={`inline-flex items-center px-3 py-2 border border-white/30 text-sm font-medium rounded-md text-white ${
                isEditing 
                  ? 'bg-red-500/80 hover:bg-red-600/80 focus:ring-red-500/50' 
                  : 'bg-white/10 hover:bg-white/20 focus:ring-white/50'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 backdrop-blur-sm transition-all`}
              onClick={() => {
                if (isEditing) {
                  // Reset form values when canceling
                  setEditedValues({
                    issue: starship.issue,
                    edition: starship.edition,
                    shipName: starship.shipName,
                    faction: starship.faction,
                    releaseDate: starship.releaseDate ? new Date(starship.releaseDate).toISOString().split('T')[0] : '',
                  });
                }
                setIsEditing(!isEditing);
              }}
            >
              <FontAwesomeIcon 
                icon={isEditing ? faUndo : faEdit} 
                className="mr-2"
              />
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="p-6">
        {uploadError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {uploadError}
          </div>
        )}
        
        {uploadSuccess && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {uploadSuccess}
          </div>
        )}
        
        {saveError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {saveError}
          </div>
        )}
        
        {isEditing && (
          <div className="mb-6 p-5 border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FontAwesomeIcon icon={faEdit} className="mr-2 text-indigo-500" />
              Edit Media
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Upload */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Image
                </label>
                <div className="flex items-center">
                  {starship.imageUrl ? (
                    <div className="w-16 h-16 mr-3 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                      <img 
                        src={starship.imageUrl} 
                        alt={starship.shipName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 mr-3 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200">
                      <FontAwesomeIcon icon={faCube} className="text-gray-400 text-xl" />
                    </div>
                  )}
                  <div className="flex-grow">
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                      <FontAwesomeIcon 
                        icon={uploadingImage ? faSpinner : faUpload} 
                        className={`mr-2 ${uploadingImage ? 'animate-spin' : ''} text-indigo-500`}
                      />
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>
              </div>
              
              {/* PDF Upload */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Magazine PDF
                </label>
                <div className="flex items-center">
                  {starship.magazinePdfUrl ? (
                    <div className="w-16 h-16 mr-3 flex-shrink-0 flex items-center justify-center bg-red-50 rounded-md border border-red-100">
                      <FontAwesomeIcon 
                        icon={faFilePdf} 
                        className="text-red-500 text-2xl"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 mr-3 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-md border border-gray-200">
                      <FontAwesomeIcon 
                        icon={faFilePdf} 
                        className="text-gray-400 text-2xl"
                      />
                    </div>
                  )}
                  <div className="flex-grow">
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                      <FontAwesomeIcon 
                        icon={uploadingPdf ? faSpinner : faUpload} 
                        className={`mr-2 ${uploadingPdf ? 'animate-spin' : ''} text-indigo-500`}
                      />
                      {uploadingPdf ? 'Uploading...' : 'Upload Magazine PDF'}
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                        disabled={uploadingPdf}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-blue-500" />
              Item Details
            </h4>
            <dl className="space-y-3">
              <div className="flex items-center py-2 border-b border-gray-100">
                <dt className="w-1/3 font-medium text-gray-500 flex items-center">
                  <FontAwesomeIcon icon={faTag} className="mr-2 text-gray-400 w-4" />
                  Issue:
                </dt>
                <dd className="w-2/3 text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      name="issue"
                      value={editedValues.issue}
                      onChange={handleInputChange}
                      className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    starship.issue
                  )}
                </dd>
              </div>
              <div className="flex items-center py-2 border-b border-gray-100">
                <dt className="w-1/3 font-medium text-gray-500 flex items-center">
                  <FontAwesomeIcon icon={faBoxOpen} className="mr-2 text-gray-400 w-4" />
                  Edition:
                </dt>
                <dd className="w-2/3 text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      name="edition"
                      value={editedValues.edition}
                      onChange={handleInputChange}
                      className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    starship.edition
                  )}
                </dd>
              </div>
              <div className="flex items-center py-2 border-b border-gray-100">
                <dt className="w-1/3 font-medium text-gray-500 flex items-center">
                  <FontAwesomeIcon icon={faUsers} className="mr-2 text-gray-400 w-4" />
                  Faction:
                </dt>
                <dd className="w-2/3 text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      name="faction"
                      value={editedValues.faction}
                      onChange={handleInputChange}
                      className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    starship.faction
                  )}
                </dd>
              </div>
              <div className="flex items-center py-2">
                <dt className="w-1/3 font-medium text-gray-500 flex items-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-400 w-4" />
                  Release:
                </dt>
                <dd className="w-2/3 text-gray-900">
                  {isEditing ? (
                    <input
                      type="date"
                      name="releaseDate"
                      value={editedValues.releaseDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    formatDate(starship.releaseDate)
                  )}
                </dd>
              </div>
            </dl>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FontAwesomeIcon icon={faStarSolid} className="mr-2 text-yellow-500" />
              Collection Status
            </h4>
            <dl className="space-y-3">
              <div className="flex items-center py-2 border-b border-gray-100">
                <dt className="w-1/3 font-medium text-gray-500">Owned:</dt>
                <dd className="w-2/3 text-gray-900 flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    starship.owned 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {starship.owned ? 'Yes' : 'No'}
                  </span>
                  <button
                    type="button"
                    className={`ml-2 inline-flex items-center px-3 py-1 border text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                      starship.owned
                        ? 'border-red-300 text-red-700 bg-white hover:bg-red-50 focus:ring-red-500'
                        : 'border-green-300 text-green-700 bg-white hover:bg-green-50 focus:ring-green-500'
                    }`}
                    onClick={() => onToggleOwned(starship._id)}
                  >
                    <FontAwesomeIcon icon={starship.owned ? faTimes : faCheck} className="mr-1" />
                    {starship.owned ? 'Remove' : 'Add'}
                  </button>
                </dd>
              </div>
              <div className="flex items-center py-2 border-b border-gray-100">
                <dt className="w-1/3 font-medium text-gray-500">Wishlist:</dt>
                <dd className="w-2/3 text-gray-900">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    starship.wishlist 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {starship.wishlist ? 'Yes' : 'No'}
                  </span>
                  {onToggleWishlist && (
                    <button
                      type="button"
                      className={`ml-2 inline-flex items-center px-3 py-1 border text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                        starship.wishlist
                          ? 'border-red-300 text-red-700 bg-white hover:bg-red-50 focus:ring-red-500'
                          : 'border-blue-300 text-blue-700 bg-white hover:bg-blue-50 focus:ring-blue-500'
                      }`}
                      onClick={() => onToggleWishlist(starship._id)}
                    >
                      <FontAwesomeIcon icon={starship.wishlist ? faTimes : faStarSolid} className="mr-1" />
                      {starship.wishlist ? 'Remove' : 'Add'}
                    </button>
                  )}
                </dd>
              </div>
              <div className="flex items-center py-2">
                <dt className="w-1/3 font-medium text-gray-500">On Order:</dt>
                <dd className="w-2/3 text-gray-900">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    starship.onOrder 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {starship.onOrder ? 'Yes' : 'No'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
        
        {starship.magazinePdfUrl && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-4">
            <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <FontAwesomeIcon icon={faFilePdf} className="mr-2 text-red-500" />
              Magazine PDF
            </h4>
            <button 
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
              onClick={() => setShowPdfViewer(true)}
            >
              <FontAwesomeIcon icon={faFilePdf} className="mr-2" /> View PDF
            </button>
          </div>
        )}
        
        {renderPdfViewer()}
      </div>
    </div>
  );
};

export default StarshipDetails; 