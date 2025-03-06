import React, { useState, useEffect } from 'react';
import { DragDropContext, Draggable, DropResult, DroppableStateSnapshot } from 'react-beautiful-dnd';
import { StrictModeDroppable } from '../components/StrictModeDroppable';
import { Starship } from '../types';

const WishlistPage: React.FC = () => {
  const [starships, setStarships] = useState<Starship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('wishlist');
  const [currencySettings, setCurrencySettings] = useState({
    currency: 'GBP',
    symbol: '£',
    locale: 'en-GB'
  });
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedStarship, setSelectedStarship] = useState<Starship | null>(null);
  const [orderData, setOrderData] = useState({
    pricePaid: '',
    orderDate: new Date().toISOString().split('T')[0]
  });
  const [processingOrder, setProcessingOrder] = useState(false);

  // Load currency settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('currencySettings');
      if (savedSettings) {
        setCurrencySettings(JSON.parse(savedSettings));
      }
    }
    
    fetchStarships();
  }, []);

  // Fetch starships
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
      setStarships([]);
    } finally {
      setLoading(false);
    }
  };

  // Format currency based on settings
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    
    return new Intl.NumberFormat(currencySettings.locale, {
      style: 'currency',
      currency: currencySettings.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  // Toggle wishlist status
  const handleToggleWishlist = async (id: string) => {
    try {
      const response = await fetch(`/api/starships/toggle-wishlist/${id}`, {
        method: 'PUT'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update wishlist status');
      }
      
      await fetchStarships();
      setSuccess('Wishlist updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Mark item as received
  const handleMarkAsReceived = async (id: string) => {
    try {
      const response = await fetch(`/api/starships/${id}/mark-received`, {
        method: 'PUT'
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark item as received');
      }
      
      await fetchStarships();
      setSuccess('Item marked as received and added to your collection');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Handle drag and drop reordering
  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    
    if (!result.destination) return;
    
    const items = Array.from(wishlistItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update priorities based on new order
    const updatedItems = items.map((item, index) => ({
      ...item,
      wishlistPriority: index + 1
    }));
    
    // Update local state immediately for better UX
    setStarships(prevStarships => {
      return prevStarships.map(ship => {
        const updatedItem = updatedItems.find(item => item._id === ship._id);
        return updatedItem ? { ...ship, wishlistPriority: updatedItem.wishlistPriority } : ship;
      });
    });
    
    // Save new priorities to the database - use a single API call with all updates
    try {
      const response = await fetch('/api/starships/update-wishlist-priorities', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          items: updatedItems.map(item => ({ 
            id: item._id, 
            priority: item.wishlistPriority 
          }))
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update priorities');
      }
      
      setSuccess('Wishlist order updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setTimeout(() => setError(null), 3000);
      await fetchStarships(); // Revert to original order on error
    }
  };

  // Filter and sort wishlist items
  const wishlistItems = starships
    .filter(ship => ship.wishlist && !ship.owned && !ship.onOrder)
    .sort((a, b) => {
      // Sort by priority (lower number first)
      const priorityA = a.wishlistPriority || Number.MAX_SAFE_INTEGER;
      const priorityB = b.wishlistPriority || Number.MAX_SAFE_INTEGER;
      return priorityA - priorityB;
    });

  // Filter items that are on order
  const onOrderItems = starships
    .filter(ship => ship.onOrder && !ship.owned)
    .sort((a, b) => {
      // Sort by order date (most recent first)
      const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
      const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
      return dateB - dateA;
    });

  // Handle opening the order modal
  const handleOpenOrderModal = (starship: Starship) => {
    setSelectedStarship(starship);
    setOrderData({
      pricePaid: starship.retailPrice ? starship.retailPrice.toString() : '',
      orderDate: new Date().toISOString().split('T')[0]
    });
    setShowOrderModal(true);
  };

  // Handle marking an item as on order
  const handleMarkAsOnOrder = async () => {
    if (!selectedStarship) return;
    
    setProcessingOrder(true);
    
    try {
      const response = await fetch(`/api/starships/${selectedStarship._id}/toggle-order`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onOrder: true,
          pricePaid: orderData.pricePaid === '' ? null : Number(orderData.pricePaid),
          orderDate: orderData.orderDate || new Date().toISOString().split('T')[0]
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      
      await fetchStarships();
      setSuccess('Item marked as on order');
      setTimeout(() => setSuccess(null), 3000);
      setShowOrderModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessingOrder(false);
    }
  };

  // Handle removing an item from on order status
  const handleRemoveFromOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/starships/${id}/toggle-order`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onOrder: false
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove from order status');
      }
      
      await fetchStarships();
      setSuccess('Item removed from orders and added to wishlist');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Wishlist & Orders</h1>
        <p className="text-gray-600">Manage your wishlist and track your orders</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> {success}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'wishlist'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Wishlist
              </div>
            </button>
            <button
              onClick={() => setActiveTab('on-order')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'on-order'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                On Order
              </div>
            </button>
          </nav>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              <span className="ml-3 text-gray-600">Loading wishlist data...</span>
            </div>
          ) : (
            <div>
              {activeTab === 'wishlist' && (
                <div className={`${isDragging ? 'bg-indigo-50 rounded-lg p-4 transition-all duration-200' : ''}`}>
                  <p className="text-sm text-gray-500 mb-4">
                    Drag and drop items to reorder your wishlist. Higher items have higher priority.
                  </p>
                  
                  <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <StrictModeDroppable droppableId="wishlist">
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {wishlistItems.map((starship, index) => (
                            <Draggable 
                              key={starship._id} 
                              draggableId={starship._id} 
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`wishlist-item mb-3 ${snapshot.isDragging ? 'is-dragging' : ''}`}
                                >
                                  <div className="flex items-center">
                                    <div 
                                      className="priority-badge"
                                      {...provided.dragHandleProps}
                                      title="Drag to reorder"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    </div>
                                    <div className="flex-grow">
                                      <h5 className="text-sm font-medium text-gray-900">{starship.shipName}</h5>
                                      <div className="text-sm text-gray-500">{starship.edition} #{starship.issue} - {starship.faction}</div>
                                    </div>
                                    <div className="flex items-center">
                                      <button 
                                        onClick={(e) => { e.preventDefault(); handleOpenOrderModal(starship); }}
                                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                        </svg>
                                      </button>
                                      <button 
                                        onClick={(e) => { e.preventDefault(); handleToggleWishlist(starship._id); }}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </StrictModeDroppable>
                  </DragDropContext>
                </div>
              )}
              
              {activeTab === 'on-order' && (
                <div>
                  {onOrderItems.map((starship) => (
                    <div key={starship._id} className="on-order-item mb-3">
                      <div className="flex items-center">
                        <div className="flex-grow">
                          <h5 className="text-sm font-medium text-gray-900">{starship.shipName}</h5>
                          <div className="text-sm text-gray-500">{starship.edition} #{starship.issue} - {starship.faction}</div>
                        </div>
                        <div className="flex items-center">
                          <button 
                            onClick={(e) => { e.preventDefault(); handleMarkAsReceived(starship._id); }}
                            className="text-green-600 hover:text-green-900 mr-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                            </svg>
                          </button>
                          <button 
                            onClick={(e) => { e.preventDefault(); handleRemoveFromOrder(starship._id); }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && selectedStarship && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Mark as On Order
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowOrderModal(false)}
              >
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="mb-4">
                <span className="font-medium">{selectedStarship.shipName}</span> - {selectedStarship.edition} #{selectedStarship.issue}
              </p>
              
              <form onSubmit={(e) => { e.preventDefault(); handleMarkAsOnOrder(); }}>
                <div className="mb-4">
                  <label htmlFor="pricePaid" className="block text-sm font-medium text-gray-700 mb-1">
                    Price Paid ({currencySettings.symbol})
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">{currencySettings.symbol}</span>
                    </div>
                    <input
                      type="number"
                      id="pricePaid"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={orderData.pricePaid}
                      onChange={(e) => setOrderData({ ...orderData, pricePaid: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="orderDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Order Date
                  </label>
                  <input
                    type="date"
                    id="orderDate"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    value={orderData.orderDate}
                    onChange={(e) => setOrderData({ ...orderData, orderDate: e.target.value })}
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    onClick={() => setShowOrderModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={processingOrder}
                  >
                    {processingOrder ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      'Mark as On Order'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WishlistPage; 