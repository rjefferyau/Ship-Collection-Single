import React, { useState, useEffect } from 'react';
import { Form, InputGroup, Button, Dropdown, DropdownButton, Badge, Nav, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortUp, faSortDown, faCheck, faTimes, faSearch, faFilter, faTrash, faMagnifyingGlass, faPlus, faStar as faStarSolid, faShoppingCart, faFilePdf, faImages } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import DataTable from './DataTable';
import PdfViewer from './PdfViewer';

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

interface SortConfig {
  key: keyof Starship | '';
  direction: 'asc' | 'desc';
}

interface Filters {
  search: string;
  faction: string[];
  edition: string[];
  owned: 'all' | 'owned' | 'not-owned';
}

interface StarshipListProps {
  starships: Starship[];
  onToggleOwned: (id: string) => Promise<void>;
  onSelectStarship: (starship: Starship) => void;
  onToggleWishlist?: (id: string) => Promise<void>;
  onEditionChange?: (edition: string) => void;
  currentEdition?: string;
}

const StarshipList: React.FC<StarshipListProps> = ({ 
  starships, 
  onToggleOwned,
  onSelectStarship,
  onToggleWishlist,
  onEditionChange,
  currentEdition = 'Regular'
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'issue', direction: 'asc' });
  const [filters, setFilters] = useState<Filters>({
    search: '',
    faction: [],
    edition: [currentEdition],
    owned: 'all'
  });
  const [filteredStarships, setFilteredStarships] = useState<Starship[]>(starships || []);
  const [availableFactions, setAvailableFactions] = useState<string[]>([]);
  const [availableEditions, setAvailableEditions] = useState<string[]>([]);
  const [activeEdition, setActiveEdition] = useState<string>(currentEdition);
  const [currencySettings, setCurrencySettings] = useState({
    currency: 'GBP',
    symbol: '£',
    locale: 'en-GB'
  });
  
  // Add state for image modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [selectedShipName, setSelectedShipName] = useState<string>('');

  // Add state for PDF viewer
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | undefined>(undefined);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState<string>('');

  // Load currency settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('currencySettings');
      if (savedSettings) {
        setCurrencySettings(JSON.parse(savedSettings));
      }
    }
  }, []);

  // Extract unique factions and editions
  useEffect(() => {
    if (!starships || starships.length === 0) {
      setAvailableFactions([]);
      setAvailableEditions([]);
      return;
    }
    
    const factions = Array.from(new Set(starships.map(ship => ship.faction))).filter(Boolean).sort();
    const editions = Array.from(new Set(starships.map(ship => ship.edition))).filter(Boolean).sort();
    
    setAvailableFactions(factions);
    setAvailableEditions(editions);
  }, [starships]);

  // Apply filters and sorting
  useEffect(() => {
    if (!starships || starships.length === 0) {
      setFilteredStarships([]);
      return;
    }
    
    let result = [...starships];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(ship => 
        (ship.shipName ? ship.shipName.toLowerCase().includes(searchLower) : false) || 
        (ship.issue ? ship.issue.toLowerCase().includes(searchLower) : false)
      );
    }
    
    // Apply faction filter
    if (filters.faction.length > 0) {
      result = result.filter(ship => filters.faction.includes(ship.faction));
    }
    
    // Apply edition filter
    if (filters.edition.length > 0) {
      result = result.filter(ship => filters.edition.includes(ship.edition));
    }
    
    // Apply owned filter
    if (filters.owned === 'owned') {
      result = result.filter(ship => ship.owned);
    } else if (filters.owned === 'not-owned') {
      result = result.filter(ship => !ship.owned);
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (sortConfig.key === '') return 0;
        
        // Special handling for issue field - treat as numbers when possible
        if (sortConfig.key === 'issue') {
          // Extract numeric part from issue strings (e.g., "XL1" -> "1", "XL10" -> "10")
          const aMatch = a.issue.match(/(\d+)$/);
          const bMatch = b.issue.match(/(\d+)$/);
          
          const aNum = aMatch ? parseInt(aMatch[0], 10) : NaN;
          const bNum = bMatch ? parseInt(bMatch[0], 10) : NaN;
          
          // If both have numeric parts, compare them numerically
          if (!isNaN(aNum) && !isNaN(bNum)) {
            // If they have the same prefix (or no prefix), sort by number
            const aPrefix = a.issue.replace(/\d+$/, '');
            const bPrefix = b.issue.replace(/\d+$/, '');
            
            if (aPrefix === bPrefix) {
              return sortConfig.direction === 'asc' 
                ? aNum - bNum 
                : bNum - aNum;
            }
            
            // If prefixes are different, sort by prefix first
            return sortConfig.direction === 'asc'
              ? aPrefix.localeCompare(bPrefix)
              : bPrefix.localeCompare(aPrefix);
          }
          
          // If only one has a numeric part, prioritize numbers before strings
          if (!isNaN(aNum) && isNaN(bNum)) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (isNaN(aNum) && !isNaN(bNum)) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
        }
        
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        // Handle undefined or null values
        if (aValue === undefined || aValue === null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue === undefined || bValue === null) return sortConfig.direction === 'asc' ? 1 : -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredStarships(result);
  }, [starships, filters, sortConfig]);

  // Initialize with default sorting and filtering
  useEffect(() => {
    // Set default sorting to issue ascending
    setSortConfig({ key: 'issue', direction: 'asc' });
    
    // Set filter to current edition
    if (availableEditions.includes(currentEdition)) {
      setFilters(prev => ({ ...prev, edition: [currentEdition] }));
      setActiveEdition(currentEdition);
    }

    // Apply initial filtering
    if (starships && starships.length > 0) {
      let initialFiltered = [...starships];
      
      // Filter by current edition
      if (availableEditions.includes(currentEdition)) {
        initialFiltered = initialFiltered.filter(ship => ship.edition === currentEdition);
      }
      
      // Sort by issue number
      initialFiltered.sort((a, b) => {
        // Extract numeric part from issue strings (e.g., "XL1" -> "1", "XL10" -> "10")
        const aMatch = a.issue.match(/(\d+)$/);
        const bMatch = b.issue.match(/(\d+)$/);
        
        const aNum = aMatch ? parseInt(aMatch[0], 10) : NaN;
        const bNum = bMatch ? parseInt(bMatch[0], 10) : NaN;
        
        // If both have numeric parts, compare them numerically
        if (!isNaN(aNum) && !isNaN(bNum)) {
          // If they have the same prefix (or no prefix), sort by number
          const aPrefix = a.issue.replace(/\d+$/, '');
          const bPrefix = b.issue.replace(/\d+$/, '');
          
          if (aPrefix === bPrefix) {
            return aNum - bNum;
          }
          
          // If prefixes are different, sort by prefix first
          return aPrefix.localeCompare(bPrefix);
        }
        
        // If only one has a numeric part, prioritize numbers before strings
        if (!isNaN(aNum) && isNaN(bNum)) {
          return -1;
        }
        if (isNaN(aNum) && !isNaN(bNum)) {
          return 1;
        }
        
        // Default string comparison
        return a.issue.localeCompare(b.issue);
      });
      
      setFilteredStarships(initialFiltered);
    }
  }, [availableEditions, starships, currentEdition]);

  // Update activeEdition when currentEdition prop changes
  useEffect(() => {
    setActiveEdition(currentEdition);
    setFilters(prev => ({ ...prev, edition: [currentEdition] }));
  }, [currentEdition]);

  const handleSort = (key: keyof Starship) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    
    setSortConfig({ key, direction });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const toggleFactionFilter = (faction: string) => {
    setFilters(prev => {
      const newFactions = prev.faction.includes(faction)
        ? prev.faction.filter(f => f !== faction)
        : [...prev.faction, faction];
      
      return { ...prev, faction: newFactions };
    });
  };

  const handleEditionSelect = (edition: string) => {
    setActiveEdition(edition);
    setFilters(prev => ({
      ...prev,
      edition: [edition]
    }));
    
    // Notify parent component of edition change if callback exists
    if (onEditionChange) {
      onEditionChange(edition);
    }
  };

  const setOwnedFilter = (value: 'all' | 'owned' | 'not-owned') => {
    setFilters(prev => ({ ...prev, owned: value }));
  };

  const getSortIcon = (key: keyof Starship) => {
    if (sortConfig.key !== key) {
      return <FontAwesomeIcon icon={faSort} />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <FontAwesomeIcon icon={faSortUp} /> 
      : <FontAwesomeIcon icon={faSortDown} />;
  };

  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    
    return new Intl.NumberFormat(currencySettings.locale, {
      style: 'currency',
      currency: currencySettings.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Add handler for image click
  const handleImageClick = (imageUrl: string | undefined, shipName: string) => {
    if (imageUrl) {
      setSelectedImage(imageUrl);
      setSelectedShipName(shipName);
      setShowImageModal(true);
    }
  };

  // Add a handler for PDF click
  const handlePdfClick = (pdfUrl: string | undefined, shipName: string) => {
    if (pdfUrl) {
      setSelectedPdfUrl(pdfUrl);
      setSelectedPdfTitle(`${shipName} - Magazine`);
      setShowPdfViewer(true);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
          <div className="d-flex flex-wrap align-items-center">
            <InputGroup className="me-2 mb-2 search-input" style={{ width: 'auto' }}>
              <InputGroup.Text>
                <FontAwesomeIcon icon={faSearch} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search ships..."
                value={filters.search}
                onChange={handleSearchChange}
                style={{ width: '200px' }}
                aria-label="Search ships"
              />
            </InputGroup>
            
            <DropdownButton 
              id="dropdown-faction-filter" 
              title={
                <span>
                  <FontAwesomeIcon icon={faFilter} /> Faction
                  {filters.faction.length > 0 && (
                    <Badge bg="primary" className="ms-1">{filters.faction.length}</Badge>
                  )}
                </span>
              }
              variant="outline-secondary"
              className="me-2 mb-2"
            >
              {availableFactions.map(faction => (
                <Dropdown.Item 
                  key={faction} 
                  onClick={() => toggleFactionFilter(faction)}
                  active={filters.faction.includes(faction)}
                >
                  {faction}
                </Dropdown.Item>
              ))}
              {filters.faction.length > 0 && (
                <Dropdown.Item 
                  onClick={() => setFilters(prev => ({ ...prev, faction: [] }))}
                  className="text-danger"
                >
                  <FontAwesomeIcon icon={faTrash} className="me-1" /> Clear Faction Filters
                </Dropdown.Item>
              )}
            </DropdownButton>
            
            <Dropdown className="me-2 mb-2">
              <Dropdown.Toggle variant="outline-secondary" id="dropdown-owned-filter">
                {filters.owned === 'all' ? 'All Ships' : 
                 filters.owned === 'owned' ? 'Owned Only' : 'Not Owned Only'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item 
                  onClick={() => setOwnedFilter('all')}
                  active={filters.owned === 'all'}
                >
                  All Ships
                </Dropdown.Item>
                <Dropdown.Item 
                  onClick={() => setOwnedFilter('owned')}
                  active={filters.owned === 'owned'}
                >
                  <FontAwesomeIcon icon={faCheck} className="text-success me-2" /> Owned Only
                </Dropdown.Item>
                <Dropdown.Item 
                  onClick={() => setOwnedFilter('not-owned')}
                  active={filters.owned === 'not-owned'}
                >
                  <FontAwesomeIcon icon={faTimes} className="text-secondary me-2" /> Not Owned Only
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
          
          <div className="mb-2 d-flex">
            <Badge bg="primary" className="me-2 badge-pill">
              <span className="badge-text">{filteredStarships.length} ships</span>
            </Badge>
            <Badge bg="success" className="badge-pill">
              <span className="badge-text">{filteredStarships.filter(s => s.owned).length} owned</span>
            </Badge>
          </div>
        </div>
        
        {/* Edition Tabs */}
        <div className="edition-tabs-container">
          <Nav variant="tabs" className="edition-tabs">
            {availableEditions.map(edition => (
              <Nav.Item key={edition}>
                <Nav.Link 
                  active={activeEdition === edition}
                  onClick={() => handleEditionSelect(edition)}
                  className="edition-tab"
                >
                  {edition}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </div>
      </div>
      
      <div className="table-responsive">
        <DataTable 
          id="starships-table"
          striped
          hover
          responsive
          options={{
            ordering: false, // We'll handle sorting ourselves
            searching: false, // We have our own search input
            paging: true,
            info: true,
            lengthChange: true,
            responsive: true
          }}
          className="starship-table"
        >
          <thead>
            <tr>
              <th onClick={() => handleSort('issue')} style={{ cursor: 'pointer' }} className="sortable-header">
                Issue {getSortIcon('issue')}
              </th>
              <th onClick={() => handleSort('edition')} style={{ cursor: 'pointer' }} className="sortable-header">
                Edition {getSortIcon('edition')}
              </th>
              <th style={{ width: '80px' }}>Image</th>
              <th onClick={() => handleSort('shipName')} style={{ cursor: 'pointer' }} className="sortable-header">
                Ship Name {getSortIcon('shipName')}
              </th>
              <th onClick={() => handleSort('faction')} style={{ cursor: 'pointer' }} className="sortable-header">
                Race/Faction {getSortIcon('faction')}
              </th>
              <th onClick={() => handleSort('retailPrice')} style={{ cursor: 'pointer' }} className="sortable-header">
                RRP {getSortIcon('retailPrice')}
              </th>
              <th onClick={() => handleSort('purchasePrice')} style={{ cursor: 'pointer' }} className="sortable-header">
                Purchase {getSortIcon('purchasePrice')}
              </th>
              <th onClick={() => handleSort('owned')} style={{ cursor: 'pointer' }} className="sortable-header">
                Owned {getSortIcon('owned')}
              </th>
              <th onClick={() => handleSort('wishlist')} style={{ cursor: 'pointer' }} className="sortable-header">
                Wishlist {getSortIcon('wishlist')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStarships.length > 0 ? (
              filteredStarships.map(starship => (
                <tr key={starship._id} className={starship.owned ? 'owned-row' : ''}>
                  <td>{starship.issue || 'N/A'}</td>
                  <td>{starship.edition || 'N/A'}</td>
                  <td>
                    {starship.imageUrl ? (
                      <div className="image-container">
                        <img 
                          src={starship.imageUrl} 
                          alt={starship.shipName}
                          className="ship-thumbnail"
                          onClick={() => handleImageClick(starship.imageUrl, starship.shipName)}
                          title="Click to view larger image"
                        />
                      </div>
                    ) : (
                      <div className="no-image-container">
                        <FontAwesomeIcon icon={faImages} className="text-muted" />
                      </div>
                    )}
                  </td>
                  <td className="ship-name">{starship.shipName || 'Unnamed'}</td>
                  <td>{starship.faction || 'N/A'}</td>
                  <td>{formatCurrency(starship.retailPrice)}</td>
                  <td>{formatCurrency(starship.purchasePrice)}</td>
                  <td>
                    <div className="ownership-indicator">
                      {starship.owned ? (
                        <span className="owned-badge">
                          <FontAwesomeIcon icon={faCheck} className="text-success" />
                        </span>
                      ) : (
                        <span className="not-owned-badge">
                          <FontAwesomeIcon icon={faTimes} className="text-secondary" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {starship.owned ? (
                      <span className="text-muted">-</span>
                    ) : starship.onOrder ? (
                      <Badge bg="primary" className="on-order-badge">
                        <FontAwesomeIcon icon={faShoppingCart} className="me-1" /> On Order
                      </Badge>
                    ) : onToggleWishlist ? (
                      <span 
                        className="wishlist-toggle"
                        onClick={() => onToggleWishlist(starship._id)}
                        title={starship.wishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        <FontAwesomeIcon 
                          icon={starship.wishlist ? faStarSolid : faStarRegular} 
                          className={starship.wishlist ? "text-warning" : "text-secondary"}
                        />
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <div className="d-flex action-buttons">
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-1 action-button"
                        onClick={() => onSelectStarship(starship)}
                        title="View Details"
                      >
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                      </Button>
                      
                      <Button 
                        variant="outline-success" 
                        size="sm" 
                        className="me-1 action-button"
                        onClick={() => onToggleOwned(starship._id)}
                        title={starship.owned ? "Mark as Not Owned" : "Mark as Owned"}
                      >
                        <FontAwesomeIcon icon={starship.owned ? faTimes : faCheck} />
                      </Button>
                      
                      {starship.magazinePdfUrl && (
                        <Button 
                          variant="outline-info" 
                          size="sm"
                          className="action-button"
                          onClick={() => handlePdfClick(starship.magazinePdfUrl, starship.shipName)}
                          title="View Magazine PDF"
                        >
                          <FontAwesomeIcon icon={faFilePdf} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="text-center py-4">
                  <div className="empty-state">
                    <FontAwesomeIcon icon={faSearch} size="2x" className="mb-3 text-muted" />
                    <h5>No starships found</h5>
                    <p className="text-muted">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </DataTable>
      </div>
      
      {/* Image Modal */}
      <Modal 
        show={showImageModal} 
        onHide={() => setShowImageModal(false)}
        centered
        size="lg"
        className="image-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedShipName}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-0">
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt={selectedShipName} 
              className="img-fluid modal-image"
            />
          )}
        </Modal.Body>
      </Modal>
      
      {/* PDF Viewer Modal */}
      <PdfViewer
        pdfUrl={selectedPdfUrl || ''}
        show={showPdfViewer}
        onHide={() => setShowPdfViewer(false)}
        title={selectedPdfTitle}
      />
      
      <style jsx>{`
        .ship-thumbnail {
          width: 60px;
          height: 60px;
          object-fit: contain;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .ship-thumbnail:hover {
          transform: scale(1.1);
        }
        
        .image-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 60px;
          height: 60px;
        }
        
        .no-image-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 60px;
          height: 60px;
          background-color: #f8f9fa;
          border-radius: 4px;
        }
        
        .owned-row {
          background-color: rgba(46, 204, 113, 0.05) !important;
        }
        
        .ship-name {
          font-weight: 500;
        }
        
        .wishlist-toggle {
          cursor: pointer;
          font-size: 1.2rem;
          transition: transform 0.2s ease;
        }
        
        .wishlist-toggle:hover {
          transform: scale(1.2);
        }
        
        .action-button {
          border-radius: 50%;
          width: 32px;
          height: 32px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .action-button:hover {
          transform: translateY(-2px);
        }
        
        .ownership-indicator {
          display: flex;
          justify-content: center;
        }
        
        .owned-badge, .not-owned-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        
        .owned-badge {
          background-color: rgba(46, 204, 113, 0.1);
        }
        
        .not-owned-badge {
          background-color: rgba(189, 195, 199, 0.1);
        }
        
        .sortable-header {
          position: relative;
          white-space: nowrap;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
        }
        
        .badge-pill {
          border-radius: 50rem;
          padding: 0.5rem 0.75rem;
        }
        
        .badge-text {
          font-weight: 500;
        }
        
        .modal-image {
          max-height: 80vh;
        }
      `}</style>
    </div>
  );
};

export default StarshipList; 