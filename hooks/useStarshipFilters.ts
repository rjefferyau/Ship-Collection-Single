import { useState, useEffect } from 'react';
import { Starship, SortConfig, Filters } from '../types';

interface UseStarshipFiltersProps {
  starships: Starship[];
  currentEdition: string;
  selectedFranchise?: string;
}

interface UseStarshipFiltersReturn {
  // State
  sortConfig: SortConfig;
  filters: Filters;
  filteredStarships: Starship[];
  availableFactions: string[];
  availableEditions: string[];
  editionDisplayNames: Record<string, string>;
  availableCollectionTypes: string[];
  availableFranchises: string[];
  activeEdition: string;
  
  // Actions
  setSortConfig: (config: SortConfig) => void;
  setFilters: (filters: Filters) => void;
  setActiveEdition: (edition: string) => void;
  handleSort: (key: keyof Starship) => void;
  handleSearchChange: (value: string) => void;
  toggleFactionFilter: (faction: string) => void;
  toggleCollectionTypeFilter: (collectionType: string) => void;
  toggleFranchiseFilter: (franchise: string) => void;
  setOwnedFilter: (value: 'all' | 'owned' | 'not-owned' | 'wishlist' | 'on-order' | 'not-interested') => void;
}

export const useStarshipFilters = ({
  starships,
  currentEdition,
  selectedFranchise
}: UseStarshipFiltersProps): UseStarshipFiltersReturn => {
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
  const [editionDisplayNames, setEditionDisplayNames] = useState<Record<string, string>>({});
  const [availableCollectionTypes, setAvailableCollectionTypes] = useState<string[]>([]);
  const [availableFranchises, setAvailableFranchises] = useState<string[]>([]);
  const [activeEdition, setActiveEdition] = useState<string>(currentEdition);

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
        // Fallback to deriving from starships if API fails
        if (starships && starships.length > 0) {
          const editions = Array.from(new Set(
            starships.map(ship => ship.editionInternalName || ship.edition)
          )).filter(Boolean).sort();
          setAvailableEditions(editions);
        }
      }
    };
    
    fetchEditions();
  }, [selectedFranchise, starships]);

  // Extract unique values for filters
  useEffect(() => {
    if (!starships || starships.length === 0) return;
    
    // Extract unique factions
    const factions = Array.from(new Set(starships.map(ship => ship.faction))).sort();
    setAvailableFactions(factions);
    
    // Extract unique collection types
    const collectionTypes = Array.from(new Set(starships.map(ship => ship.collectionType))).sort();
    setAvailableCollectionTypes(collectionTypes);
    
    // Extract unique franchises
    const franchises = Array.from(new Set(starships.map(ship => ship.franchise))).sort();
    setAvailableFranchises(franchises);
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
    
    // Apply edition filter - use editionInternalName if available, otherwise fall back to edition
    if (filters.edition.length > 0) {
      result = result.filter(ship => {
        if (ship.editionInternalName) {
          return filters.edition.includes(ship.editionInternalName);
        }
        return filters.edition.includes(ship.edition);
      });
    }
    
    // Apply collection type filter
    if (filters.collectionType.length > 0) {
      result = result.filter(ship => filters.collectionType.includes(ship.collectionType));
    }
    
    // Apply franchise filter
    if (filters.franchise.length > 0) {
      result = result.filter(ship => filters.franchise.includes(ship.franchise));
    }
    
    // Apply owned filter
    if (filters.owned === 'owned') {
      result = result.filter(ship => ship.owned);
    } else if (filters.owned === 'not-owned') {
      result = result.filter(ship => !ship.owned && !ship.wishlist && !ship.onOrder && !ship.notInterested);
    } else if (filters.owned === 'wishlist') {
      result = result.filter(ship => ship.wishlist);
    } else if (filters.owned === 'on-order') {
      result = result.filter(ship => ship.onOrder);
    } else if (filters.owned === 'not-interested') {
      result = result.filter(ship => ship.notInterested);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Starship];
      const bValue = b[sortConfig.key as keyof Starship];
      
      // Handle undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      
      // Handle numeric sorting for issue numbers
      if (sortConfig.key === 'issue') {
        const aMatch = String(aValue).match(/(\d+)$/);
        const bMatch = String(bValue).match(/(\d+)$/);
        
        const aNum = aMatch ? parseInt(aMatch[1], 10) : NaN;
        const bNum = bMatch ? parseInt(bMatch[1], 10) : NaN;
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          const aPrefix = String(aValue).replace(/\d+$/, '');
          const bPrefix = String(bValue).replace(/\d+$/, '');
          
          if (aPrefix === bPrefix) {
            return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
          }
          return sortConfig.direction === 'asc' ? aPrefix.localeCompare(bPrefix) : bPrefix.localeCompare(aPrefix);
        }
      }
      
      // Handle string/general sorting
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredStarships(result);
  }, [starships, filters, sortConfig]);

  // Update activeEdition when currentEdition prop changes
  useEffect(() => {
    setActiveEdition(currentEdition);
    setFilters(prev => ({ ...prev, edition: [currentEdition] }));
  }, [currentEdition]);

  // Action handlers
  const handleSort = (key: keyof Starship) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const toggleFactionFilter = (faction: string) => {
    setFilters(prev => ({
      ...prev,
      faction: prev.faction.includes(faction)
        ? prev.faction.filter(f => f !== faction)
        : [...prev.faction, faction]
    }));
  };

  const toggleCollectionTypeFilter = (collectionType: string) => {
    setFilters(prev => ({
      ...prev,
      collectionType: prev.collectionType.includes(collectionType)
        ? prev.collectionType.filter(ct => ct !== collectionType)
        : [...prev.collectionType, collectionType]
    }));
  };

  const toggleFranchiseFilter = (franchise: string) => {
    setFilters(prev => ({
      ...prev,
      franchise: prev.franchise.includes(franchise)
        ? prev.franchise.filter(f => f !== franchise)
        : [...prev.franchise, franchise]
    }));
  };

  const setOwnedFilter = (value: 'all' | 'owned' | 'not-owned' | 'wishlist' | 'on-order' | 'not-interested') => {
    setFilters(prev => ({ ...prev, owned: value }));
  };

  return {
    // State
    sortConfig,
    filters,
    filteredStarships,
    availableFactions,
    availableEditions,
    editionDisplayNames,
    availableCollectionTypes,
    availableFranchises,
    activeEdition,
    
    // Actions
    setSortConfig,
    setFilters,
    setActiveEdition,
    handleSort,
    handleSearchChange,
    toggleFactionFilter,
    toggleCollectionTypeFilter,
    toggleFranchiseFilter,
    setOwnedFilter
  };
}; 