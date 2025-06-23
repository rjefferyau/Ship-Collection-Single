import React, { useState, useEffect } from 'react';
import { Filters, Starship } from '../types';

interface StarshipFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  availableFactions: string[];
  availableEditions: string[];
  editionDisplayNames: Record<string, string>;
  activeEdition: string;
  onEditionSelect: (edition: string) => void;
  filteredStarships: Starship[];
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFactionToggle: (faction: string) => void;
  onOwnedFilterChange: (value: 'all' | 'owned' | 'not-owned' | 'wishlist' | 'on-order' | 'not-interested') => void;
}

const StarshipFilters: React.FC<StarshipFiltersProps> = ({
  filters,
  onFiltersChange,
  availableFactions,
  availableEditions,
  editionDisplayNames,
  activeEdition,
  onEditionSelect,
  filteredStarships,
  onSearchChange,
  onFactionToggle,
  onOwnedFilterChange
}) => {
  const [factionMenuOpen, setFactionMenuOpen] = useState(false);
  const [ownedMenuOpen, setOwnedMenuOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.filter-dropdown')) {
        setFactionMenuOpen(false);
        setOwnedMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderEditionTabs = () => {
    if (availableEditions.length === 0) {
      return null;
    }
    
    return (
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {availableEditions.map(edition => {
            const displayName = editionDisplayNames[edition] || edition;
            
            return (
              <button
                key={edition}
                data-edition={edition}
                onClick={() => onEditionSelect(edition)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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

  const getStatusLabel = () => {
    switch (filters.owned) {
      case 'owned': return 'Owned';
      case 'not-owned': return 'Not Owned';
      case 'wishlist': return 'Wishlist';
      case 'on-order': return 'On Order';
      case 'not-interested': return 'Not Interested';
      default: return 'All';
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Ships', icon: null },
    { value: 'owned', label: 'Owned Only', icon: 'check', color: 'text-green-500' },
    { value: 'not-owned', label: 'Not Owned Only', icon: 'x', color: 'text-red-500' },
    { value: 'wishlist', label: 'Wishlist Only', icon: 'star', color: 'text-yellow-500' },
    { value: 'on-order', label: 'On Order Only', icon: 'clock', color: 'text-blue-500' },
    { value: 'not-interested', label: 'Not Interested Only', icon: 'x-circle', color: 'text-red-500' }
  ];

  const renderStatusIcon = (icon: string | null, color?: string) => {
    if (!icon) return null;
    
    const iconPaths = {
      check: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",
      x: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z",
      star: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z",
      clock: "M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z",
      'x-circle': "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
    };
    
    return (
      <svg className={`mr-2 h-4 w-4 ${color}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d={iconPaths[icon as keyof typeof iconPaths]} clipRule="evenodd" />
      </svg>
    );
  };

  return (
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
              onChange={onSearchChange}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
          
          {/* Faction Filter */}
          <div className="relative inline-block text-left filter-dropdown">
            <button
              type="button"
              className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              onClick={() => setFactionMenuOpen(!factionMenuOpen)}
            >
              Faction
              {filters.faction.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {filters.faction.length}
                </span>
              )}
              <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {factionMenuOpen && (
              <div className="origin-top-right absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1">
                  <button
                    className={`${
                      filters.faction.length === 0 ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    } block px-4 py-2 text-sm w-full text-left hover:bg-gray-50 transition-colors`}
                    onClick={() => {
                      onFiltersChange({ ...filters, faction: [] });
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
                      } block px-4 py-2 text-sm w-full text-left hover:bg-gray-50 transition-colors`}
                      onClick={() => onFactionToggle(faction)}
                    >
                      {faction}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Status Filter */}
          <div className="relative inline-block text-left filter-dropdown">
            <button
              type="button"
              className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              onClick={() => setOwnedMenuOpen(!ownedMenuOpen)}
            >
              Status: {getStatusLabel()}
              <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {ownedMenuOpen && (
              <div className="origin-top-right absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1">
                  {statusOptions.map(({ value, label, icon, color }) => (
                    <button
                      key={value}
                      className={`${
                        filters.owned === value ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } block px-4 py-2 text-sm w-full text-left hover:bg-gray-50 transition-colors`}
                      onClick={() => onOwnedFilterChange(value as any)}
                    >
                      <span className="flex items-center">
                        {renderStatusIcon(icon, color)}
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex flex-col items-end">
          <div className="flex space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              <svg className="w-4 h-4 mr-1 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path>
              </svg>
              {filteredStarships.length} ships
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
              {filteredStarships.filter(s => s.owned).length} owned
            </span>
          </div>
          <div className="mt-2 w-full">
            <div className="text-sm flex justify-between mb-1">
              <span>Collection Progress</span>
              <span>{filteredStarships.length > 0 ? Math.round((filteredStarships.filter(s => s.owned).length / filteredStarships.length) * 100) : 0}%</span>
            </div>
            <div className="w-64 bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${filteredStarships.length > 0 ? (filteredStarships.filter(s => s.owned).length / filteredStarships.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edition Tabs */}
      {renderEditionTabs()}
    </div>
  );
};

export default StarshipFilters; 