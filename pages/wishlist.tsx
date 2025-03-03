import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Row, Col, Card, Button, Breadcrumb, Alert, Form, Badge, Tabs, Tab, Modal, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faHome, faArrowUp, faArrowDown, faGripVertical, faShoppingCart, faBoxOpen, faCheck, faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import { DragDropContext, Draggable, DropResult, DroppableStateSnapshot } from 'react-beautiful-dnd';
import { StrictModeDroppable } from '../components/StrictModeDroppable';

interface Starship {
  _id: string;
  issue: string;
  edition: string;
  shipName: string;
  faction: string;
  releaseDate?: Date;
  imageUrl?: string;
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
  }, []);

  // Fetch starships
  useEffect(() => {
    fetchStarships();
  }, []);

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
      <Head>
        <title>Wishlist - Starship Collection Manager</title>
      </Head>

      <div className="page-header">
        <h1>Wishlist</h1>
        <Breadcrumb>
          <Breadcrumb.Item href="/">
            <FontAwesomeIcon icon={faHome} className="me-2" /> Home
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            <FontAwesomeIcon icon={faStar} className="me-2" /> Wishlist
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || 'wishlist')}
        className="mb-4"
      >
        <Tab 
          eventKey="wishlist" 
          title={
            <span>
              <FontAwesomeIcon icon={faStar} className="me-2" />
              Wishlist ({wishlistItems.length})
            </span>
          }
        >
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">My Wishlist ({wishlistItems.length} items)</h5>
                  {wishlistItems.length > 0 && (
                    <div className="text-muted small">
                      <FontAwesomeIcon icon={faGripVertical} className="me-1" /> Drag items to reorder
                    </div>
                  )}
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="text-center p-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading wishlist...</p>
                    </div>
                  ) : wishlistItems.length === 0 ? (
                    <div className="text-center p-4">
                      <FontAwesomeIcon icon={faStar} className="text-muted fa-3x mb-3" />
                      <h5>Your wishlist is empty</h5>
                      <p>Add items to your wishlist by clicking the star icon on the collection page.</p>
                    </div>
                  ) : (
                    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                      <StrictModeDroppable droppableId="wishlist">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="wishlist-items"
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
                                    <Card>
                                      <Card.Body>
                                        <Row className="align-items-center">
                                          <Col xs={12} md={1} className="text-center mb-3 mb-md-0">
                                            <div 
                                              className="priority-badge"
                                              {...provided.dragHandleProps}
                                              title="Drag to reorder"
                                            >
                                              <FontAwesomeIcon icon={faGripVertical} className="drag-handle-icon" />
                                            </div>
                                          </Col>
                                          <Col xs={12} md={2} className="text-center mb-3 mb-md-0">
                                            {starship.imageUrl ? (
                                              <img 
                                                src={starship.imageUrl} 
                                                alt={starship.shipName}
                                                style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                                                className="img-thumbnail"
                                              />
                                            ) : (
                                              <div 
                                                className="bg-light d-flex align-items-center justify-content-center" 
                                                style={{ width: '80px', height: '80px', margin: '0 auto' }}
                                              >
                                                <small className="text-muted">No image</small>
                                              </div>
                                            )}
                                          </Col>
                                          <Col xs={12} md={4} className="mb-3 mb-md-0">
                                            <h5>{starship.shipName}</h5>
                                            <div className="text-muted">
                                              {starship.edition} #{starship.issue} - {starship.faction}
                                            </div>
                                          </Col>
                                          <Col xs={6} md={2} className="text-center mb-3 mb-md-0">
                                            <div className="small text-muted">Retail Price</div>
                                            <div className="fw-bold">{formatCurrency(starship.retailPrice)}</div>
                                          </Col>
                                          <Col xs={6} md={3} className="text-end">
                                            <div className="d-flex justify-content-end gap-2">
                                              <Button 
                                                variant="info" 
                                                size="sm"
                                                onClick={() => handleOpenOrderModal(starship)}
                                                title="Mark as On Order"
                                              >
                                                <FontAwesomeIcon icon={faShoppingCart} /> Order
                                              </Button>
                                              <Button 
                                                variant="warning" 
                                                size="sm"
                                                onClick={() => handleToggleWishlist(starship._id)}
                                                title="Remove from Wishlist"
                                              >
                                                <FontAwesomeIcon icon={faStar} /> Remove
                                              </Button>
                                            </div>
                                          </Col>
                                        </Row>
                                      </Card.Body>
                                    </Card>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </StrictModeDroppable>
                    </DragDropContext>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
        <Tab 
          eventKey="onOrder" 
          title={
            <span>
              <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
              On Order ({onOrderItems.length})
            </span>
          }
        >
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Items On Order ({onOrderItems.length})</h5>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="text-center p-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading orders...</p>
                    </div>
                  ) : onOrderItems.length === 0 ? (
                    <div className="text-center p-4">
                      <FontAwesomeIcon icon={faShoppingCart} className="text-muted fa-3x mb-3" />
                      <h5>No items on order</h5>
                      <p>Items you've ordered but not yet received will appear here.</p>
                    </div>
                  ) : (
                    <div className="on-order-items">
                      {onOrderItems.map((starship) => (
                        <div key={starship._id} className="on-order-item mb-3">
                          <Card>
                            <Card.Body>
                              <Row className="align-items-center">
                                <Col xs={12} md={2} className="text-center mb-3 mb-md-0">
                                  {starship.imageUrl ? (
                                    <img 
                                      src={starship.imageUrl} 
                                      alt={starship.shipName}
                                      style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                                      className="img-thumbnail"
                                    />
                                  ) : (
                                    <div 
                                      className="bg-light d-flex align-items-center justify-content-center" 
                                      style={{ width: '80px', height: '80px', margin: '0 auto' }}
                                    >
                                      <small className="text-muted">No image</small>
                                    </div>
                                  )}
                                </Col>
                                <Col xs={12} md={3} className="mb-3 mb-md-0">
                                  <h5>{starship.shipName}</h5>
                                  <div className="text-muted">
                                    {starship.edition} #{starship.issue} - {starship.faction}
                                  </div>
                                </Col>
                                <Col xs={6} md={2} className="mb-3 mb-md-0">
                                  <div className="small text-muted">Price Paid</div>
                                  <div className="fw-bold">{formatCurrency(starship.pricePaid)}</div>
                                </Col>
                                <Col xs={6} md={2} className="mb-3 mb-md-0">
                                  <div className="small text-muted">Order Date</div>
                                  <div>{formatDate(starship.orderDate)}</div>
                                </Col>
                                <Col xs={12} md={3} className="text-end">
                                  <div className="d-flex justify-content-end gap-2">
                                    <Button 
                                      variant="success" 
                                      size="sm"
                                      onClick={() => handleMarkAsReceived(starship._id)}
                                      title="Mark as Received"
                                    >
                                      <FontAwesomeIcon icon={faCheck} className="me-2" />
                                      Received
                                    </Button>
                                    <Button 
                                      variant="danger" 
                                      size="sm"
                                      onClick={() => handleRemoveFromOrder(starship._id)}
                                      title="Remove from Orders"
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </Button>
                                  </div>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
      
      {/* Order Modal */}
      <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Mark as On Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStarship && (
            <>
              <div className="mb-3">
                <h5>{selectedStarship.shipName}</h5>
                <div className="text-muted">
                  {selectedStarship.edition} #{selectedStarship.issue} - {selectedStarship.faction}
                </div>
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Price Paid</Form.Label>
                <InputGroup>
                  <InputGroup.Text>{currencySettings.symbol}</InputGroup.Text>
                  <Form.Control 
                    type="number" 
                    step="0.01" 
                    value={orderData.pricePaid} 
                    onChange={(e) => setOrderData({...orderData, pricePaid: e.target.value})}
                    placeholder="Enter price paid"
                  />
                </InputGroup>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Order Date</Form.Label>
                <Form.Control 
                  type="date" 
                  value={orderData.orderDate} 
                  onChange={(e) => setOrderData({...orderData, orderDate: e.target.value})}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleMarkAsOnOrder}
            disabled={processingOrder}
          >
            {processingOrder ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                Confirm Order
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      <style jsx>{`
        .wishlist-items {
          min-height: 200px;
        }
        
        .wishlist-item {
          transition: all 0.2s ease;
        }
        
        .wishlist-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .wishlist-item.is-dragging {
          transform: rotate(1deg) scale(1.02);
          box-shadow: 0 8px 16px rgba(0,0,0,0.15);
          z-index: 100;
        }
        
        .priority-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #ffc107;
          border: 2px solid #e0a800;
          color: #212529;
          font-weight: bold;
          margin: 0 auto;
          position: relative;
          cursor: grab;
        }
        
        .priority-badge:hover {
          background-color: #e0a800;
        }
        
        .drag-handle-icon {
          font-size: 16px;
          color: #212529;
        }
        
        .on-order-item {
          transition: all 0.2s ease;
        }
        
        .on-order-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
      `}</style>
    </>
  );
};

export default WishlistPage; 