import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faSearch, faFilter, faSort, faSortUp, faSortDown, faTrash, faMagnifyingGlass, faPlus, faFilePdf, faImage, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import PdfViewer from './PdfViewer';
import ModalContainer from './ModalContainer';
import { Starship, SortConfig, Filters } from '../types';

interface FancyStarshipViewProps {
  starships: Starship[];
  onToggleOwned: (id: string) => Promise<void>;
  onSelectStarship: (starship: Starship) => void;
  onEditionChange?: (edition: string) => void;
  currentEdition?: string;
}

const FancyStarshipView: React.FC<FancyStarshipViewProps> = ({
  starships,
  onToggleOwned,
  onSelectStarship,
  onEditionChange,
  currentEdition = 'Regular'
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'issue', direction: 'asc' });
  const [filters, setFilters] = useState<Filters>({
    search: '',
    faction: [],
    edition: [currentEdition],
    owned: 'all',
    collectionType: [],
    franchise: []
  });
  const [filteredStarships, setFilteredStarships] = useState<Starship[]>(starships || []);
  const [availableFactions, setAvailableFactions] = useState<string[]>([]);
  const [availableEditions, setAvailableEditions] = useState<string[]>([]);
  const [activeEdition, setActiveEdition] = useState<string>(currentEdition);
  
  // Add state for image modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [selectedShipName, setSelectedShipName] = useState<string>('');

  // Add state for PDF viewer modal
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | undefined>(undefined);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState<string>('');

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
    } else if (filters.owned === 'wishlist') {
      result = result.filter(ship => ship.wishlist);
    } else if (filters.owned === 'on-order') {
      result = result.filter(ship => ship.onOrder);
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (sortConfig.key === '') return 0;
        
        // Special handling for issue field - treat as numbers when possible
        if (sortConfig.key === 'issue') {
          const aIssue = a.issue || '';
          const bIssue = b.issue || '';
          
          // Try to convert to numbers if possible
          const aNum = parseInt(aIssue, 10);
          const bNum = parseInt(bIssue, 10);
          
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
          }
          
          // Fall back to string comparison
          return sortConfig.direction === 'asc' 
            ? aIssue.localeCompare(bIssue) 
            : bIssue.localeCompare(aIssue);
        }
        
        // Handle other fields
        const aValue = a[sortConfig.key as keyof Starship] || '';
        const bValue = b[sortConfig.key as keyof Starship] || '';
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
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
    
    // Set filter to current edition, or first available edition if current edition is not available
    if (availableEditions.length > 0) {
      let editionToUse = currentEdition;
      
      // If currentEdition is not in availableEditions, use the first available edition
      if (!availableEditions.includes(currentEdition)) {
        editionToUse = availableEditions[0];
        
        // Notify parent component of the edition change
        if (onEditionChange) {
          onEditionChange(editionToUse);
        }
      }
      
      setFilters(prev => ({ ...prev, edition: [editionToUse] }));
      setActiveEdition(editionToUse);
    }
  }, [availableEditions, currentEdition, onEditionChange]);

  // Update activeEdition when currentEdition prop changes
  useEffect(() => {
    setActiveEdition(currentEdition);
    setFilters(prev => ({ ...prev, edition: [currentEdition] }));
  }, [currentEdition]);

  const handleSort = (key: keyof Starship) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        return { 
          key, 
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc' 
        };
      }
      return { key, direction: 'asc' };
    });
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
    document.getElementById('faction-dropdown')?.classList.add('hidden');
  };

  const handleEditionSelect = (edition: string) => {
    setActiveEdition(edition);
    setFilters(prev => ({ ...prev, edition: [edition] }));
    
    // Call the parent component's edition change handler if provided
    if (onEditionChange) {
      onEditionChange(edition);
    }
  };

  const setOwnedFilter = (value: 'all' | 'owned' | 'not-owned' | 'wishlist' | 'on-order') => {
    setFilters(prev => ({ ...prev, owned: value }));
    
    // Close the dropdown after selection
    document.getElementById('owned-dropdown')?.classList.add('hidden');
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown';
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  const handleImageClick = (e: React.MouseEvent, imageUrl: string | undefined, shipName: string) => {
    // Stop event propagation to prevent triggering parent click handlers
    e.stopPropagation();
    
    if (imageUrl) {
      setSelectedImage(imageUrl);
      setSelectedShipName(shipName);
      setShowImageModal(true);
    }
  };

  const handlePdfClick = (e: React.MouseEvent, pdfUrl: string | undefined, shipName: string) => {
    // Stop event propagation to prevent triggering parent click handlers
    e.stopPropagation();
    
    if (pdfUrl) {
      setSelectedPdfUrl(pdfUrl);
      setSelectedPdfTitle(shipName);
      setShowPdfViewer(true);
    }
  };

  return (
    <div>
      <div className="mb-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap justify-between items-center mb-2">
            <div className="flex flex-wrap items-center space-x-2">
              <div className="relative flex items-center mb-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search ships..."
                  value={filters.search}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm w-48"
                />
              </div>
              
              <div className="relative inline-block text-left mb-2">
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  id="faction-menu-button"
                  aria-expanded="true"
                  aria-haspopup="true"
                  onClick={() => document.getElementById('faction-dropdown')?.classList.toggle('hidden')}
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
                <div
                  id="faction-dropdown"
                  className="hidden origin-top-right absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="faction-menu-button"
                  tabIndex={-1}
                >
                  <div className="py-1" role="none">
                    <button
                      onClick={() => {
                        setFilters(prev => ({ ...prev, faction: [] }));
                        document.getElementById('faction-dropdown')?.classList.add('hidden');
                      }}
                      className={`block px-4 py-2 text-sm w-full text-left ${
                        filters.faction.length === 0
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      role="menuitem"
                    >
                      All Factions
                    </button>
                    {availableFactions.map(faction => (
                      <button
                        key={faction}
                        onClick={() => toggleFactionFilter(faction)}
                        className={`block px-4 py-2 text-sm w-full text-left ${
                          filters.faction.includes(faction)
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        role="menuitem"
                      >
                        {faction}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="relative inline-block text-left mb-2">
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  id="owned-menu-button"
                  aria-expanded="true"
                  aria-haspopup="true"
                  onClick={() => document.getElementById('owned-dropdown')?.classList.toggle('hidden')}
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
                <div
                  id="owned-dropdown"
                  className="hidden origin-top-right absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="owned-menu-button"
                  tabIndex={-1}
                >
                  <div className="py-1" role="none">
                    <button
                      onClick={() => setOwnedFilter('all')}
                      className={`block px-4 py-2 text-sm w-full text-left ${
                        filters.owned === 'all'
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      role="menuitem"
                    >
                      All Ships
                    </button>
                    <button
                      onClick={() => setOwnedFilter('owned')}
                      className={`block px-4 py-2 text-sm w-full text-left ${
                        filters.owned === 'owned'
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      role="menuitem"
                    >
                      <span className="flex items-center">
                        <svg className="mr-2 h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Owned Only
                      </span>
                    </button>
                    <button
                      onClick={() => setOwnedFilter('not-owned')}
                      className={`block px-4 py-2 text-sm w-full text-left ${
                        filters.owned === 'not-owned'
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      role="menuitem"
                    >
                      <span className="flex items-center">
                        <svg className="mr-2 h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Not Owned Only
                      </span>
                    </button>
                    <button
                      onClick={() => setOwnedFilter('wishlist')}
                      className={`block px-4 py-2 text-sm w-full text-left ${
                        filters.owned === 'wishlist'
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      role="menuitem"
                    >
                      <span className="flex items-center">
                        <svg className="mr-2 h-4 w-4 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Wishlist Only
                      </span>
                    </button>
                    <button
                      onClick={() => setOwnedFilter('on-order')}
                      className={`block px-4 py-2 text-sm w-full text-left ${
                        filters.owned === 'on-order'
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      role="menuitem"
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
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex flex-col items-end">
              <div className="flex space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                  <FontAwesomeIcon icon={faLayerGroup} className="mr-1 text-indigo-600" />
                  {filteredStarships.length} ships
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <FontAwesomeIcon icon={faCheck} className="mr-1 text-green-600" />
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
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {availableEditions.map(edition => (
                <button
                  key={edition}
                  onClick={() => handleEditionSelect(edition)}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeEdition === edition
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {edition}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Grid View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
            {filteredStarships.map(starship => (
              <div key={starship._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="relative">
                  {starship.imageUrl ? (
                    <div 
                      className="h-48 flex items-center justify-center p-4 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent the event from bubbling up
                        handleImageClick(e, starship.imageUrl, starship.shipName);
                      }}
                    >
                      <img 
                        src={starship.imageUrl} 
                        alt={starship.shipName}
                        className="h-full object-contain"
                        title="Click to view larger image"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-500">No image available</span>
                    </div>
                  )}
                  <span 
                    className={`absolute top-2 right-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      starship.owned 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {starship.owned ? "Owned" : "Not Owned"}
                  </span>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Issue {starship.issue}</span>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {starship.edition}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">
                    {starship.shipName}
                  </h3>
                  <p className="text-gray-600 text-sm mb-1">
                    {starship.faction}
                  </p>
                  <p className="text-gray-500 text-xs">
                    Released: {formatDate(starship.releaseDate)}
                  </p>
                </div>
                
                <div className="px-4 py-3 bg-gray-50 flex justify-between">
                  <button 
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={(e) => handlePdfClick(e, starship.magazinePdfUrl, starship.shipName)}
                    title="View Magazine PDF"
                  >
                    <FontAwesomeIcon icon={faFilePdf} />
                  </button>
                  
                  <div className="flex space-x-2">
                    {starship.magazinePdfUrl && (
                      <button 
                        className={`inline-flex items-center px-2.5 py-1.5 border text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          starship.owned 
                            ? 'border-red-300 text-red-700 bg-white hover:bg-red-50 focus:ring-red-500' 
                            : 'border-green-300 text-green-700 bg-white hover:bg-green-50 focus:ring-green-500'
                        }`}
                        onClick={(e) => handlePdfClick(e, starship.magazinePdfUrl, starship.shipName)}
                        title={starship.owned ? "Remove from Collection" : "Add to Collection"}
                      >
                        <FontAwesomeIcon icon={starship.owned ? faTrash : faPlus} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredStarships.length === 0 && (
            <div className="text-center p-8 bg-gray-50 rounded-lg mt-4">
              <p className="text-gray-500">No starships match your current filters.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Image Modal */}
      <ModalContainer 
        isOpen={showImageModal} 
        onClose={() => setShowImageModal(false)}
        maxWidth="xl"
      >
        <div className="p-6">
          <div className="relative">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg p-6 mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/50 shadow-md mr-4">
                  <FontAwesomeIcon icon={faImage} className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-bold text-white">{selectedShipName}</h3>
              </div>
            </div>
            
            <div className="flex justify-center mb-4">
              {selectedImage ? (
                <img 
                  src={selectedImage} 
                  alt={selectedShipName} 
                  className="max-h-[60vh] object-contain rounded-md shadow-lg"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-md flex items-center justify-center">
                  <p className="text-gray-500">No image available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ModalContainer>
      
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

export default FancyStarshipView; 