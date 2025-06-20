import React, { useState, useEffect, Fragment, Suspense } from 'react';
import Link from 'next/link';
import { Dialog, Transition } from '@headlessui/react';
import dynamic from 'next/dynamic';
import { Starship } from '../types';
import CollectionFilter from '../components/CollectionFilter';
import ModalContainer from '../components/ModalContainer';

// Dynamically import large components
const StarshipList = dynamic(() => import('../components/StarshipList'), {
  loading: () => <div className="p-4 text-center">Loading starship list...</div>,
  ssr: false
});

const StarshipDetails = dynamic(() => import('../components/StarshipDetails'), {
  loading: () => <div className="p-4 text-center">Loading details...</div>,
  ssr: false
});

const AddStarshipForm = dynamic(() => import('../components/AddStarshipForm'), {
  loading: () => <div className="p-4 text-center">Loading form...</div>,
  ssr: false
});

const ExcelView = dynamic(() => import('../components/ExcelView'), {
  loading: () => <div className="p-4 text-center">Loading Excel view...</div>,
  ssr: false
});

const Home: React.FC = () => {
  const [starships, setStarships] = useState<Starship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStarship, setSelectedStarship] = useState<Starship | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentEdition, setCurrentEdition] = useState<string>('Regular');
  const [selectedCollectionType, setSelectedCollectionType] = useState<string>('');
  const [selectedFranchise, setSelectedFranchise] = useState<string>('');
  const [excelViewWindow, setExcelViewWindow] = useState<Window | null>(null);

  // Fetch default edition on component mount
  useEffect(() => {
    fetchDefaultEdition().then(() => {
      // After fetching the default edition, fetch starships
      fetchStarships();
    });
  }, []);

  // Also fetch default edition when franchise changes
  useEffect(() => {
    if (selectedFranchise) {
      fetchDefaultEdition(selectedFranchise).then(() => {
        // After fetching the default edition, fetch starships
        fetchStarships();
      });
    }
  }, [selectedFranchise]);

  const fetchDefaultEdition = async (franchise?: string) => {
    try {
      let url = '/api/editions?default=true';
      
      // If a franchise is specified, add it to the query
      if (franchise) {
        url += `&franchise=${encodeURIComponent(franchise)}`;
      }
      
      console.log('Fetching default edition for franchise:', franchise || 'all');
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch default edition');
      }
      
      const data = await response.json();
      console.log('Default edition data:', data);
      
      if (data.success && data.data && data.data.length > 0) {
        // Set the default edition as the current edition
        const defaultEdition = data.data[0].internalName;
        console.log('Setting default edition:', defaultEdition);
        setCurrentEdition(defaultEdition);
        return defaultEdition;
      } else {
        // If no default edition is found, try to find any edition for this franchise
        if (franchise) {
          const fallbackResponse = await fetch(`/api/editions?franchise=${encodeURIComponent(franchise)}`);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.success && fallbackData.data && fallbackData.data.length > 0) {
              const firstEdition = fallbackData.data[0].internalName;
              console.log('No default edition found, using first available edition:', firstEdition);
              setCurrentEdition(firstEdition);
              return firstEdition;
            }
          }
        }
        
        console.log('No default edition found, using Regular');
        setCurrentEdition('regular-star-trek');
        return 'regular-star-trek';
      }
    } catch (err) {
      console.error('Error fetching default edition:', err);
      // If there's an error, we'll just use the default 'Regular'
      setCurrentEdition('regular-star-trek');
      return 'regular-star-trek';
    }
  };

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

  // Fetch starships when filters change
  useEffect(() => {
    // Only fetch starships if this is not the initial load
    // The initial load is handled by the fetchDefaultEdition effect
    if (selectedCollectionType || selectedFranchise) {
      fetchStarships();
    }
  }, [selectedCollectionType, selectedFranchise]);

  const handleFilterChange = (collectionType: string, franchise: string) => {
    console.log('Filter changed:', { collectionType, franchise });
    setSelectedCollectionType(collectionType);
    setSelectedFranchise(franchise);
  };

  const handleToggleOwned = async (id: string) => {
    try {
      const response = await fetch(`/api/starships/toggle-owned/${id}`, {
        method: 'PUT'
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
      
      // If the selected starship is the one being updated, update it too
      if (selectedStarship && selectedStarship._id === id) {
        setSelectedStarship(prev => prev ? { ...prev, owned: !prev.owned } : null);
      }
    } catch (err) {
      console.error('Error toggling ownership:', err);
    }
  };

  const handleToggleWishlist = async (id: string) => {
    try {
      const response = await fetch(`/api/starships/toggle-wishlist/${id}`, {
        method: 'PUT'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update wishlist status');
      }
      
      const result = await response.json();
      
      // Update the starship in the local state
      setStarships(prevStarships => 
        prevStarships.map(ship => 
          ship._id === id ? { 
            ...ship, 
            wishlist: result.data.wishlist,
            wishlistPriority: result.data.wishlistPriority 
          } : ship
        )
      );
      
      // If the selected starship is the one being updated, update it too
      if (selectedStarship && selectedStarship._id === id) {
        setSelectedStarship(prev => prev ? { 
          ...prev, 
          wishlist: result.data.wishlist,
          wishlistPriority: result.data.wishlistPriority 
        } : null);
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    }
  };

  const handleCycleStatus = async (id: string, direction: string = 'forward') => {
    try {
      const response = await fetch(`/api/starships/${id}/cycle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ direction })
      });
      
      if (!response.ok) {
        throw new Error('Failed to cycle status');
      }
      
      const result = await response.json();
      
      // Update the starship in the local state
      setStarships(prevStarships => 
        prevStarships.map(ship => 
          ship._id === id ? { 
            ...ship, 
            wishlist: result.data.wishlist,
            wishlistPriority: result.data.wishlistPriority,
            onOrder: result.data.onOrder,
            orderDate: result.data.orderDate,
            pricePaid: result.data.pricePaid,
            owned: result.data.owned,
            notInterested: result.data.notInterested
          } : ship
        )
      );
      
      // If the selected starship is the one being updated, update it too
      if (selectedStarship && selectedStarship._id === id) {
        setSelectedStarship(prev => prev ? { 
          ...prev, 
          wishlist: result.data.wishlist,
          wishlistPriority: result.data.wishlistPriority,
          onOrder: result.data.onOrder,
          orderDate: result.data.orderDate,
          pricePaid: result.data.pricePaid,
          owned: result.data.owned,
          notInterested: result.data.notInterested
        } : null);
      }
    } catch (err) {
      console.error('Error cycling status:', err);
    }
  };

  const handleSelectStarship = (starship: Starship) => {
    setSelectedStarship(starship);
  };

  const handleRefreshStarships = async (edition?: string) => {
    await fetchStarships();
    // Close the add modal after refresh
    setShowAddModal(false);
    
    // If an edition was passed, update the current edition
    if (edition) {
      setCurrentEdition(edition);
    }
  };

  const handleEditionChange = (edition: string) => {
    setCurrentEdition(edition);
  };

  // Function to open Excel view in a new window
  const openExcelView = () => {
    // Close any existing Excel view window
    if (excelViewWindow && !excelViewWindow.closed) {
      excelViewWindow.close();
    }
    
    // Open the Excel view page in a new window with specific dimensions
    const newWindow = window.open('/excel-view', 'excelView', 'width=1200,height=800');
    
    if (newWindow) {
      // Store the starships data in the new window for it to use
      (newWindow as any).starships = starships;
      
      // Define a function that the Excel view can call to close itself
      (newWindow as any).onClose = () => {
        newWindow.close();
      };
      
      // Update the state with the new window reference
      setExcelViewWindow(newWindow);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Modern Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 pt-8 pb-12">
        <div className="w-full px-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              The Collection
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 font-medium max-w-3xl mx-auto">
              Discover, organize, and manage your complete starship collection with intelligent filtering and modern design
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="group bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl border border-white/20"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-200">
                  <span className="text-lg font-bold">+</span>
                </div>
                <span className="text-lg">Add New Item to Collection</span>
              </div>
            </button>
            
            <button
              onClick={openExcelView}
              className="group bg-green-600/90 backdrop-blur-sm hover:bg-green-600 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl border border-green-500/20"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-lg">Open in Excel</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full px-6 -mt-6 relative z-10">
        {/* Enhanced Collection Filter */}
        <CollectionFilter onFilterChange={handleFilterChange} className="mb-8" />

        {/* Content Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-24 px-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-indigo-600 absolute top-0 left-0"></div>
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-lg font-semibold text-gray-800">Loading your collection...</h3>
                <p className="text-gray-600 mt-2">Please wait while we gather your starships</p>
              </div>
            </div>
          ) : error ? (
            <div className="mx-6 my-8">
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg">
                      <span className="text-red-600 font-bold">!</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-red-800">Something went wrong</h3>
                    <p className="text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <StarshipList
                starships={starships}
                onToggleOwned={handleToggleOwned}
                onSelectStarship={handleSelectStarship}
                onToggleWishlist={handleToggleWishlist}
                onCycleStatus={handleCycleStatus}
                onEditionChange={handleEditionChange}
                currentEdition={currentEdition}
                selectedFranchise={selectedFranchise}
              />
            </div>
          )}
        </div>
      </div>

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

      {/* Modal for starship details */}
      <ModalContainer 
        isOpen={!!selectedStarship} 
        onClose={() => setSelectedStarship(null)}
        maxWidth="5xl"
        showCloseButton={true}
      >
        {selectedStarship && (
          <StarshipDetails
            starship={selectedStarship}
            onToggleOwned={handleToggleOwned}
            onRefresh={handleRefreshStarships}
            onToggleWishlist={handleToggleWishlist}
            currentEdition={currentEdition}
          />
        )}
      </ModalContainer>
    </div>
  );
};

export default Home; 