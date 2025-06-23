import React from 'react';
import { Starship } from '../types';

interface StarshipTableRowProps {
  starship: Starship;
  onToggleOwned: (id: string) => Promise<void>;
  onSelectStarship: (starship: Starship) => void;
  onToggleWishlist?: (id: string) => Promise<void>;
  onCycleStatus?: (id: string, direction: string) => Promise<void>;
  onSelectionToggle?: (id: string) => void;
  isSelected?: boolean;
  columns: Array<{
    key: string;
    header: string;
    render?: (item: Starship) => React.ReactNode;
    sortable?: boolean;
    alignment?: 'left' | 'center' | 'right';
    width?: string;
    order?: number;
  }>;
  formatCurrency?: (amount: number) => string;
}

const StarshipTableRow: React.FC<StarshipTableRowProps> = React.memo(({
  starship,
  onToggleOwned,
  onSelectStarship,
  onToggleWishlist,
  onCycleStatus,
  onSelectionToggle,
  isSelected = false,
  columns,
  formatCurrency = (amount: number) => `$${amount.toFixed(2)}`
}) => {
  const handleRowClick = (e: React.MouseEvent) => {
    // Don't trigger row click if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.closest('button, input')) {
      return;
    }
    onSelectStarship(starship);
  };

  const renderCellContent = (column: any) => {
    if (column.render) {
      return column.render(starship);
    }

    const value = starship[column.key as keyof Starship];
    
    // Handle special cases
    switch (column.key) {
      case 'owned':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {value ? 'Owned' : 'Not Owned'}
          </span>
        );
      
      case 'wishlist':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            value ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {value ? 'Wishlist' : ''}
          </span>
        );
      
      case 'retailPrice':
      case 'purchasePrice':
      case 'marketValue':
        return value !== undefined && typeof value === 'number' ? formatCurrency(value) : '-';
      
      case 'releaseDate':
        return value && (typeof value === 'string' || typeof value === 'number' || value instanceof Date) ? new Date(value).toLocaleDateString() : '-';
      
      case 'select':
        return (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelectionToggle?.(starship._id);
            }}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        );
      
      default:
        return value || '-';
    }
  };

  const getAlignmentClass = (alignment?: 'left' | 'center' | 'right') => {
    switch (alignment) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  return (
    <tr 
      className={`hover:bg-gray-50 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50' : ''}`}
      onClick={handleRowClick}
    >
      {columns.map((column) => (
        <td 
          key={column.key} 
          className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${getAlignmentClass(column.alignment)}`}
          style={{ width: column.width }}
        >
          {renderCellContent(column)}
        </td>
      ))}
    </tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  // Only re-render if these specific properties change
  return (
    prevProps.starship._id === nextProps.starship._id &&
    prevProps.starship.owned === nextProps.starship.owned &&
    prevProps.starship.wishlist === nextProps.starship.wishlist &&
    prevProps.starship.onOrder === nextProps.starship.onOrder &&
    prevProps.starship.notInterested === nextProps.starship.notInterested &&
    prevProps.starship.retailPrice === nextProps.starship.retailPrice &&
    prevProps.starship.purchasePrice === nextProps.starship.purchasePrice &&
    prevProps.starship.marketValue === nextProps.starship.marketValue &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.columns.length === nextProps.columns.length &&
    // Check if column order has changed
    prevProps.columns.every((col, index) => 
      col.key === nextProps.columns[index]?.key && 
      col.order === nextProps.columns[index]?.order
    )
  );
});

StarshipTableRow.displayName = 'StarshipTableRow';

export default StarshipTableRow; 