import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import dynamic from 'next/dynamic';

import FancyStarshipView from '../components/FancyStarshipView';
import StarshipDetails from '../components/StarshipDetails';
import { Starship } from '../types';
import PdfViewer from '../components/PdfViewer';
import CollectionFilter from '../components/CollectionFilter';
import ModalContainer from '../components/ModalContainer';

// Dynamically import large components
const AddStarshipForm = dynamic(() => import('../components/AddStarshipForm'), {
  loading: () => <div className="p-4 text-center">Loading form...</div>,
  ssr: false
});

const FancyViewPage: React.FC = () => {
  const [starships, setStarships] = useState<Starship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStarship, setSelectedStarship] = useState<Starship | null>(null);
  const [currentEdition, setCurrentEdition] = useState<string>('Regular');
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | undefined>(undefined);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState<string | undefined>(undefined);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [selectedCollectionType, setSelectedCollectionType] = useState<string>('');
  const [selectedFranchise, setSelectedFranchise] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchStarships = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = '/api/starships';
      
      // Add filter parameters if either one is selected
      const queryParams = new URLSearchParams();
      
      if (selectedCollectionType) {
        queryParams.append('collectionType', selectedCollectionType);
      }
      
      if (selectedFranchise) {
        queryParams.append('franchise', selectedFranchise);
      }
      
      // Only append query string if we have parameters
      if (queryParams.toString()) {
        url = `${url}?${queryParams.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch starships');
      }
      
      const data = await response.json();
      setStarships(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setStarships([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOwned = async (id: string) => {
    try {
      const starship = starships.find(s => s._id === id);
      
      if (!starship) return;
      
      const response = await fetch(`/api/starships/${id}/toggle-owned`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to update ownership status');
      }
      
      // Update the starship in the local state
      setStarships(prevStarships => 
        prevStarships.map(ship => 
          ship._id === id ? { ...ship, owned: !ship.owned } : ship
        )
      );
    } catch (err) {
      console.error('Error toggling ownership:', err);
    }
  };

  const handleFilterChange = (collectionType: string, franchise: string) => {
    setSelectedCollectionType(collectionType);
    setSelectedFranchise(franchise);
  };

  const handleSelectStarship = (starship: Starship) => {
    setSelectedStarship(starship);
  };

  const handleCloseModal = () => {
    setSelectedStarship(null);
  };

  const handleEditionChange = (edition: string) => {
    setCurrentEdition(edition);
  };

  const handleRefreshStarships = async () => {
    await fetchStarships();
    // Close the add modal after refresh
    setShowAddModal(false);
  };

  // Fetch starships when filters change
  useEffect(() => {
    fetchStarships();
  }, [selectedCollectionType, selectedFranchise]);

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gallery View</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md shadow-sm"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Add New Item
        </button>
      </div>
      
      {/* Collection Filter */}
      <CollectionFilter onFilterChange={handleFilterChange} className="mb-6" />
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : (
        <FancyStarshipView 
          starships={starships} 
          onToggleOwned={handleToggleOwned}
          onSelectStarship={handleSelectStarship}
          onEditionChange={handleEditionChange}
          currentEdition={currentEdition}
        />
      )}

      {/* Modal for starship details */}
      {selectedStarship && (
        <ModalContainer
          isOpen={!!selectedStarship}
          onClose={handleCloseModal}
          maxWidth="3xl"
          showCloseButton={true}
        >
          <StarshipDetails 
            starship={selectedStarship} 
            onToggleOwned={handleToggleOwned}
            onRefresh={() => fetchStarships()}
            currentEdition={currentEdition}
          />
        </ModalContainer>
      )}

      {/* Modal for adding new starship */}
      <ModalContainer
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        maxWidth="lg"
        showCloseButton={true}
        closeButtonText="Cancel"
      >
        <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Add New Item
              </h3>
              <AddStarshipForm 
                onStarshipAdded={handleRefreshStarships} 
                defaultCollectionType={selectedCollectionType}
                defaultFranchise={selectedFranchise}
              />
            </div>
          </div>
        </div>
      </ModalContainer>

      {/* PDF Viewer Modal */}
      {showPdfViewer && selectedPdfUrl && (
        <PdfViewer 
          pdfUrl={selectedPdfUrl} 
          title={selectedPdfTitle || 'Magazine'} 
          onClose={() => setShowPdfViewer(false)} 
        />
      )}
    </div>
  );
};

export default FancyViewPage;