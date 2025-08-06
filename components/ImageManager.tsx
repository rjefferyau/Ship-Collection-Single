import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faImage, 
  faSpinner, 
  faCheck, 
  faExclamationTriangle,
  faChevronDown,
  faChevronRight,
  faRefresh,
  faSearch,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { Starship } from '../types';
import ImageUploadRow from './ImageUploadRow';

interface GroupedData {
  [franchise: string]: {
    [edition: string]: Starship[];
  };
}

interface ImageManagerProps {
  className?: string;
  selectedFranchise?: string;
  selectedEdition?: string;
}

const ImageManager: React.FC<ImageManagerProps> = ({ 
  className = '', 
  selectedFranchise, 
  selectedEdition 
}) => {
  const [shipsWithoutImages, setShipsWithoutImages] = useState<Starship[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFranchises, setExpandedFranchises] = useState<Set<string>>(new Set());
  const [totalItemsWithoutImages, setTotalItemsWithoutImages] = useState(0);

  const fetchShipsWithoutImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build API URL with filters
      let url = '/api/starships?noImage=true&limit=1000';
      
      if (selectedFranchise) {
        url += `&franchise=${encodeURIComponent(selectedFranchise)}`;
      }
      
      if (selectedEdition) {
        url += `&edition=${encodeURIComponent(selectedEdition)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch ships');
      }
      
      const data = await response.json();
      const ships = data.data || [];
      
      // Filter ships that don't have images
      const shipsWithoutImages = ships.filter((ship: Starship) => 
        !ship.imageUrl || ship.imageUrl.trim() === ''
      );
      
      setShipsWithoutImages(shipsWithoutImages);
      setTotalItemsWithoutImages(shipsWithoutImages.length);
      
      // Group ships by franchise and edition
      const grouped: GroupedData = {};
      
      shipsWithoutImages.forEach((ship: Starship) => {
        const franchise = ship.franchise || 'Unknown Franchise';
        const edition = ship.edition || 'Unknown Edition';
        
        if (!grouped[franchise]) {
          grouped[franchise] = {};
        }
        
        if (!grouped[franchise][edition]) {
          grouped[franchise][edition] = [];
        }
        
        grouped[franchise][edition].push(ship);
      });
      
      // Sort ships within each edition by issue number (numeric sort)
      Object.keys(grouped).forEach(franchise => {
        Object.keys(grouped[franchise]).forEach(edition => {
          grouped[franchise][edition].sort((a, b) => {
            const issueA = parseInt(a.issue?.toString().replace(/\D/g, '') || '0', 10);
            const issueB = parseInt(b.issue?.toString().replace(/\D/g, '') || '0', 10);
            return issueA - issueB;
          });
        });
      });
      
      setGroupedData(grouped);
      
      // Auto-expand franchises that have items
      const franchisesWithItems = new Set(Object.keys(grouped));
      setExpandedFranchises(franchisesWithItems);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ships');
    } finally {
      setLoading(false);
    }
  }, [selectedFranchise, selectedEdition]);

  useEffect(() => {
    fetchShipsWithoutImages();
  }, [fetchShipsWithoutImages]);

  const handleUploadSuccess = (shipId: string) => {
    // Remove the ship from our data structures
    setShipsWithoutImages(prev => prev.filter(ship => ship._id !== shipId));
    
    // Update grouped data
    setGroupedData(prev => {
      const newGrouped = { ...prev };
      
      Object.keys(newGrouped).forEach(franchise => {
        Object.keys(newGrouped[franchise]).forEach(edition => {
          newGrouped[franchise][edition] = newGrouped[franchise][edition].filter(
            ship => ship._id !== shipId
          );
          
          // Remove empty editions
          if (newGrouped[franchise][edition].length === 0) {
            delete newGrouped[franchise][edition];
          }
        });
        
        // Remove empty franchises
        if (Object.keys(newGrouped[franchise]).length === 0) {
          delete newGrouped[franchise];
          setExpandedFranchises(prev => {
            const newExpanded = new Set(prev);
            newExpanded.delete(franchise);
            return newExpanded;
          });
        }
      });
      
      return newGrouped;
    });
    
    setTotalItemsWithoutImages(prev => Math.max(0, prev - 1));
  };

  const handleUploadError = (shipId: string, error: string) => {
    console.error(`Upload error for ship ${shipId}:`, error);
  };

  const toggleFranchise = (franchise: string) => {
    setExpandedFranchises(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(franchise)) {
        newExpanded.delete(franchise);
      } else {
        newExpanded.add(franchise);
      }
      return newExpanded;
    });
  };

  const filteredGroupedData = React.useMemo(() => {
    if (!searchTerm.trim()) return groupedData;
    
    const filtered: GroupedData = {};
    const searchLower = searchTerm.toLowerCase();
    
    Object.keys(groupedData).forEach(franchise => {
      Object.keys(groupedData[franchise]).forEach(edition => {
        const filteredShips = groupedData[franchise][edition].filter(ship =>
          (ship.shipName || '').toLowerCase().includes(searchLower) ||
          (ship.faction || '').toLowerCase().includes(searchLower) ||
          (ship.issue || '').toString().toLowerCase().includes(searchLower) ||
          franchise.toLowerCase().includes(searchLower) ||
          edition.toLowerCase().includes(searchLower)
        );
        
        if (filteredShips.length > 0) {
          if (!filtered[franchise]) {
            filtered[franchise] = {};
          }
          filtered[franchise][edition] = filteredShips;
        }
      });
    });
    
    return filtered;
  }, [groupedData, searchTerm]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  const remainingCount = Object.keys(filteredGroupedData).reduce((total, franchise) => {
    return total + Object.keys(filteredGroupedData[franchise]).reduce((franchiseTotal, edition) => {
      return franchiseTotal + filteredGroupedData[franchise][edition].length;
    }, 0);
  }, 0);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-gray-400 mr-3" />
          <span className="text-gray-600">Loading items without images...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-red-500" />
            Error Loading Items
          </h2>
          <button
            onClick={fetchShipsWithoutImages}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          >
            <FontAwesomeIcon icon={faRefresh} className="mr-1" />
            Retry
          </button>
        </div>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FontAwesomeIcon icon={faImage} className="mr-2 text-blue-500" />
              Image Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {remainingCount === 0 
                ? "All items have images! 🎉" 
                : `${remainingCount} item${remainingCount === 1 ? '' : 's'} need${remainingCount === 1 ? 's' : ''} images`
              }
            </p>
          </div>
          <button
            onClick={fetchShipsWithoutImages}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
          >
            <FontAwesomeIcon icon={faRefresh} className="mr-1" />
            Refresh
          </button>
        </div>
        
        {/* Search */}
        {remainingCount > 0 && (
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search items, franchises, editions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {remainingCount === 0 ? (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faCheck} className="text-4xl text-green-500 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Done!</h3>
            <p className="text-gray-600">
              Every item in your collection has an image. Excellent work!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(filteredGroupedData).sort().map(franchise => (
              <div key={franchise}>
                {/* Franchise Header */}
                <button
                  onClick={() => toggleFranchise(franchise)}
                  className="w-full flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors mb-3"
                >
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FontAwesomeIcon 
                      icon={expandedFranchises.has(franchise) ? faChevronDown : faChevronRight} 
                      className="mr-2 text-gray-500 text-sm"
                    />
                    {franchise}
                  </h3>
                  <span className="text-sm text-gray-600">
                    {Object.keys(filteredGroupedData[franchise]).reduce((total, edition) => 
                      total + filteredGroupedData[franchise][edition].length, 0
                    )} items
                  </span>
                </button>

                {/* Editions */}
                {expandedFranchises.has(franchise) && (
                  <div className="ml-4 space-y-4">
                    {Object.keys(filteredGroupedData[franchise]).sort().map(edition => (
                      <div key={`${franchise}-${edition}`}>
                        {/* Edition Header */}
                        <h4 className="text-md font-medium text-gray-700 mb-2 px-2">
                          {edition} ({filteredGroupedData[franchise][edition].length} items)
                        </h4>
                        
                        {/* Ships */}
                        <div className="space-y-2 ml-4">
                          {filteredGroupedData[franchise][edition].map(ship => (
                            <ImageUploadRow
                              key={ship._id}
                              ship={ship}
                              onUploadSuccess={handleUploadSuccess}
                              onUploadError={handleUploadError}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageManager;