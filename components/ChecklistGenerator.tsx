import React, { useState, useEffect } from 'react';
import ChecklistPDF from './ChecklistPDF';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface ChecklistFilters {
  franchise: string;
  editions: string[];
  includeOwned: boolean;
  includeWishlist: boolean;
  includeOnOrder: boolean;
  includeNotOwned: boolean;
}

interface Edition {
  _id: string;
  name: string;
  internalName: string;
  franchise: string;
}

interface ChecklistGeneratorProps {
  className?: string;
}

const ChecklistGenerator: React.FC<ChecklistGeneratorProps> = ({ className = '' }) => {
  const [filters, setFilters] = useState<ChecklistFilters>({
    franchise: '',
    editions: [],
    includeOwned: true,
    includeWishlist: true,
    includeOnOrder: true,
    includeNotOwned: false
  });

  const [franchises, setFranchises] = useState<string[]>([]);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [availableEditions, setAvailableEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch franchises on mount
  useEffect(() => {
    fetchFranchises();
    fetchAllEditions();
  }, []);

  // Update available editions when franchise changes
  useEffect(() => {
    if (filters.franchise) {
      const filtered = editions.filter(e => e.franchise === filters.franchise);
      setAvailableEditions(filtered);
      // Reset edition selection when franchise changes
      setFilters(prev => ({ ...prev, editions: [] }));
    } else {
      setAvailableEditions(editions);
    }
  }, [filters.franchise, editions]);

  const fetchFranchises = async () => {
    try {
      const response = await fetch('/api/franchises');
      if (response.ok) {
        const data = await response.json();
        const franchiseNames = data.data.map((f: any) => f.name);
        setFranchises(franchiseNames);
      }
    } catch (err) {
      console.error('Error fetching franchises:', err);
    }
  };

  const fetchAllEditions = async () => {
    try {
      const response = await fetch('/api/editions');
      if (response.ok) {
        const data = await response.json();
        setEditions(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching editions:', err);
    }
  };

  const handleFranchiseChange = (franchise: string) => {
    setFilters(prev => ({ ...prev, franchise }));
    setPreviewData(null);
  };

  const handleEditionToggle = (editionInternalName: string) => {
    setFilters(prev => {
      const editions = prev.editions.includes(editionInternalName)
        ? prev.editions.filter(e => e !== editionInternalName)
        : [...prev.editions, editionInternalName];
      return { ...prev, editions };
    });
    setPreviewData(null);
  };

  const handleStatusToggle = (status: keyof ChecklistFilters) => {
    setFilters(prev => ({ 
      ...prev, 
      [status]: !prev[status as keyof ChecklistFilters] 
    }));
    setPreviewData(null);
  };

  const fetchPreviewData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.franchise) {
        params.append('franchise', filters.franchise);
      }
      
      if (filters.editions.length > 0) {
        params.append('editions', filters.editions.join(','));
      }
      
      params.append('includeOwned', filters.includeOwned.toString());
      params.append('includeWishlist', filters.includeWishlist.toString());
      params.append('includeOnOrder', filters.includeOnOrder.toString());
      params.append('includeNotOwned', filters.includeNotOwned.toString());
      
      const response = await fetch(`/api/starships/checklist?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch checklist data');
      }
      
      const data = await response.json();
      setPreviewData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const isValidSelection = () => {
    const hasStatusFilter = filters.includeOwned || filters.includeWishlist || 
                           filters.includeOnOrder || filters.includeNotOwned;
    return hasStatusFilter;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <FontAwesomeIcon icon={faClipboardList} className="mr-2 text-indigo-600" />
          Configure Checklist
        </h2>

        {/* Franchise Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Franchise
          </label>
          <select
            value={filters.franchise}
            onChange={(e) => handleFranchiseChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Franchises</option>
            {franchises.map(franchise => (
              <option key={franchise} value={franchise}>
                {franchise}
              </option>
            ))}
          </select>
        </div>

        {/* Edition Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Editions
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {availableEditions.length === 0 ? (
              <p className="text-sm text-gray-500">
                {filters.franchise ? 'No editions available for this franchise' : 'Select a franchise first'}
              </p>
            ) : (
              availableEditions.map(edition => (
                <label key={edition.internalName} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={filters.editions.includes(edition.internalName)}
                    onChange={() => handleEditionToggle(edition.internalName)}
                    className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{edition.name}</span>
                  {edition.franchise && (
                    <span className="ml-2 text-xs text-gray-500">({edition.franchise})</span>
                  )}
                </label>
              ))
            )}
          </div>
          {availableEditions.length > 0 && (
            <div className="mt-2 flex space-x-2">
              <button
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  editions: availableEditions.map(e => e.internalName) 
                }))}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Select All
              </button>
              <span className="text-xs text-gray-400">|</span>
              <button
                onClick={() => setFilters(prev => ({ ...prev, editions: [] }))}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Status Filters */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Include Items With Status
          </label>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={filters.includeOwned}
                onChange={() => handleStatusToggle('includeOwned')}
                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Owned</span>
            </label>
            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={filters.includeWishlist}
                onChange={() => handleStatusToggle('includeWishlist')}
                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Wishlist</span>
            </label>
            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={filters.includeOnOrder}
                onChange={() => handleStatusToggle('includeOnOrder')}
                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">On Order</span>
            </label>
            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={filters.includeNotOwned}
                onChange={() => handleStatusToggle('includeNotOwned')}
                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Not Owned</span>
            </label>
          </div>
        </div>

        {/* Preview Button */}
        <button
          onClick={fetchPreviewData}
          disabled={!isValidSelection() || loading}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
            isValidSelection() && !loading
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              <span>Loading Preview...</span>
            </>
          ) : (
            <span>Generate Preview</span>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Preview Section */}
      {previewData && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{previewData.statusCounts.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-600">Owned</p>
              <p className="text-2xl font-bold text-green-900">{previewData.statusCounts.owned}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-600">Wishlist</p>
              <p className="text-2xl font-bold text-blue-900">{previewData.statusCounts.wishlist}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-sm text-yellow-600">On Order</p>
              <p className="text-2xl font-bold text-yellow-900">{previewData.statusCounts.onOrder}</p>
            </div>
          </div>

          {/* Edition Breakdown */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Editions Included:</h4>
            <div className="space-y-1">
              {previewData.editionGroups.map((group: any) => (
                <div key={group.editionInternalName} className="flex justify-between text-sm">
                  <span className="text-gray-700">{group.editionName}</span>
                  <span className="text-gray-500">{group.ships.length} items</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PDF Generation */}
      {previewData && previewData.editionGroups.length > 0 && (
        <ChecklistPDF
          editionGroups={previewData.editionGroups}
          franchise={filters.franchise || 'All'}
          onGenerate={() => setGenerating(true)}
          onComplete={() => setGenerating(false)}
        />
      )}
    </div>
  );
};

export default ChecklistGenerator;