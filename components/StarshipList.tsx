import React, { useState, useEffect } from 'react';
import { Table, Form, InputGroup, Button, Dropdown, DropdownButton, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortUp, faSortDown, faCheck, faTimes, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';

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
}

const StarshipList: React.FC<StarshipListProps> = ({ 
  starships, 
  onToggleOwned,
  onSelectStarship
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'issue', direction: 'asc' });
  const [filters, setFilters] = useState<Filters>({
    search: '',
    faction: [],
    edition: ['Regular'],
    owned: 'all'
  });
  const [filteredStarships, setFilteredStarships] = useState<Starship[]>(starships || []);
  const [availableFactions, setAvailableFactions] = useState<string[]>([]);
  const [availableEditions, setAvailableEditions] = useState<string[]>([]);

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
          const aNum = parseInt(a.issue, 10);
          const bNum = parseInt(b.issue, 10);
          
          // If both are valid numbers, compare them numerically
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return sortConfig.direction === 'asc' 
              ? aNum - bNum 
              : bNum - aNum;
          }
          
          // If only one is a number, prioritize numbers before strings
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
    
    // Set default filter to Regular edition
    if (availableEditions.includes('Regular')) {
      setFilters(prev => ({ ...prev, edition: ['Regular'] }));
    }

    // Apply initial filtering
    if (starships && starships.length > 0) {
      let initialFiltered = [...starships];
      
      // Filter by Regular edition
      if (availableEditions.includes('Regular')) {
        initialFiltered = initialFiltered.filter(ship => ship.edition === 'Regular');
      }
      
      // Sort by issue number
      initialFiltered.sort((a, b) => {
        const aNum = parseInt(a.issue, 10);
        const bNum = parseInt(b.issue, 10);
        
        // If both are valid numbers, compare them numerically
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        
        // If only one is a number, prioritize numbers before strings
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
  }, [availableEditions, starships]);

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

  const toggleEditionFilter = (edition: string) => {
    setFilters(prev => {
      const newEditions = prev.edition.includes(edition)
        ? prev.edition.filter(e => e !== edition)
        : [...prev.edition, edition];
      
      return { ...prev, edition: newEditions };
    });
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

  return (
    <div>
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <InputGroup className="w-50">
            <InputGroup.Text>
              <FontAwesomeIcon icon={faSearch} />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search by ship name or issue"
              value={filters.search}
              onChange={handleSearchChange}
            />
          </InputGroup>
          
          <div className="d-flex">
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
              className="me-2"
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
                  Clear Faction Filters
                </Dropdown.Item>
              )}
            </DropdownButton>
            
            <DropdownButton 
              id="dropdown-edition-filter" 
              title={
                <span>
                  <FontAwesomeIcon icon={faFilter} /> Edition
                  {filters.edition.length > 0 && (
                    <Badge bg="primary" className="ms-1">{filters.edition.length}</Badge>
                  )}
                </span>
              }
              variant="outline-secondary"
              className="me-2"
            >
              {availableEditions.map(edition => (
                <Dropdown.Item 
                  key={edition} 
                  onClick={() => toggleEditionFilter(edition)}
                  active={filters.edition.includes(edition)}
                >
                  {edition}
                </Dropdown.Item>
              ))}
              {filters.edition.length > 0 && (
                <Dropdown.Item 
                  onClick={() => setFilters(prev => ({ ...prev, edition: [] }))}
                  className="text-danger"
                >
                  Clear Edition Filters
                </Dropdown.Item>
              )}
            </DropdownButton>
            
            <DropdownButton 
              id="dropdown-owned-filter" 
              title={
                <span>
                  <FontAwesomeIcon icon={faFilter} /> Ownership
                </span>
              }
              variant="outline-secondary"
            >
              <Dropdown.Item 
                onClick={() => setOwnedFilter('all')}
                active={filters.owned === 'all'}
              >
                All Starships
              </Dropdown.Item>
              <Dropdown.Item 
                onClick={() => setOwnedFilter('owned')}
                active={filters.owned === 'owned'}
              >
                Owned Only
              </Dropdown.Item>
              <Dropdown.Item 
                onClick={() => setOwnedFilter('not-owned')}
                active={filters.owned === 'not-owned'}
              >
                Not Owned Only
              </Dropdown.Item>
            </DropdownButton>
          </div>
        </div>
        
        {(filters.faction.length > 0 || filters.edition.length > 0 || filters.owned !== 'all') && (
          <div className="mb-2">
            <small className="text-muted">
              Filtered results: {filteredStarships.length} of {starships.length} starships
            </small>
          </div>
        )}
      </div>
      
      <Table striped hover responsive>
        <thead>
          <tr>
            <th onClick={() => handleSort('issue')} style={{ cursor: 'pointer' }}>
              Issue {getSortIcon('issue')}
            </th>
            <th onClick={() => handleSort('edition')} style={{ cursor: 'pointer' }}>
              Edition {getSortIcon('edition')}
            </th>
            <th style={{ width: '80px' }}>Image</th>
            <th onClick={() => handleSort('shipName')} style={{ cursor: 'pointer' }}>
              Ship Name {getSortIcon('shipName')}
            </th>
            <th onClick={() => handleSort('faction')} style={{ cursor: 'pointer' }}>
              Race/Faction {getSortIcon('faction')}
            </th>
            <th onClick={() => handleSort('releaseDate')} style={{ cursor: 'pointer' }}>
              Release Date {getSortIcon('releaseDate')}
            </th>
            <th onClick={() => handleSort('owned')} style={{ cursor: 'pointer' }}>
              Owned {getSortIcon('owned')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStarships.map(starship => (
            <tr key={starship._id}>
              <td>{starship.issue || 'N/A'}</td>
              <td>{starship.edition || 'N/A'}</td>
              <td>
                {starship.imageUrl ? (
                  <img 
                    src={starship.imageUrl} 
                    alt={starship.shipName}
                    style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                    className="img-thumbnail"
                  />
                ) : (
                  <div 
                    className="bg-light d-flex align-items-center justify-content-center" 
                    style={{ width: '60px', height: '60px' }}
                  >
                    <small className="text-muted">No image</small>
                  </div>
                )}
              </td>
              <td>{starship.shipName || 'Unnamed'}</td>
              <td>{starship.faction || 'N/A'}</td>
              <td>{formatDate(starship.releaseDate)}</td>
              <td>
                {starship.owned ? (
                  <FontAwesomeIcon icon={faCheck} className="text-success" />
                ) : (
                  <FontAwesomeIcon icon={faTimes} className="text-secondary" />
                )}
              </td>
              <td>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => onSelectStarship(starship)}
                >
                  Details
                </Button>
                <Button 
                  variant={starship.owned ? "outline-danger" : "outline-success"} 
                  size="sm"
                  className="ms-2"
                  onClick={() => onToggleOwned(starship._id)}
                >
                  {starship.owned ? 'Remove' : 'Add to Collection'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      {filteredStarships.length === 0 && (
        <div className="text-center p-4 bg-light rounded">
          <p className="mb-0">No starships match your current filters.</p>
        </div>
      )}
    </div>
  );
};

export default StarshipList; 