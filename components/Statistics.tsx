import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCube, faCheck, faPercentage, faList, faSort, faChevronRight, faFilter, faSearch, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import DataTable from './DataTable';

interface Item {
  _id: string;
  issue: string;
  edition: string;
  shipName: string;
  faction: string;
  releaseDate?: Date;
  imageUrl?: string;
  owned: boolean;
  onOrder: boolean;
}

interface StatisticsProps {
  totalItems: number;
  ownedItems: number;
  orderedItems: number;
  factionBreakdown: { [key: string]: { total: number; owned: number; ordered: number } };
  editionBreakdown: { [key: string]: { total: number; owned: number; ordered: number } };
  collectionTypeBreakdown: { [key: string]: { total: number; owned: number; ordered: number } };
  franchiseBreakdown: { [key: string]: { total: number; owned: number; ordered: number } };
  viewMode?: 'all' | 'editions' | 'factions' | 'summary' | 'collectionTypes' | 'franchises';
  selectedCollectionType?: string;
  selectedFranchise?: string;
}

type SortOption = 'total-desc' | 'total-asc' | 'owned-desc' | 'owned-asc' | 'percentage-desc' | 'percentage-asc' | 'name-asc' | 'name-desc';

const Statistics: React.FC<StatisticsProps> = ({
  totalItems,
  ownedItems,
  orderedItems,
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
  
  // New state for missing items
  const [missingItems, setMissingItems] = useState<Item[]>([]);
  const [showMissingItemsModal, setShowMissingItemsModal] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [missingItemsLoading, setMissingItemsLoading] = useState(false);
  const [missingItemsError, setMissingItemsError] = useState<string | null>(null);

  const ownedPercentage = totalItems > 0 
    ? Math.round((ownedItems / totalItems) * 100) 
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

  // Function to fetch missing items for a specific edition or faction
  const fetchMissingItems = async (type: 'edition' | 'faction', name: string) => {
    setMissingItemsLoading(true);
    setMissingItemsError(null);
    
    try {
      const response = await fetch('/api/starships');
      
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      
      const data = await response.json();
      const items = data.data || [];
      
      // Filter for missing items (not owned and not on order) of the selected edition or faction
      const filtered = items.filter((item: Item) => {
        if (type === 'edition') {
          return item.edition === name && !item.owned && !item.onOrder;
        } else {
          return item.faction === name && !item.owned && !item.onOrder;
        }
      });
      
      // Also get items on order
      const orderedItems = items.filter((item: Item) => {
        if (type === 'edition') {
          return item.edition === name && !item.owned && item.onOrder;
        } else {
          return item.faction === name && !item.owned && item.onOrder;
        }
      });
      
      // Combine items, with ordered items first
      setMissingItems([...orderedItems, ...filtered]);
      setSelectedTitle(name);
      setShowMissingItemsModal(true);
    } catch (err) {
      setMissingItemsError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setMissingItemsLoading(false);
    }
  };

  // Handle click on edition title
  const handleEditionClick = (edition: string) => {
    fetchMissingItems('edition', edition);
  };

  // Handle click on faction title
  const handleFactionClick = (faction: string) => {
    fetchMissingItems('faction', faction);
  };

  // Update the summary section
  const renderSummary = () => {
    // Calculate percentages
    const ownedPercentage = totalItems > 0 ? (ownedItems / totalItems) * 100 : 0;
    const completionPercentage = totalItems > 0 ? ((ownedItems + orderedItems) / totalItems) * 100 : 0;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <FontAwesomeIcon icon={faList} className="text-xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-semibold text-gray-800">{totalItems}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <FontAwesomeIcon icon={faCheck} className="text-xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Owned Items</p>
              <p className="text-2xl font-semibold text-gray-800">{ownedItems}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <FontAwesomeIcon icon={faCube} className="text-xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">On Order</p>
              <p className="text-2xl font-semibold text-gray-800">{orderedItems}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <FontAwesomeIcon icon={faPercentage} className="text-xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Collection Completion</p>
              <p className="text-2xl font-semibold text-gray-800">{completionPercentage.toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="flex h-2.5">
                <div 
                  className={`h-2.5 rounded-l-full ${getProgressVariant(ownedPercentage)}`}
                  style={{ width: `${ownedPercentage}%` }}
                ></div>
                <div 
                  className="h-2.5 bg-yellow-500"
                  style={{ width: `${completionPercentage - ownedPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Update the renderEditionBreakdown function
  const renderEditionBreakdown = () => {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Edition Breakdown</h3>
          <div className="flex items-center">
            <div className="mr-4">
              <label className="inline-flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                  checked={showEmptyEditions}
                  onChange={(e) => setShowEmptyEditions(e.target.checked)}
                />
                <span className="ml-2">Show editions with no items</span>
              </label>
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
              const ownedPercentage = data.total > 0 
                ? Math.round((data.owned / data.total) * 100) 
                : 0;
              
              const totalPercentage = data.total > 0
                ? Math.round(((data.owned + data.ordered) / data.total) * 100)
                : 0;
                
              return (
                <div key={edition} className="mb-4">
                  <div className="h-full bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="p-4">
                      <h6 className="flex justify-between items-center mb-2">
                        <span 
                          className="text-truncate cursor-pointer" 
                          onClick={() => handleEditionClick(edition)}
                          title={`View missing & ordered items in ${edition}`}
                        >
                          {edition}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${totalPercentage === 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                          {totalPercentage}%
                        </span>
                      </h6>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                        <div className="flex h-2">
                          <div 
                            className={`h-2 ${getProgressVariant(ownedPercentage)}`} 
                            style={{ width: `${ownedPercentage}%` }}
                          ></div>
                          {data.ordered > 0 && (
                            <div 
                              className="h-2 bg-yellow-500" 
                              style={{ width: `${(data.ordered / data.total) * 100}%` }}
                            ></div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <small className="text-gray-500">
                          <strong>{data.owned}</strong>{data.ordered > 0 && <span>, <strong>{data.ordered}</strong> ordered</span>} of <strong>{data.total}</strong>
                        </small>
                        <small className="text-gray-500">
                          {data.total - data.owned - data.ordered > 0 ? `${data.total - data.owned - data.ordered} missing` : 'Complete!'}
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
    );
  };

  return (
    <div>
      {(viewMode === 'all' || viewMode === 'summary') && (
        <>
          {renderSummary()}
          <div className="flex justify-center items-center mb-6 gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-blue-500 mr-2"></div>
              <span>Owned</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-yellow-500 mr-2"></div>
              <span>On Order</span>
            </div>
          </div>
        </>
      )}
      
      {(viewMode === 'all' || viewMode === 'editions') && Object.keys(editionBreakdown).length > 0 && (
        renderEditionBreakdown()
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
                const ownedPercentage = data.total > 0 
                  ? Math.round((data.owned / data.total) * 100) 
                  : 0;
                  
                const totalPercentage = data.total > 0
                  ? Math.round(((data.owned + data.ordered) / data.total) * 100)
                  : 0;
                  
                return (
                  <div key={faction} className="mb-4">
                    <div className="h-full bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="p-4">
                        <h6 className="flex justify-between items-center mb-2">
                          <span 
                            className="text-truncate cursor-pointer" 
                            onClick={() => handleFactionClick(faction)}
                            title={`View missing & ordered items in ${faction}`}
                          >
                            {faction}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${totalPercentage === 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {totalPercentage}%
                          </span>
                        </h6>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div className="flex h-2">
                            <div 
                              className={`h-2 ${getProgressVariant(ownedPercentage)}`} 
                              style={{ width: `${ownedPercentage}%` }}
                            ></div>
                            {data.ordered > 0 && (
                              <div 
                                className="h-2 bg-yellow-500" 
                                style={{ width: `${(data.ordered / data.total) * 100}%` }}
                              ></div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <small className="text-gray-500">
                            <strong>{data.owned}</strong>{data.ordered > 0 && <span>, <strong>{data.ordered}</strong> ordered</span>} of <strong>{data.total}</strong>
                          </small>
                          <small className="text-gray-500">
                            {data.total - data.owned - data.ordered > 0 ? `${data.total - data.owned - data.ordered} missing` : 'Complete!'}
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
                const ownedPercentage = data.total > 0 
                  ? Math.round((data.owned / data.total) * 100) 
                  : 0;
                  
                const totalPercentage = data.total > 0
                  ? Math.round(((data.owned + data.ordered) / data.total) * 100)
                  : 0;
                  
                return (
                  <div key={collectionType} className="mb-4">
                    <div className="h-full bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="p-4">
                        <h6 className="flex justify-between items-center mb-2">
                          <span className="text-truncate">
                            {collectionType}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${totalPercentage === 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {totalPercentage}%
                          </span>
                        </h6>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div className="flex h-2">
                            <div 
                              className={`h-2 ${getProgressVariant(ownedPercentage)}`} 
                              style={{ width: `${ownedPercentage}%` }}
                            ></div>
                            {data.ordered > 0 && (
                              <div 
                                className="h-2 bg-yellow-500" 
                                style={{ width: `${(data.ordered / data.total) * 100}%` }}
                              ></div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <small className="text-gray-500">
                            <strong>{data.owned}</strong>{data.ordered > 0 && <span>, <strong>{data.ordered}</strong> ordered</span>} of <strong>{data.total}</strong>
                          </small>
                          <small className="text-gray-500">
                            {data.total - data.owned - data.ordered > 0 ? `${data.total - data.owned - data.ordered} missing` : 'Complete!'}
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
                const ownedPercentage = data.total > 0 
                  ? Math.round((data.owned / data.total) * 100) 
                  : 0;
                  
                const totalPercentage = data.total > 0
                  ? Math.round(((data.owned + data.ordered) / data.total) * 100)
                  : 0;
                  
                return (
                  <div key={franchise} className="mb-4">
                    <div className="h-full bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="p-4">
                        <h6 className="flex justify-between items-center mb-2">
                          <span className="text-truncate">
                            {franchise}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${totalPercentage === 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {totalPercentage}%
                          </span>
                        </h6>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div className="flex h-2">
                            <div 
                              className={`h-2 ${getProgressVariant(ownedPercentage)}`} 
                              style={{ width: `${ownedPercentage}%` }}
                            ></div>
                            {data.ordered > 0 && (
                              <div 
                                className="h-2 bg-yellow-500" 
                                style={{ width: `${(data.ordered / data.total) * 100}%` }}
                              ></div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <small className="text-gray-500">
                            <strong>{data.owned}</strong>{data.ordered > 0 && <span>, <strong>{data.ordered}</strong> ordered</span>} of <strong>{data.total}</strong>
                          </small>
                          <small className="text-gray-500">
                            {data.total - data.owned - data.ordered > 0 ? `${data.total - data.owned - data.ordered} missing` : 'Complete!'}
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
                          const ownedPercentage = data.total > 0 
                            ? Math.round((data.owned / data.total) * 100) 
                            : 0;
                            
                          const totalPercentage = data.total > 0
                            ? Math.round(((data.owned + data.ordered) / data.total) * 100)
                            : 0;
                            
                          return (
                            <div key={faction} className="mb-4">
                              <div className="h-full bg-white border border-gray-200 rounded-lg shadow-sm">
                                <div className="p-4">
                                  <h6 className="flex justify-between items-center mb-2">
                                    <span 
                                      className="text-truncate cursor-pointer" 
                                      onClick={() => handleFactionClick(faction)}
                                      title={`View missing & ordered items in ${faction}`}
                                    >
                                      {faction}
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${totalPercentage === 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                      {totalPercentage}%
                                    </span>
                                  </h6>
                                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                                    <div className="flex h-2">
                                      <div 
                                        className={`h-2 ${getProgressVariant(ownedPercentage)}`} 
                                        style={{ width: `${ownedPercentage}%` }}
                                      ></div>
                                      {data.ordered > 0 && (
                                        <div 
                                          className="h-2 bg-yellow-500" 
                                          style={{ width: `${(data.ordered / data.total) * 100}%` }}
                                        ></div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <small className="text-gray-500">
                                      <strong>{data.owned}</strong>{data.ordered > 0 && <span>, <strong>{data.ordered}</strong> ordered</span>} of <strong>{data.total}</strong>
                                    </small>
                                    <small className="text-gray-500">
                                      {data.total - data.owned - data.ordered > 0 ? `${data.total - data.owned - data.ordered} missing` : 'Complete!'}
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

      {/* Missing Items Modal */}
      {showMissingItemsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowMissingItemsModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Missing & Ordered Items - {selectedTitle}
                    </h3>
                    <div className="mt-4">
                      {missingItemsLoading ? (
                        <div className="flex justify-center items-center h-64">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                          <span className="ml-3 text-gray-600">Loading missing & ordered items...</span>
                        </div>
                      ) : missingItemsError ? (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                          <strong className="font-bold">Error!</strong>
                          <span className="block sm:inline"> {missingItemsError}</span>
                        </div>
                      ) : missingItems.length === 0 ? (
                        <div className="text-center py-8">
                          <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="text-yellow-500 mb-2" />
                          <p className="text-gray-600">No missing or ordered items found for this selection.</p>
                        </div>
                      ) : (
                        <div className="mt-4 overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edition</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faction</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {missingItems.map((item) => (
                                <tr key={item._id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.shipName}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.issue}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.edition}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.faction}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {item.onOrder ? (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                        On Order
                                      </span>
                                    ) : (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                        Missing
                                      </span>
                                    )}
                                  </td>
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
                  onClick={() => setShowMissingItemsModal(false)}
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