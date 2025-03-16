import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShip, faCheck, faPercentage, faList, faSort, faChevronRight, faFilter, faSearch, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import DataTable from './DataTable';

interface Starship {
  _id: string;
  issue: string;
  edition: string;
  shipName: string;
  faction: string;
  releaseDate?: Date;
  imageUrl?: string;
  owned: boolean;
}

interface StatisticsProps {
  totalStarships: number;
  ownedStarships: number;
  factionBreakdown: { [key: string]: { total: number; owned: number } };
  editionBreakdown: { [key: string]: { total: number; owned: number } };
  collectionTypeBreakdown: { [key: string]: { total: number; owned: number } };
  franchiseBreakdown: { [key: string]: { total: number; owned: number } };
  viewMode?: 'all' | 'editions' | 'factions' | 'summary' | 'collectionTypes' | 'franchises';
  selectedCollectionType?: string;
  selectedFranchise?: string;
}

type SortOption = 'total-desc' | 'total-asc' | 'owned-desc' | 'owned-asc' | 'percentage-desc' | 'percentage-asc' | 'name-asc' | 'name-desc';

const Statistics: React.FC<StatisticsProps> = ({
  totalStarships,
  ownedStarships,
  factionBreakdown,
  editionBreakdown,
  collectionTypeBreakdown,
  franchiseBreakdown,
  viewMode = 'all',
  selectedCollectionType = '',
  selectedFranchise = ''
}) => {
  const [editionSortOption, setEditionSortOption] = useState<SortOption>('total-desc');
  const [factionSortOption, setFactionSortOption] = useState<SortOption>('owned-desc');
  const [collectionTypeSortOption, setCollectionTypeSortOption] = useState<SortOption>('total-desc');
  const [franchiseSortOption, setFranchiseSortOption] = useState<SortOption>('total-desc');
  const [editionFilter, setEditionFilter] = useState('');
  const [factionFilter, setFactionFilter] = useState('');
  const [collectionTypeFilter, setCollectionTypeFilter] = useState('');
  const [franchiseFilter, setFranchiseFilter] = useState('');
  const [showEmptyEditions, setShowEmptyEditions] = useState(true);
  const [showEmptyFactions, setShowEmptyFactions] = useState(true);
  const [showEmptyCollectionTypes, setShowEmptyCollectionTypes] = useState(true);
  const [showEmptyFranchises, setShowEmptyFranchises] = useState(true);
  const [showAllFactionsModal, setShowAllFactionsModal] = useState(false);
  
  // New state for missing ships modal
  const [missingShips, setMissingShips] = useState<Starship[]>([]);
  const [showMissingShipsModal, setShowMissingShipsModal] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [loadingMissingShips, setLoadingMissingShips] = useState(false);
  const [missingShipsError, setMissingShipsError] = useState<string | null>(null);

  const ownedPercentage = totalStarships > 0 
    ? Math.round((ownedStarships / totalStarships) * 100) 
    : 0;

  const getSortFunction = (sortOption: SortOption) => {
    switch (sortOption) {
      case 'total-desc':
        return ([, a]: [string, { total: number; owned: number }], [, b]: [string, { total: number; owned: number }]) => b.total - a.total;
      case 'total-asc':
        return ([, a]: [string, { total: number; owned: number }], [, b]: [string, { total: number; owned: number }]) => a.total - b.total;
      case 'owned-desc':
        return ([, a]: [string, { total: number; owned: number }], [, b]: [string, { total: number; owned: number }]) => b.owned - a.owned;
      case 'owned-asc':
        return ([, a]: [string, { total: number; owned: number }], [, b]: [string, { total: number; owned: number }]) => a.owned - b.owned;
      case 'percentage-desc':
        return ([, a]: [string, { total: number; owned: number }], [, b]: [string, { total: number; owned: number }]) => 
          (b.total > 0 ? (b.owned / b.total) : 0) - (a.total > 0 ? (a.owned / a.total) : 0);
      case 'percentage-asc':
        return ([, a]: [string, { total: number; owned: number }], [, b]: [string, { total: number; owned: number }]) => 
          (a.total > 0 ? (a.owned / a.total) : 0) - (b.total > 0 ? (b.owned / b.total) : 0);
      case 'name-asc':
        return ([nameA]: [string, any], [nameB]: [string, any]) => nameA.localeCompare(nameB);
      case 'name-desc':
        return ([nameA]: [string, any], [nameB]: [string, any]) => nameB.localeCompare(nameA);
      default:
        return ([, a]: [string, { total: number; owned: number }], [, b]: [string, { total: number; owned: number }]) => b.total - a.total;
    }
  };

  const getProgressVariant = (percentage: number) => {
    if (percentage >= 90) {
      return 'bg-green-500';
    } else if (percentage >= 75) {
      return 'bg-blue-500';
    } else if (percentage >= 50) {
      return 'bg-cyan-500';
    } else if (percentage >= 25) {
      return 'bg-yellow-500';
    } else {
      return 'bg-red-500';
    }
  };

  const filteredEditions = Object.entries(editionBreakdown)
    .filter(([edition]) => edition.toLowerCase().includes(editionFilter.toLowerCase()))
    .filter(([, data]) => showEmptyEditions || data.total > 0);

  const filteredFactions = Object.entries(factionBreakdown)
    .filter(([faction]) => faction.toLowerCase().includes(factionFilter.toLowerCase()))
    .filter(([, data]) => showEmptyFactions || data.total > 0);

  const filteredCollectionTypes = Object.entries(collectionTypeBreakdown)
    .filter(([type]) => type.toLowerCase().includes(collectionTypeFilter.toLowerCase()))
    .filter(([, data]) => showEmptyCollectionTypes || data.total > 0);

  const filteredFranchises = Object.entries(franchiseBreakdown)
    .filter(([franchise]) => franchise.toLowerCase().includes(franchiseFilter.toLowerCase()))
    .filter(([, data]) => showEmptyFranchises || data.total > 0);

  const sortedEditions = filteredEditions.sort(getSortFunction(editionSortOption));
  const sortedFactions = filteredFactions.sort(getSortFunction(factionSortOption));
  const sortedCollectionTypes = filteredCollectionTypes.sort(getSortFunction(collectionTypeSortOption));
  const sortedFranchises = filteredFranchises.sort(getSortFunction(franchiseSortOption));
  const topFactions = sortedFactions.slice(0, 6); // Only show top 6 factions on dashboard
  const topCollectionTypes = sortedCollectionTypes.slice(0, 6); // Only show top 6 collection types on dashboard
  const topFranchises = sortedFranchises.slice(0, 6); // Only show top 6 franchises on dashboard

  const getSortLabel = (sortOption: SortOption) => {
    switch (sortOption) {
      case 'total-desc': return 'Total (High to Low)';
      case 'total-asc': return 'Total (Low to High)';
      case 'owned-desc': return 'Owned (High to Low)';
      case 'owned-asc': return 'Owned (Low to High)';
      case 'percentage-desc': return 'Completion % (High to Low)';
      case 'percentage-asc': return 'Completion % (Low to High)';
      case 'name-asc': return 'Name (A to Z)';
      case 'name-desc': return 'Name (Z to A)';
      default: return 'Sort by';
    }
  };

  // Function to fetch missing ships for a specific edition or faction
  const fetchMissingShips = async (type: 'edition' | 'faction', name: string) => {
    setLoadingMissingShips(true);
    setMissingShipsError(null);
    setSelectedTitle(name);
    
    try {
      const response = await fetch('/api/starships');
      
      if (!response.ok) {
        throw new Error('Failed to fetch starships');
      }
      
      const data = await response.json();
      const starships = data.data || [];
      
      // Filter for missing ships (not owned) of the selected edition or faction
      const filtered = starships.filter((ship: Starship) => {
        if (type === 'edition') {
          return ship.edition === name && !ship.owned;
        } else {
          return ship.faction === name && !ship.owned;
        }
      });
      
      setMissingShips(filtered);
      setShowMissingShipsModal(true);
    } catch (err) {
      setMissingShipsError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoadingMissingShips(false);
    }
  };

  // Handle click on edition title
  const handleEditionClick = (edition: string) => {
    fetchMissingShips('edition', edition);
  };

  // Handle click on faction title
  const handleFactionClick = (faction: string) => {
    fetchMissingShips('faction', faction);
  };

  return (
    <div>
      {(viewMode === 'all' || viewMode === 'summary') && (
        <>
          <h3 className="mb-3">Collection Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="col-span-1">
              <div className="h-full p-4 bg-white border border-gray-200 rounded-lg shadow-sm text-center">
                <FontAwesomeIcon icon={faList} size="2x" className="mb-2 text-blue-600" />
                <h5>Total Starships</h5>
                <div className="text-4xl font-bold">{totalStarships}</div>
              </div>
            </div>
            
            <div className="col-span-1">
              <div className="h-full p-4 bg-white border border-gray-200 rounded-lg shadow-sm text-center">
                <FontAwesomeIcon icon={faCheck} size="2x" className="mb-2 text-green-600" />
                <h5>Owned Starships</h5>
                <div className="text-4xl font-bold">{ownedStarships}</div>
              </div>
            </div>
            
            <div className="col-span-1">
              <div className="h-full p-4 bg-white border border-gray-200 rounded-lg shadow-sm text-center">
                <FontAwesomeIcon icon={faPercentage} size="2x" className="mb-2 text-cyan-600" />
                <h5>Collection Completion</h5>
                <div className="text-4xl font-bold text-center mb-2">{ownedPercentage}%</div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-2 ${getProgressVariant(ownedPercentage)}`} style={{ width: `${ownedPercentage}%` }}></div>
                </div>
                <div className="text-center mt-2">
                  <strong>{ownedStarships}</strong> of <strong>{totalStarships}</strong> starships owned
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {(viewMode === 'all' || viewMode === 'editions') && Object.keys(editionBreakdown).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h5 className="mb-0 font-medium">Edition Breakdown</h5>
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <input
                  type="checkbox"
                  id="show-empty-editions"
                  checked={showEmptyEditions}
                  onChange={(e) => setShowEmptyEditions(e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="show-empty-editions" className="text-sm">Show Empty</label>
              </div>
              <div className="flex items-center">
                <select
                  id="edition-sort-dropdown"
                  value={editionSortOption}
                  onChange={(e) => setEditionSortOption(e.target.value as SortOption)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value="name-asc">Name (A to Z)</option>
                  <option value="name-desc">Name (Z to A)</option>
                  <option value="total-desc">Total (High to Low)</option>
                  <option value="total-asc">Total (Low to High)</option>
                  <option value="owned-desc">Owned (High to Low)</option>
                  <option value="owned-asc">Owned (Low to High)</option>
                  <option value="percentage-desc">Completion % (High to Low)</option>
                  <option value="percentage-asc">Completion % (Low to High)</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="mb-3">
              <input
                type="text"
                placeholder="Filter editions..."
                value={editionFilter}
                onChange={(e) => setEditionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedEditions.map(([edition, data]) => {
                const percentage = data.total > 0 
                  ? Math.round((data.owned / data.total) * 100) 
                  : 0;
                  
                return (
                  <div key={edition} className="mb-4">
                    <div className="h-full bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="p-4">
                        <h6 className="flex justify-between items-center mb-2">
                          <span 
                            className="text-truncate cursor-pointer" 
                            onClick={() => handleEditionClick(edition)}
                            title={`View missing ships in ${edition}`}
                          >
                            {edition}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${percentage === 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {percentage}%
                          </span>
                        </h6>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div className={`h-2 ${getProgressVariant(percentage)}`} style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <small className="text-gray-500">
                            <strong>{data.owned}</strong> of <strong>{data.total}</strong> owned
                          </small>
                          <small className="text-gray-500">
                            {data.total - data.owned} missing
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {sortedEditions.length === 0 && (
                <div className="col-span-full text-center py-4">
                  <p className="text-gray-500">No editions match your filter criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {(viewMode === 'all' || viewMode === 'factions') && Object.keys(factionBreakdown).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h5 className="mb-0 font-medium">Faction Breakdown</h5>
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <input
                  type="checkbox"
                  id="show-empty-factions"
                  checked={showEmptyFactions}
                  onChange={(e) => setShowEmptyFactions(e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="show-empty-factions" className="text-sm">Show Empty</label>
              </div>
              <div className="flex items-center">
                <select
                  id="faction-sort-dropdown"
                  value={factionSortOption}
                  onChange={(e) => setFactionSortOption(e.target.value as SortOption)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value="name-asc">Name (A to Z)</option>
                  <option value="name-desc">Name (Z to A)</option>
                  <option value="total-desc">Total (High to Low)</option>
                  <option value="total-asc">Total (Low to High)</option>
                  <option value="owned-desc">Owned (High to Low)</option>
                  <option value="owned-asc">Owned (Low to High)</option>
                  <option value="percentage-desc">Completion % (High to Low)</option>
                  <option value="percentage-asc">Completion % (Low to High)</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="mb-3">
              <input
                type="text"
                placeholder="Filter factions..."
                value={factionFilter}
                onChange={(e) => setFactionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedFactions.map(([faction, data]) => {
                const percentage = data.total > 0 
                  ? Math.round((data.owned / data.total) * 100) 
                  : 0;
                  
                return (
                  <div key={faction} className="mb-4">
                    <div className="h-full bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="p-4">
                        <h6 className="flex justify-between items-center mb-2">
                          <span 
                            className="text-truncate cursor-pointer" 
                            onClick={() => handleFactionClick(faction)}
                            title={`View missing ships in ${faction}`}
                          >
                            {faction}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${percentage === 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {percentage}%
                          </span>
                        </h6>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div className={`h-2 ${getProgressVariant(percentage)}`} style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <small className="text-gray-500">
                            <strong>{data.owned}</strong> of <strong>{data.total}</strong> owned
                          </small>
                          <small className="text-gray-500">
                            {data.total - data.owned} missing
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Collection Type Breakdown */}
      {(viewMode === 'all' || viewMode === 'collectionTypes') && Object.keys(collectionTypeBreakdown).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h5 className="mb-0 font-medium">Collection Type Breakdown</h5>
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <input
                  type="checkbox"
                  id="show-empty-collection-types"
                  checked={showEmptyCollectionTypes}
                  onChange={(e) => setShowEmptyCollectionTypes(e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="show-empty-collection-types" className="text-sm">Show Empty</label>
              </div>
              <div className="flex items-center">
                <select
                  id="collection-type-sort-dropdown"
                  value={collectionTypeSortOption}
                  onChange={(e) => setCollectionTypeSortOption(e.target.value as SortOption)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value="name-asc">Name (A to Z)</option>
                  <option value="name-desc">Name (Z to A)</option>
                  <option value="total-desc">Total (High to Low)</option>
                  <option value="total-asc">Total (Low to High)</option>
                  <option value="owned-desc">Owned (High to Low)</option>
                  <option value="owned-asc">Owned (Low to High)</option>
                  <option value="percentage-desc">Completion % (High to Low)</option>
                  <option value="percentage-asc">Completion % (Low to High)</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="mb-3">
              <input
                type="text"
                placeholder="Filter collection types..."
                value={collectionTypeFilter}
                onChange={(e) => setCollectionTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedCollectionTypes.map(([collectionType, data]) => {
                const percentage = data.total > 0 
                  ? Math.round((data.owned / data.total) * 100) 
                  : 0;
                  
                return (
                  <div key={collectionType} className="mb-4">
                    <div className="h-full bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="p-4">
                        <h6 className="flex justify-between items-center mb-2">
                          <span className="text-truncate">
                            {collectionType}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${percentage === 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {percentage}%
                          </span>
                        </h6>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div className={`h-2 ${getProgressVariant(percentage)}`} style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <small className="text-gray-500">
                            <strong>{data.owned}</strong> of <strong>{data.total}</strong> owned
                          </small>
                          <small className="text-gray-500">
                            {data.total - data.owned} missing
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Franchise Breakdown */}
      {(viewMode === 'all' || viewMode === 'franchises') && Object.keys(franchiseBreakdown).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h5 className="mb-0 font-medium">Franchise Breakdown</h5>
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <input
                  type="checkbox"
                  id="show-empty-franchises"
                  checked={showEmptyFranchises}
                  onChange={(e) => setShowEmptyFranchises(e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="show-empty-franchises" className="text-sm">Show Empty</label>
              </div>
              <div className="flex items-center">
                <select
                  id="franchise-sort-dropdown"
                  value={franchiseSortOption}
                  onChange={(e) => setFranchiseSortOption(e.target.value as SortOption)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value="name-asc">Name (A to Z)</option>
                  <option value="name-desc">Name (Z to A)</option>
                  <option value="total-desc">Total (High to Low)</option>
                  <option value="total-asc">Total (Low to High)</option>
                  <option value="owned-desc">Owned (High to Low)</option>
                  <option value="owned-asc">Owned (Low to High)</option>
                  <option value="percentage-desc">Completion % (High to Low)</option>
                  <option value="percentage-asc">Completion % (Low to High)</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="mb-3">
              <input
                type="text"
                placeholder="Filter franchises..."
                value={franchiseFilter}
                onChange={(e) => setFranchiseFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedFranchises.map(([franchise, data]) => {
                const percentage = data.total > 0 
                  ? Math.round((data.owned / data.total) * 100) 
                  : 0;
                  
                return (
                  <div key={franchise} className="mb-4">
                    <div className="h-full bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="p-4">
                        <h6 className="flex justify-between items-center mb-2">
                          <span className="text-truncate">
                            {franchise}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${percentage === 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {percentage}%
                          </span>
                        </h6>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div className={`h-2 ${getProgressVariant(percentage)}`} style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <small className="text-gray-500">
                            <strong>{data.owned}</strong> of <strong>{data.total}</strong> owned
                          </small>
                          <small className="text-gray-500">
                            {data.total - data.owned} missing
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* All Factions Modal */}
      {showAllFactionsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowAllFactionsModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      All Factions
                    </h3>
                    <div className="mt-4">
                      <div className="mb-3">
                        <input
                          type="text"
                          placeholder="Filter factions..."
                          value={factionFilter}
                          onChange={(e) => setFactionFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedFactions.map(([faction, data]) => {
                          const percentage = data.total > 0 
                            ? Math.round((data.owned / data.total) * 100) 
                            : 0;
                            
                          return (
                            <div key={faction} className="mb-4">
                              <div className="h-full bg-white border border-gray-200 rounded-lg shadow-sm">
                                <div className="p-4">
                                  <h6 className="flex justify-between items-center mb-2">
                                    <span 
                                      className="text-truncate cursor-pointer" 
                                      onClick={() => handleFactionClick(faction)}
                                      title={`View missing ships in ${faction}`}
                                    >
                                      {faction}
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${percentage === 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                      {percentage}%
                                    </span>
                                  </h6>
                                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                                    <div className={`h-2 ${getProgressVariant(percentage)}`} style={{ width: `${percentage}%` }}></div>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <small className="text-gray-500">
                                      <strong>{data.owned}</strong> of <strong>{data.total}</strong> owned
                                    </small>
                                    <small className="text-gray-500">
                                      {data.total - data.owned} missing
                                    </small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {sortedFactions.length === 0 && (
                          <div className="col-span-full text-center py-4">
                            <p className="text-gray-500">No factions match your filter criteria.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowAllFactionsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Missing Ships Modal */}
      {showMissingShipsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowMissingShipsModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Missing Ships - {selectedTitle}
                    </h3>
                    <div className="mt-4">
                      {loadingMissingShips ? (
                        <div className="flex justify-center items-center h-64">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                          <span className="ml-3 text-gray-600">Loading missing ships...</span>
                        </div>
                      ) : missingShipsError ? (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                          <strong className="font-bold">Error!</strong>
                          <span className="block sm:inline"> {missingShipsError}</span>
                        </div>
                      ) : missingShips.length === 0 ? (
                        <div className="text-center py-8">
                          <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="text-yellow-500 mb-2" />
                          <p className="text-gray-600">No missing ships found for this selection.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ship Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edition</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faction</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {missingShips.map((ship) => (
                                <tr key={ship._id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ship.shipName}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ship.issue}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ship.edition}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ship.faction}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowMissingShipsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics; 