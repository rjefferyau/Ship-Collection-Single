import React, { useState, useEffect, Fragment, Suspense } from 'react';
import Link from 'next/link';
import { Dialog, Transition } from '@headlessui/react';
import dynamic from 'next/dynamic';
import { Starship, PaginationInfo } from '../types';
import CollectionFilter from '../components/CollectionFilter';
import ModalContainer from '../components/ModalContainer';
import CustomViewManager from '../components/CustomViewManager';
import Pagination from '../components/Pagination';

// Dynamically import large components
const StarshipList = dynamic(() => import('../components/StarshipList'), {
  loading: () => <div className="p-4 text-center">Loading starship list...</div>,
  ssr: false
});

const FancyStarshipView = dynamic(() => import('../components/FancyStarshipView'), {
  loading: () => <div className="p-4 text-center">Loading gallery view...</div>,
  ssr: false
});

const CollectionOverview = dynamic(() => import('../components/CollectionOverview'), {
  loading: () => <div className="p-4 text-center">Loading collection overview...</div>,
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

type ViewMode = 'table' | 'gallery' | 'overview';

const Home: React.FC = () => {
  const [starships, setStarships] = useState<Starship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [statusCounts, setStatusCounts] = useState<{owned: number, wishlist: number, onOrder: number, notOwned: number} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStarship, setSelectedStarship] = useState<Starship | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentEdition, setCurrentEdition] = useState<string>('Regular');
  const [selectedCollectionType, setSelectedCollectionType] = useState<string>('');
  const [selectedFranchise, setSelectedFranchise] = useState<string>('');
  const [excelViewWindow, setExcelViewWindow] = useState<Window | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Fetch default edition on component mount
  useEffect(() => {
    fetchDefaultEdition().then(() => {
      // After fetching the default edition, fetch starships
      fetchStarships(1);
    });
  }, []);

  // Also fetch default edition when franchise changes
  useEffect(() => {
    if (selectedFranchise) {
      fetchDefaultEdition(selectedFranchise).then(() => {
        // After fetching the default edition, fetch starships
        fetchStarships(1, true);
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
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch default edition');
      }
      
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // Set the default edition as the current edition
        const defaultEdition = data.data[0].internalName;
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
              setCurrentEdition(firstEdition);
              return firstEdition;
            }
          }
        }
        
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

  const fetchStarships = async (page = 1, resetPage = false) => {
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
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      if (currentEdition) {
        queryParams.append('edition', currentEdition);
      }
      
      // Add pagination parameters - use different limits based on view mode
      if (viewMode === 'table') {
        queryParams.append('page', resetPage ? '1' : page.toString());
        queryParams.append('limit', '50'); // Items per page for table view
      } else {
        // For gallery and overview modes, fetch all items
        queryParams.append('page', '1');
        queryParams.append('limit', '1000'); // Large limit to get all items
      }
      
      // Add cache-busting parameter to force fresh data
      queryParams.append('_t', Date.now().toString());
      
      // Append query string 
      url = `${url}?${queryParams.toString()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch starships');
      }
      
      const data = await response.json();
      setStarships(data.data || []);
      setPagination(data.pagination || null);
      setStatusCounts(data.statusCounts || null);
      
      if (resetPage) {
        setCurrentPage(1);
      } else {
        setCurrentPage(page);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setStarships([]);
      setPagination(null);
      setStatusCounts(null);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    // Skip if currentEdition is not set
    if (!currentEdition) return;

    // If search is empty, fetch immediately (but only if we had a search before)
    if (!searchTerm || searchTerm.trim().length === 0) {
      fetchStarships(1, true);
      return;
    }

    // Debounce search input - wait 1200ms after user stops typing
    console.log('Setting search timeout for:', searchTerm);
    const searchTimeout = setTimeout(() => {
      console.log('Executing search for:', searchTerm);
      fetchStarships(1, true);
    }, 1200);

    return () => {
      console.log('Clearing search timeout for:', searchTerm);
      clearTimeout(searchTimeout);
    };
  }, [searchTerm]);

  // Fetch starships when non-search filters change (but not search)
  useEffect(() => {
    // Only fetch starships if this is not the initial load
    // The initial load is handled by the fetchDefaultEdition effect
    if (currentEdition) {
      console.log('Fetching due to filter change, not search');
      fetchStarships(1, true); // Reset to page 1 when filters change
    }
  }, [selectedCollectionType, selectedFranchise, currentEdition]);

  // Refetch data when view mode changes to adjust pagination
  useEffect(() => {
    if (currentEdition) {
      console.log('Fetching due to view mode change:', viewMode);
      fetchStarships(1, true); // Reset to page 1 with new limit based on view mode
    }
  }, [viewMode]);

  const handleFilterChange = (collectionType: string, franchise: string) => {
    setSelectedCollectionType(collectionType);
    setSelectedFranchise(franchise);
  };

  const handlePageChange = (page: number) => {
    fetchStarships(page);
  };

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    // The useEffect will handle refetching with the new search term
  };

  const handleClearSearch = () => {
    setSearchTerm('');
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
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`Failed to update wishlist status: ${errorData.error || errorData.message || response.statusText}`);
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
      alert(`Failed to update wishlist status: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      
      const result = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 404) {
          console.error('Starship not found:', result.message);
          // Optionally refresh the starship list to sync with database
          fetchStarships(currentPage);
          return;
        }
        throw new Error(result.message || 'Failed to cycle status');
      }
      
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
      // Show user-friendly error message
      alert(`Failed to update starship status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSelectStarship = (starship: Starship) => {
    setSelectedStarship(starship);
  };

  const handleRefreshStarships = async (edition?: string) => {
    await fetchStarships(currentPage);
    // Close the add modal after refresh
    setShowAddModal(false);
    
    // If an edition was passed, update the current edition
    if (edition) {
      setCurrentEdition(edition);
    }
  };


  const handleEditionChange = (edition: string) => {
    setCurrentEdition(edition);
    // Clear search when switching editions/tabs
    setSearchTerm('');
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
          <div className="flex justify-center space-x-4 flex-wrap gap-4">
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
            
            <Link href="/checklist">
              <button
                className="group bg-purple-600/90 backdrop-blur-sm hover:bg-purple-600 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl border border-purple-500/20"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100-4h-.5a1 1 0 000-2H8a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-lg">Print Checklist</span>
                </div>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full px-6 -mt-6 relative z-10">
        {/* Enhanced Collection Filter */}
        <CollectionFilter onFilterChange={handleFilterChange} className="mb-8" />

        {/* Content Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
          {/* View Toggle */}
          {!loading && !error && (
            <div className="px-6 py-4 border-b border-gray-200/50 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold text-gray-800">Your Collection</h2>
                  <span className="text-sm text-gray-600">
                    {pagination?.total || starships.length} {(pagination?.total || starships.length) === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        viewMode === 'table'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-9 8h9" />
                      </svg>
                      <span>Table</span>
                    </button>
                    <button
                      onClick={() => setViewMode('gallery')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        viewMode === 'gallery'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span>Gallery</span>
                    </button>
                    <button
                      onClick={() => setViewMode('overview')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        viewMode === 'overview'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Overview</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50 shadow-sm transition-all duration-200"
                    title="View Settings"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    <span>Settings</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
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
              {viewMode === 'table' ? (
                <div className="space-y-4">
                  <StarshipList
                    starships={starships}
                    onToggleOwned={handleToggleOwned}
                    onSelectStarship={handleSelectStarship}
                    onToggleWishlist={handleToggleWishlist}
                    onCycleStatus={handleCycleStatus}
                    onEditionChange={handleEditionChange}
                    currentEdition={currentEdition}
                    selectedFranchise={selectedFranchise}
                    onSearchChange={handleSearchChange}
                    onClearSearch={handleClearSearch}
                    searchTerm={searchTerm}
                    statusCounts={statusCounts}
                  />
                  {pagination && (
                    <Pagination
                      pagination={pagination}
                      onPageChange={handlePageChange}
                      className="mt-6"
                    />
                  )}
                </div>
              ) : viewMode === 'gallery' ? (
                <FancyStarshipView
                  starships={starships}
                  onToggleOwned={handleToggleOwned}
                  onSelectStarship={handleSelectStarship}
                  onEditionChange={handleEditionChange}
                  currentEdition={currentEdition}
                />
              ) : (
                <CollectionOverview
                  starships={starships}
                  onToggleOwned={handleToggleOwned}
                  onSelectStarship={handleSelectStarship}
                  onEditionChange={handleEditionChange}
                  currentEdition={currentEdition}
                  selectedFranchise={selectedFranchise}
                  statusCounts={statusCounts}
                />
              )}
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

      {/* Settings Modal */}
      <ModalContainer
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        maxWidth="2xl"
        showCloseButton={true}
        closeButtonText="Close"
      >
        <div className="px-6 py-4">
          <div className="mb-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">
              View Settings
            </h3>
            <p className="text-sm text-gray-600">
              Manage your custom views, columns, and display preferences
            </p>
          </div>
          
          <CustomViewManager
            availableColumns={[
              { key: 'issue', label: 'Issue' },
              { key: 'shipName', label: 'Ship Name' },
              { key: 'faction', label: 'Faction' },
              { key: 'edition', label: 'Edition' },
              { key: 'owned', label: 'Owned' },
              { key: 'wishlist', label: 'Wishlist' },
              { key: 'onOrder', label: 'On Order' },
              { key: 'notInterested', label: 'Not Interested' },
              { key: 'releaseDate', label: 'Release Date' },
              { key: 'manufacturer', label: 'Manufacturer' },
              { key: 'collectionType', label: 'Collection Type' },
              { key: 'franchise', label: 'Franchise' },
              { key: 'retailPrice', label: 'Retail Price' },
              { key: 'purchasePrice', label: 'Purchase Price' },
              { key: 'marketValue', label: 'Market Value' },
            ]}
            onViewSelect={(view) => {
              // Handle view selection - this would need to be passed to the StarshipList component
              setShowSettingsModal(false);
            }}
            currentColumns={['issue', 'shipName', 'faction', 'edition', 'owned']}
            currentFilters={{}}
            currentSortConfig={{ key: 'issue', direction: 'asc' }}
          />
        </div>
      </ModalContainer>
    </div>
  );
};

export default Home; 