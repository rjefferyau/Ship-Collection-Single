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

const Home: React.FC = () => {
  const [starships, setStarships] = useState<Starship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStarship, setSelectedStarship] = useState<Starship | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentEdition, setCurrentEdition] = useState<string>('Regular');
  const [selectedCollectionType, setSelectedCollectionType] = useState<string>('');
  const [selectedFranchise, setSelectedFranchise] = useState<string>('');

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

  const handleCycleStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/starships/${id}/cycle-status`, {
        method: 'PUT'
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
            pricePaid: result.data.pricePaid
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
          pricePaid: result.data.pricePaid
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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">The Collection</h1>
        <p className="text-gray-600">Browse and manage your complete starship collection</p>
      </div>

      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md shadow-sm"
        >
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