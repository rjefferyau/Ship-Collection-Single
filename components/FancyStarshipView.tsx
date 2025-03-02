import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Form, InputGroup, Dropdown, DropdownButton } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faSearch, faFilter, faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';

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

interface FancyStarshipViewProps {
  starships: Starship[];
  onToggleOwned: (id: string) => Promise<void>;
  onSelectStarship: (starship: Starship) => void;
}

const FancyStarshipView: React.FC<FancyStarshipViewProps> = ({
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
  }, [availableEditions]);

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

  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div>
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
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
              id="dropdown-sort" 
              title={
                <span>
                  {sortConfig.direction === 'asc' 
                    ? <FontAwesomeIcon icon={faSortUp} className="me-1" /> 
                    : <FontAwesomeIcon icon={faSortDown} className="me-1" />
                  }
                  Sort: {sortConfig.key.charAt(0).toUpperCase() + sortConfig.key.slice(1)}
                </span>
              }
              variant="outline-secondary"
              className="me-2"
            >
              <Dropdown.Item onClick={() => handleSort('issue')}>
                Issue {sortConfig.key === 'issue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleSort('edition')}>
                Edition {sortConfig.key === 'edition' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleSort('shipName')}>
                Ship Name {sortConfig.key === 'shipName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleSort('faction')}>
                Faction {sortConfig.key === 'faction' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleSort('releaseDate')}>
                Release Date {sortConfig.key === 'releaseDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </Dropdown.Item>
            </DropdownButton>
            
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
          <div className="mb-3">
            <small className="text-muted">
              Filtered results: {filteredStarships.length} of {starships.length} starships
            </small>
          </div>
        )}
      </div>
      
      <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {filteredStarships.map(starship => (
          <Col key={starship._id}>
            <Card className="h-100 shadow-sm">
              <div className="position-relative">
                {starship.imageUrl ? (
                  <Card.Img 
                    variant="top" 
                    src={starship.imageUrl} 
                    alt={starship.shipName}
                    style={{ height: '180px', objectFit: 'contain', padding: '1rem' }}
                  />
                ) : (
                  <div 
                    className="bg-light d-flex align-items-center justify-content-center" 
                    style={{ height: '180px' }}
                  >
                    <span className="text-muted">No image available</span>
                  </div>
                )}
                <Badge 
                  bg={starship.owned ? "success" : "secondary"}
                  className="position-absolute top-0 end-0 m-2"
                >
                  {starship.owned ? "Owned" : "Not Owned"}
                </Badge>
              </div>
              
              <Card.Body>
                <Card.Title className="d-flex justify-content-between align-items-center">
                  <span>Issue {starship.issue}</span>
                  <Badge bg="info">{starship.edition}</Badge>
                </Card.Title>
                <Card.Text className="mb-1">
                  <strong>{starship.shipName}</strong>
                </Card.Text>
                <Card.Text className="text-muted mb-1">
                  {starship.faction}
                </Card.Text>
                <Card.Text className="text-muted small">
                  Released: {formatDate(starship.releaseDate)}
                </Card.Text>
              </Card.Body>
              
              <Card.Footer className="bg-white border-top-0">
                <div className="d-flex justify-content-between">
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
                    onClick={() => onToggleOwned(starship._id)}
                  >
                    {starship.owned ? "Remove" : "Add"}
                  </Button>
                </div>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
      
      {filteredStarships.length === 0 && (
        <div className="text-center p-5 bg-light rounded">
          <p className="mb-0">No starships match your current filters.</p>
        </div>
      )}
    </div>
  );
};

export default FancyStarshipView; 