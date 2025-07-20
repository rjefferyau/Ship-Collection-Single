import React, { useState, useEffect } from 'react';
import { Starship, SortConfig, Filters } from '../types';

interface CollectionOverviewProps {
  starships: Starship[];
  onToggleOwned: (id: string) => Promise<void>;
  onSelectStarship: (starship: Starship) => void;
  onEditionChange?: (edition: string) => void;
  currentEdition?: string;
  selectedFranchise?: string;
  statusCounts?: {owned: number, wishlist: number, onOrder: number, notOwned: number} | null;
}

const CollectionOverview: React.FC<CollectionOverviewProps> = ({
  starships,
  onToggleOwned,
  onSelectStarship,
  onEditionChange,
  currentEdition = 'Regular',
  selectedFranchise,
  statusCounts
}) => {
  const [filteredStarships, setFilteredStarships] = useState<Starship[]>(starships || []);
  const [availableEditions, setAvailableEditions] = useState<string[]>([]);
  const [editionDisplayNames, setEditionDisplayNames] = useState<Record<string, string>>({});
  const [activeEdition, setActiveEdition] = useState<string>(currentEdition);
  const [localStatusCounts, setLocalStatusCounts] = useState<{owned: number, wishlist: number, onOrder: number, notOwned: number} | null>(statusCounts || null);

  // Fetch available editions from the API, filtered by franchise
  useEffect(() => {
    const fetchEditions = async () => {
      try {
        let url = '/api/editions';
        if (selectedFranchise) {
          url += `?franchise=${encodeURIComponent(selectedFranchise)}`;
        }
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const editions = data.data.map((edition: any) => edition.internalName).sort();
            const displayNames: Record<string, string> = {};
            data.data.forEach((edition: any) => {
              displayNames[edition.internalName] = edition.name;
            });
            setAvailableEditions(editions);
            setEditionDisplayNames(displayNames);
          }
        }
      } catch (error) {
        console.error('Error fetching editions:', error);
        if (starships && starships.length > 0) {
          const editions = Array.from(new Set(
            starships.map(ship => ship.editionInternalName || ship.edition)
          )).filter(Boolean).sort();
          setAvailableEditions(editions);
        }
      }
    };
    
    fetchEditions();
  }, [selectedFranchise]);

  // Filter starships by current edition and sort
  useEffect(() => {
    if (!starships || starships.length === 0) return;
    
    // Apply initial filtering based on currentEdition
    if (currentEdition) {
      const initialFiltered = starships.filter(ship => {
        if (ship.editionInternalName) {
          return ship.editionInternalName === currentEdition;
        }
        return ship.edition === currentEdition;
      });
      
      // Sort by issue number if possible
      initialFiltered.sort((a, b) => {
        const aMatch = a.issue.match(/(\d+)$/);
        const bMatch = b.issue.match(/(\d+)$/);
        
        const aNum = aMatch ? parseInt(aMatch[1], 10) : NaN;
        const bNum = bMatch ? parseInt(bMatch[1], 10) : NaN;
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          const aPrefix = a.issue.replace(/\d+$/, '');
          const bPrefix = b.issue.replace(/\d+$/, '');
          
          if (aPrefix === bPrefix) {
            return aNum - bNum;
          }
          
          return aPrefix.localeCompare(bPrefix);
        }
        
        if (!isNaN(aNum) && isNaN(bNum)) {
          return -1;
        }
        if (isNaN(aNum) && !isNaN(bNum)) {
          return 1;
        }
        
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
    console.log('CollectionOverview initializing with currentEdition:', currentEdition);
    setActiveEdition(currentEdition);
  }, []);

  // Update activeEdition when currentEdition prop changes
  useEffect(() => {
    console.log('CollectionOverview currentEdition changed to:', currentEdition);
    setActiveEdition(currentEdition);
    setLocalStatusCounts(statusCounts || null);
  }, [currentEdition, statusCounts]);

  // Fetch status counts for a specific edition
  const fetchStatusCountsForEdition = async (edition: string) => {
    try {
      console.log('Fetching status counts for edition:', edition);
      let url = '/api/starships?limit=1'; // We only need the statusCounts, not the actual data
      
      // Add filter parameters
      const queryParams = new URLSearchParams();
      queryParams.append('edition', edition);
      
      if (selectedFranchise) {
        queryParams.append('franchise', selectedFranchise);
      }
      
      // Add cache-busting parameter
      queryParams.append('_t', Date.now().toString());
      
      url = `${url}&${queryParams.toString()}`;
      console.log('Fetching URL:', url);
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('API response for edition counts:', data.statusCounts);
        if (data.success && data.statusCounts) {
          setLocalStatusCounts(data.statusCounts);
        }
      } else {
        console.error('API response not OK:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching status counts for edition:', error);
    }
  };

  const handleEditionSelect = (edition: string) => {
    setActiveEdition(edition);
    // Fetch new status counts for this edition
    fetchStatusCountsForEdition(edition);
    if (onEditionChange) {
      onEditionChange(edition);
    }
  };

  const getImageClassName = (starship: Starship) => {
    let className = 'w-full h-24 object-contain transition-all duration-200 cursor-pointer ';
    
    if (starship.owned) {
      // Full color for owned items
      className += 'opacity-100';
    } else {
      // Greyed out for items not owned, wishlist, or on order
      className += 'opacity-40';
    }
    
    return className;
  };

  const getContainerClassName = (starship: Starship) => {
    let className = 'bg-white rounded-lg shadow-sm overflow-hidden border-2 transition-all duration-200 hover:shadow-md cursor-pointer ';
    
    if (starship.owned) {
      className += 'border-green-500 hover:border-green-600';
    } else if (starship.wishlist) {
      className += 'border-yellow-500 hover:border-yellow-600';
    } else if (starship.onOrder) {
      className += 'border-blue-500 hover:border-blue-600';
    } else {
      className += 'border-gray-300 hover:border-gray-400';
    }
    
    return className;
  };

  return (
    <div>
      {/* Edition Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px overflow-x-auto">
          {availableEditions.map(edition => (
            <button
              key={edition}
              data-edition={edition}
              onClick={() => handleEditionSelect(edition)}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                activeEdition === edition
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {editionDisplayNames[edition] || edition}
            </button>
          ))}
        </nav>
      </div>

      {/* Collection Stats */}
      <div className="mb-6 flex flex-wrap gap-4 justify-center">
        <div className="bg-white rounded-lg px-4 py-2 shadow-sm border-2 border-green-500">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              Owned: {localStatusCounts?.owned ?? filteredStarships.filter(s => s.owned).length}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg px-4 py-2 shadow-sm border-2 border-yellow-500">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              Wishlist: {localStatusCounts?.wishlist ?? filteredStarships.filter(s => s.wishlist).length}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg px-4 py-2 shadow-sm border-2 border-blue-500">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              On Order: {localStatusCounts?.onOrder ?? filteredStarships.filter(s => s.onOrder).length}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg px-4 py-2 shadow-sm border-2 border-gray-300">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              Not Owned: {localStatusCounts?.notOwned ?? filteredStarships.filter(s => !s.owned && !s.wishlist && !s.onOrder).length}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
        {filteredStarships.map(starship => (
                     <div 
             key={starship._id} 
             className={getContainerClassName(starship)}
             onClick={() => onSelectStarship(starship)}
             title={`${starship.shipName} (${starship.faction})`}
           >
             <div className="p-2">
               {starship.imageUrl ? (
                 <img 
                   src={starship.imageUrl} 
                   alt={starship.shipName}
                   className={getImageClassName(starship)}
                 />
               ) : (
                 <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-gray-400">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                   </svg>
                 </div>
               )}
             </div>
             <div className="px-2 pb-2">
               <div className="text-xs text-gray-600 truncate" title={starship.shipName}>
                 {starship.shipName}
               </div>
             </div>
           </div>
        ))}
      </div>

      {filteredStarships.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-1">No ships found</h3>
          <p className="text-gray-500">Try selecting a different edition or add some ships to your collection.</p>
        </div>
      )}
    </div>
  );
};

export default CollectionOverview; 