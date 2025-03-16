import React, { useState, useEffect } from 'react';
import DataTable from './DataTable';
import PdfViewer from './PdfViewer';
import { Starship, SortConfig, Filters } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';

interface StarshipListProps {
  starships: Starship[];
  onToggleOwned: (id: string) => Promise<void>;
  onSelectStarship: (starship: Starship) => void;
  onToggleWishlist?: (id: string) => Promise<void>;
  onCycleStatus?: (id: string) => Promise<void>;
  onEditionChange?: (edition: string) => void;
  currentEdition?: string;
}

const StarshipList: React.FC<StarshipListProps> = ({ 
  starships, 
  onToggleOwned,
  onSelectStarship,
  onToggleWishlist,
  onCycleStatus,
  onEditionChange,
  currentEdition = 'Regular'
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'issue', direction: 'asc' });
  const [filters, setFilters] = useState<Filters>({
    search: '',
    faction: [],
    edition: [currentEdition],
    collectionType: [],
    franchise: [],
    owned: 'all'
  });
  const [filteredStarships, setFilteredStarships] = useState<Starship[]>(starships || []);
  const [availableFactions, setAvailableFactions] = useState<string[]>([]);
  const [availableEditions, setAvailableEditions] = useState<string[]>([]);
  const [availableCollectionTypes, setAvailableCollectionTypes] = useState<string[]>([]);
  const [availableFranchises, setAvailableFranchises] = useState<string[]>([]);
  const [activeEdition, setActiveEdition] = useState<string>(currentEdition);
  const { formatCurrency } = useCurrency();
  
  // Add state for image modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [selectedShipName, setSelectedShipName] = useState<string>('');

  // Add state for PDF viewer
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState('');
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [factionMenuOpen, setFactionMenuOpen] = useState(false);
  const [ownedMenuOpen, setOwnedMenuOpen] = useState(false);
  const [collectionTypeMenuOpen, setCollectionTypeMenuOpen] = useState(false);
  const [franchiseMenuOpen, setFranchiseMenuOpen] = useState(false);

  // Extract unique values for filters
  useEffect(() => {
    if (!starships || starships.length === 0) return;
    
    // Extract unique factions
    const factions = Array.from(new Set(starships.map(ship => ship.faction))).sort();
    setAvailableFactions(factions);
    
    // Extract unique editions from starships
    const editions = Array.from(new Set(
      starships.map(ship => ship.editionInternalName || ship.edition)
    )).filter(Boolean).sort();
    
    setAvailableEditions(editions);
    
    // Extract unique collection types
    const collectionTypes = Array.from(new Set(starships.map(ship => ship.collectionType))).sort();
    setAvailableCollectionTypes(collectionTypes);
    
    // Extract unique franchises
    const franchises = Array.from(new Set(starships.map(ship => ship.franchise))).sort();
    setAvailableFranchises(franchises);
    
    // Apply initial filtering based on currentEdition
    if (currentEdition) {
      const initialFiltered = starships.filter(ship => {
        // If the ship has an editionInternalName, use that for filtering
        if (ship.editionInternalName) {
          return ship.editionInternalName === currentEdition;
        }
        // Otherwise fall back to the edition name
        return ship.edition === currentEdition;
      });
      
      // Sort by issue number if possible
      initialFiltered.sort((a, b) => {
        // Extract numeric part from issue
        const aMatch = a.issue.match(/(\d+)$/);
        const bMatch = b.issue.match(/(\d+)$/);
        
        const aNum = aMatch ? parseInt(aMatch[1], 10) : NaN;
        const bNum = bMatch ? parseInt(bMatch[1], 10) : NaN;
        
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
  }, [starships, currentEdition]);

  // Select the default edition tab when editions become available
  useEffect(() => {
    if (availableEditions.length > 0 && currentEdition) {
      console.log('Editions available, selecting tab for:', currentEdition);
      
      // Make sure the current edition is in the available editions
      if (availableEditions.includes(currentEdition)) {
        setActiveEdition(currentEdition);
        setFilters(prev => ({ ...prev, edition: [currentEdition] }));
        
        // Use a short timeout to ensure the DOM has updated
        setTimeout(() => {
          const editionTab = document.querySelector(`button[data-edition="${currentEdition}"]`);
          if (editionTab) {
            console.log('Found edition tab, simulating click');
            (editionTab as HTMLButtonElement).click();
          } else {
            console.log('Edition tab not found in DOM');
          }
        }, 100);
      } else {
        console.log(`Current edition ${currentEdition} not in available editions:`, availableEditions);
        
        // If the current edition is not available, use the first available edition
        if (availableEditions.length > 0) {
          const firstEdition = availableEditions[0];
          console.log(`Falling back to first available edition: ${firstEdition}`);
          setActiveEdition(firstEdition);
          setFilters(prev => ({ ...prev, edition: [firstEdition] }));
          
          // Notify parent of the change
          if (onEditionChange) {
            onEditionChange(firstEdition);
          }
          
          // Use a short timeout to ensure the DOM has updated
          setTimeout(() => {
            const editionTab = document.querySelector(`button[data-edition="${firstEdition}"]`);
            if (editionTab) {
              console.log('Found edition tab, simulating click');
              (editionTab as HTMLButtonElement).click();
            }
          }, 100);
        }
      }
    }
  }, [availableEditions, currentEdition, onEditionChange]);

  // Initialize with the current edition
  useEffect(() => {
    console.log('StarshipList initializing with currentEdition:', currentEdition);
    setActiveEdition(currentEdition);
    setFilters(prev => ({ ...prev, edition: [currentEdition] }));
  }, []);

  // Update activeEdition when currentEdition prop changes
  useEffect(() => {
    console.log('currentEdition changed to:', currentEdition);
    setActiveEdition(currentEdition);
    setFilters(prev => ({ ...prev, edition: [currentEdition] }));
  }, [currentEdition]);

  // Apply filters and sorting
  useEffect(() => {
    if (!starships || starships.length === 0) {
      setFilteredStarships([]);
      return;
    }
    
    console.log('StarshipList received starships:', starships);
    
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
    
    // Apply edition filter - use editionInternalName if available, otherwise fall back to edition
    if (filters.edition.length > 0) {
      console.log('Applying edition filter:', filters.edition);
      
      // Always apply the edition filter
      result = result.filter(ship => {
        // If the ship has an editionInternalName, use that for filtering
        if (ship.editionInternalName) {
          return filters.edition.includes(ship.editionInternalName);
        }
        // Otherwise fall back to the edition name
        return filters.edition.includes(ship.edition);
      });
      
      console.log(`After edition filter: ${result.length} ships remaining`);
    }
    
    // Apply collection type filter
    if (filters.collectionType.length > 0) {
      console.log('Applying collection type filter:', filters.collectionType);
      result = result.filter(ship => {
        console.log(`Ship ${ship.shipName} collection type:`, ship.collectionType);
        return filters.collectionType.includes(ship.collectionType);
      });
    }
    
    // Apply franchise filter
    if (filters.franchise.length > 0) {
      console.log('Applying franchise filter:', filters.franchise);
      result = result.filter(ship => {
        console.log(`Ship ${ship.shipName} franchise:`, ship.franchise);
        return filters.franchise.includes(ship.franchise);
      });
    }
    
    // Apply owned filter
    if (filters.owned !== 'all') {
      if (filters.owned === 'owned') {
        result = result.filter(ship => ship.owned);
      } else if (filters.owned === 'not-owned') {
        result = result.filter(ship => !ship.owned);
      } else if (filters.owned === 'wishlist') {
        result = result.filter(ship => ship.wishlist);
      } else if (filters.owned === 'on-order') {
        result = result.filter(ship => ship.onOrder);
      }
    }
    
    console.log('Filtered starships:', result);
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Starship];
        const bValue = b[sortConfig.key as keyof Starship];
        
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          // Special handling for issue field to ensure numeric sorting
          if (sortConfig.key === 'issue') {
            // Extract numeric part from issue
            const aMatch = aValue.match(/(\d+)$/);
            const bMatch = bValue.match(/(\d+)$/);
            
            const aNum = aMatch ? parseInt(aMatch[1], 10) : NaN;
            const bNum = bMatch ? parseInt(bMatch[1], 10) : NaN;
            
            // If both have numeric parts, compare them numerically
            if (!isNaN(aNum) && !isNaN(bNum)) {
              // If they have the same prefix (or no prefix), sort by number
              const aPrefix = aValue.replace(/\d+$/, '');
              const bPrefix = bValue.replace(/\d+$/, '');
              
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
          
          // Default string comparison for other fields
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' 
            ? aValue - bValue 
            : bValue - aValue;
        }
        
        if (aValue instanceof Date && bValue instanceof Date) {
          return sortConfig.direction === 'asc' 
            ? aValue.getTime() - bValue.getTime() 
            : bValue.getTime() - aValue.getTime();
        }
        
        return 0;
      });
    }
    
    setFilteredStarships(result);
  }, [starships, filters, sortConfig]);

  const handleSort = (key: keyof Starship) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
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
    
    // Close the dropdown after selection
    setFactionMenuOpen(false);
  };

  const handleEditionSelect = (edition: string) => {
    setFilters(prev => ({ ...prev, edition: [edition] }));
    setActiveEdition(edition);
    
    // Call the parent's onEditionChange if provided
    if (onEditionChange) {
      onEditionChange(edition);
    }
  };

  const setOwnedFilter = (value: 'all' | 'owned' | 'not-owned' | 'wishlist' | 'on-order') => {
    setFilters(prev => ({ ...prev, owned: value }));
    
    // Close the dropdown after selection
    setOwnedMenuOpen(false);
  };

  const getSortIcon = (key: keyof Starship) => {
    if (sortConfig.key !== key) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
        </svg>
      );
    }
    
    if (sortConfig.direction === 'asc') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    );
  };

  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
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

  // Add these new functions for collection type and franchise filtering
  const toggleCollectionTypeFilter = (collectionType: string) => {
    const newCollectionTypes = filters.collectionType.includes(collectionType)
      ? filters.collectionType.filter(t => t !== collectionType)
      : [...filters.collectionType, collectionType];
    
    setFilters({ ...filters, collectionType: newCollectionTypes });
  };
  
  const toggleFranchiseFilter = (franchise: string) => {
    const newFranchises = filters.franchise.includes(franchise)
      ? filters.franchise.filter(f => f !== franchise)
      : [...filters.franchise, franchise];
    
    setFilters({ ...filters, franchise: newFranchises });
  };

  // Define columns for the DataTable
  const columns = [
    {
      key: 'issue',
      header: 'Issue',
      sortable: true,
    },
    {
      key: 'edition',
      header: 'Edition',
      sortable: true,
    },
    {
      key: 'imageUrl',
      header: 'Image',
      sortable: false,
      render: (starship: Starship) => (
        <div className="flex justify-center">
          {starship.imageUrl ? (
            <div className="w-16 h-16 flex items-center justify-center">
              <img 
                src={starship.imageUrl} 
                alt={starship.shipName}
                className="max-w-full max-h-full object-contain cursor-pointer transition-transform duration-200 hover:scale-110"
                onClick={() => handleImageClick(starship.imageUrl, starship.shipName)}
                title="Click to view larger image"
              />
            </div>
          ) : (
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'shipName',
      header: 'Ship Name',
      sortable: true,
      wrapText: true,
      className: 'max-w-[200px]',
      render: (starship: Starship) => (
        <span className="font-medium">{starship.shipName || 'Unnamed'}</span>
      ),
    },
    {
      key: 'faction',
      header: 'Faction',
      sortable: true,
    },
    {
      key: 'retailPrice',
      header: 'RRP',
      sortable: true,
      render: (starship: Starship) => formatCurrency(starship.retailPrice),
    },
    {
      key: 'purchasePrice',
      header: 'Purchase',
      sortable: true,
      render: (starship: Starship) => formatCurrency(starship.purchasePrice),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (starship: Starship) => (
        <div className="flex items-center space-x-2">
          {/* Owned/Not Owned Icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleOwned(starship._id);
            }}
            className={`rounded-full p-1 ${
              starship.owned 
                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                : 'bg-red-100 text-red-600 hover:bg-red-200'
            }`}
            title={starship.owned ? "Owned" : "Not Owned"}
          >
            {starship.owned ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Wishlist/On Order Icon - Only show if not owned */}
          {!starship.owned && (onCycleStatus || onToggleWishlist) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onCycleStatus) {
                  onCycleStatus(starship._id);
                } else if (onToggleWishlist) {
                  onToggleWishlist(starship._id);
                }
              }}
              className={`rounded-full p-1 ${
                starship.onOrder
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  : starship.wishlist
                    ? 'bg-yellow-100 text-yellow-500 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              title={
                starship.onOrder 
                  ? "On Order - Click to remove" 
                  : starship.wishlist 
                    ? "On Wishlist - Click to mark as on order" 
                    : "Add to Wishlist"
              }
            >
              {starship.onOrder ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (starship: Starship) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectStarship(starship);
            }}
            className="p-1 text-indigo-600 hover:text-indigo-900 rounded-full hover:bg-indigo-50"
            title="View Details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          {starship.imageUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleImageClick(starship.imageUrl, starship.shipName);
              }}
              className="p-1 text-blue-600 hover:text-blue-900 rounded-full hover:bg-blue-50"
              title="View Image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          {starship.magazinePdfUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePdfClick(starship.magazinePdfUrl, starship.shipName);
              }}
              className="p-1 text-red-600 hover:text-red-900 rounded-full hover:bg-red-50"
              title="View PDF"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      ),
    },
  ];

  // Edition Tabs rendering
  const renderEditionTabs = () => {
    if (availableEditions.length === 0) {
      return null;
    }
    
    return (
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {availableEditions.map(edition => {
            // Find a ship with this edition to get the display name
            const shipWithEdition = starships.find(ship => 
              (ship.editionInternalName && ship.editionInternalName === edition) || 
              (!ship.editionInternalName && ship.edition === edition)
            );
            
            // Use the display name from the ship, or fall back to the internal name
            const displayName = shipWithEdition ? shipWithEdition.edition : edition;
            
            return (
              <button
                key={edition}
                data-edition={edition}
                onClick={() => handleEditionSelect(edition)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeEdition === edition
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {displayName}
              </button>
            );
          })}
        </nav>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search ships..."
                value={filters.search}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* Faction Filter */}
            <div className="relative inline-block text-left">
              <div>
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  id="faction-menu-button"
                  aria-expanded="true"
                  aria-haspopup="true"
                  onClick={() => setFactionMenuOpen(!factionMenuOpen)}
                >
                  Faction
                  {filters.faction.length > 0 && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {filters.faction.length}
                    </span>
                  )}
                  <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {factionMenuOpen && (
                <div
                  className="origin-top-right absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="faction-menu-button"
                  tabIndex={-1}
                >
                  <div className="py-1" role="none">
                    <button
                      className={`${
                        filters.faction.length === 0 ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } block px-4 py-2 text-sm w-full text-left hover:bg-gray-50`}
                      role="menuitem"
                      tabIndex={-1}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, faction: [] }));
                        setFactionMenuOpen(false);
                      }}
                    >
                      All Factions
                    </button>
                    {availableFactions.map(faction => (
                      <button
                        key={faction}
                        className={`${
                          filters.faction.includes(faction) ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } block px-4 py-2 text-sm w-full text-left hover:bg-gray-50`}
                        role="menuitem"
                        tabIndex={-1}
                        onClick={() => toggleFactionFilter(faction)}
                      >
                        {faction}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Status Filter (formerly Owned Filter) */}
            <div className="relative inline-block text-left">
              <div>
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  id="status-menu-button"
                  aria-expanded="true"
                  aria-haspopup="true"
                  onClick={() => setOwnedMenuOpen(!ownedMenuOpen)}
                >
                  Status: {filters.owned === 'all' ? 'All' : 
                   filters.owned === 'owned' ? 'Owned' : 
                   filters.owned === 'not-owned' ? 'Not Owned' :
                   filters.owned === 'wishlist' ? 'Wishlist' :
                   filters.owned === 'on-order' ? 'On Order' : 'All'}
                  <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {ownedMenuOpen && (
                <div
                  className="origin-top-right absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="status-menu-button"
                  tabIndex={-1}
                >
                  <div className="py-1" role="none">
                    <button
                      className={`${
                        filters.owned === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } block px-4 py-2 text-sm w-full text-left hover:bg-gray-50`}
                      role="menuitem"
                      tabIndex={-1}
                      onClick={() => setOwnedFilter('all')}
                    >
                      All Ships
                    </button>
                    <button
                      className={`${
                        filters.owned === 'owned' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } block px-4 py-2 text-sm w-full text-left hover:bg-gray-50`}
                      role="menuitem"
                      tabIndex={-1}
                      onClick={() => setOwnedFilter('owned')}
                    >
                      <span className="flex items-center">
                        <svg className="mr-2 h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Owned Only
                      </span>
                    </button>
                    <button
                      className={`${
                        filters.owned === 'not-owned' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } block px-4 py-2 text-sm w-full text-left hover:bg-gray-50`}
                      role="menuitem"
                      tabIndex={-1}
                      onClick={() => setOwnedFilter('not-owned')}
                    >
                      <span className="flex items-center">
                        <svg className="mr-2 h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Not Owned Only
                      </span>
                    </button>
                    <button
                      className={`${
                        filters.owned === 'wishlist' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } block px-4 py-2 text-sm w-full text-left hover:bg-gray-50`}
                      role="menuitem"
                      tabIndex={-1}
                      onClick={() => setOwnedFilter('wishlist')}
                    >
                      <span className="flex items-center">
                        <svg className="mr-2 h-4 w-4 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Wishlist Only
                      </span>
                    </button>
                    <button
                      className={`${
                        filters.owned === 'on-order' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } block px-4 py-2 text-sm w-full text-left hover:bg-gray-50`}
                      role="menuitem"
                      tabIndex={-1}
                      onClick={() => setOwnedFilter('on-order')}
                    >
                      <span className="flex items-center">
                        <svg className="mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                        On Order Only
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex flex-col items-end">
            <div className="flex space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                <svg className="w-4 h-4 mr-1 text-indigo-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path>
                </svg>
                {filteredStarships.length} ships
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
                {filteredStarships.filter(s => s.owned).length} owned
              </span>
            </div>
            <div className="mt-2 w-full">
              <div className="text-sm flex justify-between mb-1">
                <span>Collection Progress</span>
                <span>{Math.round((filteredStarships.filter(s => s.owned).length / filteredStarships.length) * 100)}%</span>
              </div>
              <div className="w-64 bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-500 h-2.5 rounded-full" 
                  style={{ width: `${(filteredStarships.filter(s => s.owned).length / filteredStarships.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Edition Tabs */}
        {renderEditionTabs()}
        
        {/* Data Table */}
        <div className="w-full overflow-hidden mt-4">
          <DataTable
            data={filteredStarships}
            columns={columns}
            keyField="_id"
            onRowClick={onSelectStarship}
            sortConfig={{
              key: sortConfig.key as keyof Starship,
              direction: sortConfig.direction
            }}
            onSort={handleSort}
            emptyMessage="No starships found. Try adjusting your search or filters."
          />
          
          {filteredStarships.length === 0 && (
            <div className="text-center p-8 bg-gray-50 rounded-lg mt-4">
              <p className="text-gray-500">No starships match your current filters.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowImageModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      {selectedShipName}
                    </h3>
                    <div className="mt-2">
                      {selectedImage && (
                        <img 
                          src={selectedImage} 
                          alt={selectedShipName} 
                          className="max-w-full max-h-[70vh] mx-auto object-contain"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowImageModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* PDF Viewer Modal */}
      {showPdfViewer && selectedPdfUrl && (
        <PdfViewer
          pdfUrl={selectedPdfUrl}
          title={selectedPdfTitle}
          onClose={() => setShowPdfViewer(false)}
        />
      )}
    </div>
  );
};

export default StarshipList; 