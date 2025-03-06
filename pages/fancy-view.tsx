import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

import FancyStarshipView from '../components/FancyStarshipView';
import StarshipDetails from '../components/StarshipDetails';
import { Starship } from '../types';
import PdfViewer from '../components/PdfViewer';

const FancyViewPage: React.FC = () => {
  const [starships, setStarships] = useState<Starship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStarship, setSelectedStarship] = useState<Starship | null>(null);
  const [currentEdition, setCurrentEdition] = useState<string>('Regular');
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | undefined>(undefined);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState<string | undefined>(undefined);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  const fetchStarships = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/starships');
      
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
        body: JSON.stringify({ owned: !starship.owned }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update ownership status');
      }
      
      // Refresh the starships list
      await fetchStarships();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const handleSelectStarship = (starship: Starship) => {
    setSelectedStarship(starship);
  };

  const handleCloseModal = () => {
    setSelectedStarship(null);
  };

  const handleEditionChange = (edition: string) => {
    setCurrentEdition(edition);
    handleRefreshStarships(edition);
  };

  const handleRefreshStarships = async (edition?: string) => {
    await fetchStarships();
    // Close the modal after refresh
    setSelectedStarship(null);
    
    // If an edition was passed, update the current edition
    if (edition) {
      setCurrentEdition(edition);
    }
  };

  useEffect(() => {
    fetchStarships();
  }, []);

  return (
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Starship Gallery</h1>
        <p className="text-gray-600">Visual display of your starship collection</p>
      </div>

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
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        {selectedStarship?.shipName} - {selectedStarship?.edition} #{selectedStarship?.issue}
                      </Dialog.Title>
                      <div className="mt-2">
                        {selectedStarship && (
                          <StarshipDetails
                            starship={selectedStarship}
                            onToggleOwned={handleToggleOwned}
                            onRefresh={handleRefreshStarships}
                            currentEdition={currentEdition}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleCloseModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* PDF Viewer Modal */}
      {showPdfViewer && selectedPdfUrl && (
        <PdfViewer
          pdfUrl={selectedPdfUrl}
          title={selectedPdfTitle}
          onClose={() => setShowPdfViewer(false)}
        />
      )}
    </>
  );
};

export default FancyViewPage;