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
        <Transition.Root show={!!selectedStarship} as={Fragment}>
          <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={handleCloseModal}>
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
              </Transition.Child>

              {/* This element is to trick the browser into centering the modal contents. */}
              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
                &#8203;
              </span>
              
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                  <StarshipDetails 
                    starship={selectedStarship} 
                    onToggleOwned={handleToggleOwned}
                    onRefresh={() => fetchStarships()}
                    currentEdition={currentEdition}
                  />
                </div>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>
      )}

      {/* Modal for adding new starship */}
      <Transition.Root show={showAddModal} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={setShowAddModal}>
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
              &#8203;
            </span>
            
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Add New Item
                      </Dialog.Title>
                      <div className="mt-2">
                        <AddStarshipForm 
                          onStarshipAdded={handleRefreshStarships} 
                          defaultCollectionType={selectedCollectionType}
                          defaultFranchise={selectedFranchise}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* PDF Viewer Modal */}
      {showPdfViewer && selectedPdfUrl && (
        <Transition.Root show={showPdfViewer} as={Fragment}>
          <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={() => setShowPdfViewer(false)}>
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
              </Transition.Child>

              {/* This element is to trick the browser into centering the modal contents. */}
              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
                &#8203;
              </span>
              
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle">
                  <PdfViewer pdfUrl={selectedPdfUrl} title={selectedPdfTitle || 'Magazine'} onClose={() => setShowPdfViewer(false)} />
                </div>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>
      )}
    </div>
  );
};

export default FancyViewPage;