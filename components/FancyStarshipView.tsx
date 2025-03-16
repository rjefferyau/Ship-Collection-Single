import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faSearch, faFilter, faSort, faSortUp, faSortDown, faTrash, faMagnifyingGlass, faPlus, faFilePdf, faImage } from '@fortawesome/free-solid-svg-icons';
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
    owned: 'all'
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
    
    // Set filter to current edition
    if (availableEditions.includes(currentEdition)) {
      setFilters(prev => ({ ...prev, edition: [currentEdition] }));
      setActiveEdition(currentEdition);
    }
  }, [availableEditions, currentEdition]);

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
  };

  const handleEditionSelect = (edition: string) => {
    setActiveEdition(edition);
    setFilters(prev => ({ ...prev, edition: [edition] }));
    
    // Call the parent component's edition change handler if provided
    if (onEditionChange) {
      onEditionChange(edition);
    }
  };

  const setOwnedFilter = (value: 'all' | 'owned' | 'not-owned') => {
    setFilters(prev => ({ ...prev, owned: value }));
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown';
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  const handleImageClick = (imageUrl: string | undefined, shipName: string) => {
    if (imageUrl) {
      setSelectedImage(imageUrl);
      setSelectedShipName(shipName);
      setShowImageModal(true);
    }
  };

  const handlePdfClick = (pdfUrl: string | undefined, shipName: string) => {
    if (pdfUrl) {
      setSelectedPdfUrl(pdfUrl);
      setSelectedPdfTitle(shipName);
      setShowPdfViewer(true);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-wrap justify-between items-center mb-4">
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
                <FontAwesomeIcon icon={faFilter} className="mr-2" /> Faction
                {filters.faction.length > 0 && (
                  <span className="ml-1 bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {filters.faction.length}
                  </span>
                )}
              </button>
              <div
                id="faction-dropdown"
                className="hidden origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="faction-menu-button"
                tabIndex={-1}
              >
                <div className="py-1" role="none">
                  {availableFactions.map(faction => (
                    <button
                      key={faction}
                      onClick={() => toggleFactionFilter(faction)}
                      className={`block px-4 py-2 text-sm w-full text-left ${
                        filters.faction.includes(faction)
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      role="menuitem"
                    >
                      {faction}
                    </button>
                  ))}
                  {filters.faction.length > 0 && (
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, faction: [] }))}
                      className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                      role="menuitem"
                    >
                      Clear Faction Filters
                    </button>
                  )}
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
                {filters.owned === 'all' ? 'All Ships' : 
                 filters.owned === 'owned' ? 'Owned Only' : 'Not Owned Only'}
              </button>
              <div
                id="owned-dropdown"
                className="hidden origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
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
                        ? 'bg-indigo-100 text-indigo-900'
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
                        ? 'bg-indigo-100 text-indigo-900'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    role="menuitem"
                  >
                    Owned Only
                  </button>
                  <button
                    onClick={() => setOwnedFilter('not-owned')}
                    className={`block px-4 py-2 text-sm w-full text-left ${
                      filters.owned === 'not-owned'
                        ? 'bg-indigo-100 text-indigo-900'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    role="menuitem"
                  >
                    Not Owned Only
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-2">
            <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
              {filteredStarships.length} ships
            </span>
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {filteredStarships.filter(s => s.owned).length} owned
            </span>
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
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredStarships.map(starship => (
          <div key={starship._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="relative">
              {starship.imageUrl ? (
                <div 
                  className="h-48 flex items-center justify-center p-4 cursor-pointer"
                  onClick={() => handleImageClick(starship.imageUrl, starship.shipName)}
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
                onClick={() => onSelectStarship(starship)}
                title="View Details"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </button>
              
              <div className="flex space-x-2">
                {starship.magazinePdfUrl && (
                  <button 
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={() => handlePdfClick(starship.magazinePdfUrl, starship.shipName)}
                    title="View Magazine PDF"
                  >
                    <FontAwesomeIcon icon={faFilePdf} />
                  </button>
                )}
                
                <button 
                  className={`inline-flex items-center px-2.5 py-1.5 border text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    starship.owned 
                      ? 'border-red-300 text-red-700 bg-white hover:bg-red-50 focus:ring-red-500' 
                      : 'border-green-300 text-green-700 bg-white hover:bg-green-50 focus:ring-green-500'
                  }`}
                  onClick={() => onToggleOwned(starship._id)}
                  title={starship.owned ? "Remove from Collection" : "Add to Collection"}
                >
                  <FontAwesomeIcon icon={starship.owned ? faTrash : faPlus} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredStarships.length === 0 && (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No starships match your current filters.</p>
        </div>
      )}
      
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