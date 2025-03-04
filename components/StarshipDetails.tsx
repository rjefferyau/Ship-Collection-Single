import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Row, Col, Spinner, InputGroup } from 'react-bootstrap';
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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);
  const [pdfUploadSuccess, setPdfUploadSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Omit<Starship, '_id' | 'owned'>>({
    issue: starship.issue,
    edition: starship.edition,
    shipName: starship.shipName,
    faction: starship.faction,
    releaseDate: starship.releaseDate,
    imageUrl: starship.imageUrl,
    magazinePdfUrl: starship.magazinePdfUrl,
    wishlist: starship.wishlist,
    wishlistPriority: starship.wishlistPriority,
    onOrder: starship.onOrder,
    pricePaid: starship.pricePaid,
    orderDate: starship.orderDate,
    retailPrice: starship.retailPrice,
    purchasePrice: starship.purchasePrice,
    marketValue: starship.marketValue
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [orderStatusMessage, setOrderStatusMessage] = useState<string | null>(null);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [loadingFactions, setLoadingFactions] = useState(false);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loadingEditions, setLoadingEditions] = useState(false);
  const [onOrderData, setOnOrderData] = useState({
    onOrder: starship.onOrder || false,
    pricePaid: starship.pricePaid || '',
    orderDate: starship.orderDate ? new Date(starship.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });
  const [showOnOrderForm, setShowOnOrderForm] = useState(false);
  const [savingOrderStatus, setSavingOrderStatus] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  // Fetch factions and editions when entering edit mode
  useEffect(() => {
    if (isEditing) {
      fetchFactions();
      fetchEditions();
    }
  }, [isEditing]);

  const fetchFactions = async () => {
    setLoadingFactions(true);
    
    try {
      const response = await fetch('/api/factions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch factions');
      }
      
      const data = await response.json();
      setFactions(data.data || []);
    } catch (err) {
      console.error('Error fetching factions:', err);
    } finally {
      setLoadingFactions(false);
    }
  };

  const fetchEditions = async () => {
    setLoadingEditions(true);
    
    try {
      const response = await fetch('/api/editions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch editions');
      }
      
      const data = await response.json();
      setEditions(data.data || []);
    } catch (err) {
      console.error('Error fetching editions:', err);
    } finally {
      setLoadingEditions(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('image', files[0]);
    formData.append('starshipId', starship._id);

    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }

      setUploadSuccess(true);
      onRefresh(); // Refresh to get updated starship data with new image URL
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setUploading(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    
    // Check if file is a PDF
    if (file.type !== 'application/pdf') {
      setPdfUploadError('Only PDF files are allowed');
      return;
    }
    
    setUploadingPdf(true);
    setPdfUploadError(null);
    setPdfUploadSuccess(false);
    
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('starshipId', starship._id);
    
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
      
      // Update the local state with the new PDF URL
      setEditFormData(prev => ({
        ...prev,
        magazinePdfUrl: data.data.magazinePdfUrl
      }));
      
      setPdfUploadSuccess(true);
      
      // Refresh the starship data
      onRefresh(currentEdition);
    } catch (error) {
      setPdfUploadError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'releaseDate' && value ? new Date(value) : value
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/starships/${starship._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editFormData,
          currentEdition
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update starship');
      }

      const result = await response.json();
      
      setSaveSuccess(true);
      setIsEditing(false);
      
      // Pass the currentEdition back to the parent component
      onRefresh(currentEdition);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({
      issue: starship.issue,
      edition: starship.edition,
      shipName: starship.shipName,
      faction: starship.faction,
      releaseDate: starship.releaseDate,
      imageUrl: starship.imageUrl,
      magazinePdfUrl: starship.magazinePdfUrl,
      wishlist: starship.wishlist,
      wishlistPriority: starship.wishlistPriority,
      onOrder: starship.onOrder,
      pricePaid: starship.pricePaid,
      orderDate: starship.orderDate,
      retailPrice: starship.retailPrice,
      purchasePrice: starship.purchasePrice,
      marketValue: starship.marketValue
    });
    setSaveError(null);
    setSaveSuccess(false);
  };

  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  // Format date for input field
  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Fetch edition details to get default RRP
  const fetchEditionDetails = async (editionName: string) => {
    try {
      const response = await fetch(`/api/editions/by-name?name=${encodeURIComponent(editionName)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.retailPrice && !editFormData.retailPrice) {
          // Only set the retail price if it's not already set for this starship
          setEditFormData(prev => ({
            ...prev,
            retailPrice: data.data.retailPrice
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching edition details:", error);
    }
  };

  // When edition changes in the edit form, fetch its default RRP
  useEffect(() => {
    if (isEditing && editFormData.edition) {
      fetchEditionDetails(editFormData.edition);
    }
  }, [isEditing, editFormData.edition]);

  // Handle toggling on order status
  const handleToggleOnOrder = async () => {
    if (!showOnOrderForm) {
      setShowOnOrderForm(true);
      return;
    }
    
    setSavingOrderStatus(true);
    setSaveError(null);
    setOrderStatusMessage(null);
    
    try {
      const response = await fetch(`/api/starships/${starship._id}/toggle-order`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onOrder: !starship.onOrder,
          pricePaid: onOrderData.pricePaid === '' ? null : Number(onOrderData.pricePaid),
          orderDate: onOrderData.orderDate || new Date().toISOString().split('T')[0]
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      
      setOrderStatusMessage('Order status updated successfully');
      setTimeout(() => setOrderStatusMessage(null), 3000);
      onRefresh(currentEdition);
      setShowOnOrderForm(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSavingOrderStatus(false);
    }
  };

  // Handle marking an ordered item as received (adds to collection)
  const handleMarkAsReceived = async () => {
    setSavingOrderStatus(true);
    setSaveError(null);
    setOrderStatusMessage(null);
    
    try {
      const response = await fetch(`/api/starships/${starship._id}/mark-received`, {
        method: 'PUT'
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark item as received');
      }
      
      setOrderStatusMessage('Item marked as received and added to your collection');
      setTimeout(() => setOrderStatusMessage(null), 3000);
      onRefresh(currentEdition);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSavingOrderStatus(false);
    }
  };

  const renderPdfUploadSection = () => {
    return (
      <div className="mb-4">
        <h5>Magazine PDF</h5>
        {starship.magazinePdfUrl ? (
          <div className="d-flex align-items-center mb-3">
            <Button 
              variant="outline-primary" 
              className="me-3"
              onClick={() => setShowPdfViewer(true)}
            >
              <FontAwesomeIcon icon={faFilePdf} className="me-2" />
              View Magazine PDF
            </Button>
            {isEditing && (
              <div className="position-relative">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => document.getElementById('pdfUpload')?.click()}
                  disabled={uploadingPdf}
                >
                  {uploadingPdf ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faUpload} className="me-2" />
                      Replace PDF
                    </>
                  )}
                </Button>
                <Form.Control
                  type="file"
                  id="pdfUpload"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>
        ) : isEditing ? (
          <div className="position-relative">
            <Button
              variant="outline-primary"
              onClick={() => document.getElementById('pdfUpload')?.click()}
              disabled={uploadingPdf}
              className="mb-3"
            >
              {uploadingPdf ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUpload} className="me-2" />
                  Upload Magazine PDF
                </>
              )}
            </Button>
            <Form.Control
              type="file"
              id="pdfUpload"
              accept=".pdf"
              onChange={handlePdfUpload}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <p className="text-muted">No magazine PDF available</p>
        )}
        
        {pdfUploadError && (
          <Alert variant="danger" className="mt-2">
            {pdfUploadError}
          </Alert>
        )}
        
        {pdfUploadSuccess && (
          <Alert variant="success" className="mt-2">
            PDF uploaded successfully!
          </Alert>
        )}
      </div>
    );
  };

  return (
    <div className="starship-details">
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Issue {starship.issue}</h5>
          <div>
            <Button 
              variant={starship.owned ? "success" : "outline-secondary"}
              size="sm"
              onClick={() => onToggleOwned(starship._id)}
              className="me-2"
            >
              {starship.owned ? (
                <>
                  <FontAwesomeIcon icon={faCheck} /> Owned
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faTimes} /> Not Owned
                </>
              )}
            </Button>
            {!isEditing ? (
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <FontAwesomeIcon icon={faEdit} /> Edit
              </Button>
            ) : (
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={handleCancelEdit}
              >
                <FontAwesomeIcon icon={faUndo} /> Cancel
              </Button>
            )}
          </div>
        </Card.Header>
        
        <Card.Body>
          {saveError && <Alert variant="danger">{saveError}</Alert>}
          {saveSuccess && <Alert variant="success">Starship updated successfully!</Alert>}
          
          {!isEditing ? (
            <Row>
              <Col md={starship.imageUrl ? 7 : 12}>
                <dl className="row">
                  <dt className="col-sm-4">Ship Name:</dt>
                  <dd className="col-sm-8">{starship.shipName}</dd>
                  
                  <dt className="col-sm-4">Issue:</dt>
                  <dd className="col-sm-8">{starship.issue}</dd>
                  
                  <dt className="col-sm-4">Edition:</dt>
                  <dd className="col-sm-8">{starship.edition}</dd>
                  
                  <dt className="col-sm-4">Race/Faction:</dt>
                  <dd className="col-sm-8">{starship.faction}</dd>
                  
                  <dt className="col-sm-4">Release Date:</dt>
                  <dd className="col-sm-8">{formatDate(starship.releaseDate)}</dd>

                  {/* Pricing Information */}
                  <dt className="col-sm-4">Retail Price:</dt>
                  <dd className="col-sm-8">
                    {starship.retailPrice ? `$${starship.retailPrice.toFixed(2)}` : 'Not set'}
                  </dd>
                  
                  <dt className="col-sm-4">Purchase Price:</dt>
                  <dd className="col-sm-8">
                    {starship.purchasePrice ? `$${starship.purchasePrice.toFixed(2)}` : 'Not set'}
                  </dd>
                  
                  <dt className="col-sm-4">Market Value:</dt>
                  <dd className="col-sm-8">
                    {starship.marketValue ? `$${starship.marketValue.toFixed(2)}` : 'Not set'}
                  </dd>
                </dl>
              </Col>
              
              {starship.imageUrl && (
                <Col md={5} className="text-center">
                  <img 
                    src={starship.imageUrl} 
                    alt={`${starship.shipName}`} 
                    className="img-fluid rounded" 
                    style={{ maxHeight: '250px', maxWidth: '100%' }}
                  />
                </Col>
              )}
            </Row>
          ) : (
            <Form onSubmit={handleEditSubmit}>
              <Row>
                <Col md={starship.imageUrl ? 7 : 12}>
                  <Form.Group className="mb-3" controlId="formShipName">
                    <Form.Label>Ship Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="shipName"
                      value={editFormData.shipName}
                      onChange={handleEditChange}
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3" controlId="formIssue">
                    <Form.Label>Issue</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="issue"
                      value={editFormData.issue}
                      onChange={handleEditChange}
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3" controlId="formEdition">
                    <Form.Label>Edition</Form.Label>
                    <div className="d-flex">
                      <Form.Select
                        name="edition"
                        value={editFormData.edition}
                        onChange={handleEditChange}
                        required
                        disabled={loadingEditions}
                        className="me-2"
                      >
                        <option value="">Select an edition</option>
                        {editions.map(edition => (
                          <option key={edition._id} value={edition.name}>
                            {edition.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => window.open('/setup?tab=editions', '_blank')}
                        title="Manage editions"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </Button>
                    </div>
                    {loadingEditions && (
                      <div className="mt-2">
                        <Spinner animation="border" size="sm" /> Loading editions...
                      </div>
                    )}
                  </Form.Group>
                  
                  <Form.Group className="mb-3" controlId="formFaction">
                    <Form.Label>Race/Faction</Form.Label>
                    <div className="d-flex">
                      <Form.Select
                        name="faction"
                        value={editFormData.faction}
                        onChange={handleEditChange}
                        required
                        disabled={loadingFactions}
                        className="me-2"
                      >
                        <option value="">Select a faction</option>
                        {factions.map(faction => (
                          <option key={faction._id} value={faction.name}>
                            {faction.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => window.open('/setup', '_blank')}
                        title="Manage factions"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </Button>
                    </div>
                    {loadingFactions && (
                      <div className="mt-2">
                        <Spinner animation="border" size="sm" /> Loading factions...
                      </div>
                    )}
                  </Form.Group>
                  
                  <Form.Group className="mb-3" controlId="formReleaseDate">
                    <Form.Label>Release Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      name="releaseDate"
                      value={formatDateForInput(editFormData.releaseDate)}
                      onChange={handleEditChange}
                    />
                  </Form.Group>
                  
                  {/* Add pricing fields to the form */}
                  <hr className="my-4" />
                  <h5>Pricing Information</h5>
                  
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3" controlId="formRetailPrice">
                        <Form.Label>Retail Price (RRP)</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>$</InputGroup.Text>
                          <Form.Control 
                            type="number" 
                            name="retailPrice"
                            value={editFormData.retailPrice || ''}
                            onChange={handleEditChange}
                            step="0.01"
                            min="0"
                            placeholder="Retail price"
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    
                    <Col md={4}>
                      <Form.Group className="mb-3" controlId="formPurchasePrice">
                        <Form.Label>Purchase Price</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>$</InputGroup.Text>
                          <Form.Control 
                            type="number" 
                            name="purchasePrice"
                            value={editFormData.purchasePrice || ''}
                            onChange={handleEditChange}
                            step="0.01"
                            min="0"
                            placeholder="Your purchase price"
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    
                    <Col md={4}>
                      <Form.Group className="mb-3" controlId="formMarketValue">
                        <Form.Label>Market Value</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>$</InputGroup.Text>
                          <Form.Control 
                            type="number" 
                            name="marketValue"
                            value={editFormData.marketValue || ''}
                            onChange={handleEditChange}
                            step="0.01"
                            min="0"
                            placeholder="Current market value"
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={saving}
                    className="mt-2"
                  >
                    {saving ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} className="me-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </Col>
                
                {starship.imageUrl && (
                  <Col md={5} className="text-center">
                    <img 
                      src={starship.imageUrl} 
                      alt={`${starship.shipName}`} 
                      className="img-fluid rounded" 
                      style={{ maxHeight: '250px', maxWidth: '100%' }}
                    />
                  </Col>
                )}
              </Row>
            </Form>
          )}
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Header>
          <h6 className="mb-0">Upload Image</h6>
        </Card.Header>
        <Card.Body>
          {uploadError && <Alert variant="danger">{uploadError}</Alert>}
          {uploadSuccess && <Alert variant="success">Image uploaded successfully!</Alert>}
          
          <Form.Group controlId={`formFile-${starship._id}`}>
            <div className="d-flex">
              <Form.Control 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="me-2"
              />
              {uploading && (
                <div className="d-flex align-items-center">
                  <FontAwesomeIcon icon={faSpinner} spin />
                </div>
              )}
            </div>
          </Form.Group>
        </Card.Body>
      </Card>
      
      {renderPdfUploadSection()}
      
      <Row className="mb-3">
        <Col>
          <Card>
            <Card.Header>Actions</Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2">
                <Button 
                  variant={starship.owned ? "outline-danger" : "outline-success"} 
                  onClick={() => onToggleOwned(starship._id)}
                >
                  <FontAwesomeIcon icon={starship.owned ? faTimes : faCheck} className="me-2" />
                  {starship.owned ? "Remove from Collection" : "Add to Collection"}
                </Button>
                
                {onToggleWishlist && !starship.owned && !starship.onOrder && (
                  <Button 
                    variant={starship.wishlist ? "warning" : "outline-secondary"} 
                    onClick={() => onToggleWishlist(starship._id)}
                  >
                    <FontAwesomeIcon 
                      icon={starship.wishlist ? faStarSolid : faStarRegular} 
                      className="me-2" 
                    />
                    {starship.wishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                  </Button>
                )}
                
                {!starship.owned && (
                  <>
                    {starship.onOrder ? (
                      <Button 
                        variant="primary" 
                        onClick={handleMarkAsReceived}
                        disabled={savingOrderStatus}
                      >
                        {savingOrderStatus ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faBoxOpen} className="me-2" />
                            Mark as Received
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button 
                        variant="info" 
                        onClick={handleToggleOnOrder}
                        disabled={savingOrderStatus}
                      >
                        {savingOrderStatus ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                            {showOnOrderForm ? "Save Order Details" : "Mark as On Order"}
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {showOnOrderForm && !starship.onOrder && !starship.owned && (
        <div className="mt-3 p-3 border rounded bg-light">
          <h5>Order Details</h5>
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={3}>Price Paid</Form.Label>
            <Col sm={9}>
              <InputGroup>
                <InputGroup.Text>£</InputGroup.Text>
                <Form.Control 
                  type="number" 
                  step="0.01" 
                  value={onOrderData.pricePaid} 
                  onChange={(e) => setOnOrderData({...onOrderData, pricePaid: e.target.value})}
                  placeholder="Enter price paid"
                />
              </InputGroup>
            </Col>
          </Form.Group>
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={3}>Order Date</Form.Label>
            <Col sm={9}>
              <Form.Control 
                type="date" 
                value={onOrderData.orderDate} 
                onChange={(e) => setOnOrderData({...onOrderData, orderDate: e.target.value})}
              />
            </Col>
          </Form.Group>
        </div>
      )}
      
      {/* Add the PDF Viewer Modal */}
      {starship.magazinePdfUrl && (
        <PdfViewer
          pdfUrl={starship.magazinePdfUrl}
          show={showPdfViewer}
          onHide={() => setShowPdfViewer(false)}
          title={`${starship.shipName} - Magazine`}
        />
      )}
    </div>
  );
};

export default StarshipDetails; 