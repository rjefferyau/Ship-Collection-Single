import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faUpload, faSpinner, faEdit, faSave, faUndo, faPlus, faStar as faStarSolid, faShoppingCart, faBoxOpen, faFilePdf } from '@fortawesome/free-solid-svg-icons';
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

  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown';
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  // Render PDF viewer
  const renderPdfViewer = () => {
    if (!starship.magazinePdfUrl) return null;
    
    return (
      <PdfViewer
        pdfUrl={starship.magazinePdfUrl}
        title={`${starship.shipName} - Magazine`}
        onClose={() => setShowPdfViewer(false)}
      />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            {starship.shipName}
          </h3>
          <div className="flex space-x-2">
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => setIsEditing(!isEditing)}
            >
              <FontAwesomeIcon 
                icon={isEditing ? faUndo : faEdit} 
                className="mr-2"
              />
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Ship Details</h4>
              <dl className="space-y-2">
                <div className="flex">
                  <dt className="w-1/3 font-medium text-gray-500">Issue:</dt>
                  <dd className="w-2/3 text-gray-900">{starship.issue}</dd>
                </div>
                <div className="flex">
                  <dt className="w-1/3 font-medium text-gray-500">Edition:</dt>
                  <dd className="w-2/3 text-gray-900">{starship.edition}</dd>
                </div>
                <div className="flex">
                  <dt className="w-1/3 font-medium text-gray-500">Faction:</dt>
                  <dd className="w-2/3 text-gray-900">{starship.faction}</dd>
                </div>
                <div className="flex">
                  <dt className="w-1/3 font-medium text-gray-500">Release Date:</dt>
                  <dd className="w-2/3 text-gray-900">{formatDate(starship.releaseDate)}</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Collection Status</h4>
              <dl className="space-y-2">
                <div className="flex">
                  <dt className="w-1/3 font-medium text-gray-500">Owned:</dt>
                  <dd className="w-2/3 text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      starship.owned 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {starship.owned ? 'Yes' : 'No'}
                    </span>
                    <button
                      type="button"
                      className="ml-2 inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => onToggleOwned(starship._id)}
                    >
                      {starship.owned ? 'Remove' : 'Add'}
                    </button>
                  </dd>
                </div>
                <div className="flex">
                  <dt className="w-1/3 font-medium text-gray-500">Wishlist:</dt>
                  <dd className="w-2/3 text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      starship.wishlist 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {starship.wishlist ? 'Yes' : 'No'}
                    </span>
                  </dd>
                </div>
                <div className="flex">
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
        </div>
        
        {starship.magazinePdfUrl && (
          <div className="mt-4">
            <h4 className="text-lg font-medium text-gray-900 mb-2">Magazine PDF</h4>
            <button 
              type="button"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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