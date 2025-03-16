import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Statistics component
const Statistics = dynamic(() => import('../components/Statistics'), {
  loading: () => <div className="p-4 text-center">Loading statistics...</div>,
  ssr: false
});

interface StatisticsData {
  totalItems: number;
  ownedItems: number;
  factionBreakdown: { [key: string]: { total: number; owned: number } };
  editionBreakdown: { [key: string]: { total: number; owned: number } };
  collectionTypeBreakdown: { [key: string]: { total: number; owned: number } };
  franchiseBreakdown: { [key: string]: { total: number; owned: number } };
}

const StatisticsPage: React.FC = () => {
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalItems: 0,
    ownedItems: 0,
    factionBreakdown: {},
    editionBreakdown: {},
    collectionTypeBreakdown: {},
    franchiseBreakdown: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCollectionType, setSelectedCollectionType] = useState<string>('');
  const [selectedFranchise, setSelectedFranchise] = useState<string>('');
  const [allFranchises, setAllFranchises] = useState<string[]>([]);
  const [allCollectionTypes, setAllCollectionTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchStatistics();
  }, [selectedCollectionType, selectedFranchise]);

  // Fetch all available franchises and collection types once on component mount
  useEffect(() => {
    fetchAllOptions();
  }, []);

  // Function to fetch all available franchises and collection types
  const fetchAllOptions = async () => {
    try {
      const response = await fetch('/api/starships');
      
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      
      const data = await response.json();
      const items = data.data || [];
      
      // Extract unique franchises
      const franchises = Array.from(new Set(
        items.map((item: any) => item.franchise || 'Unknown')
      )).sort() as string[];
      setAllFranchises(franchises);
      
      // Extract unique collection types
      const collectionTypes = Array.from(new Set(
        items.map((item: any) => item.collectionType || 'Unknown')
      )).sort() as string[];
      setAllCollectionTypes(collectionTypes);
      
    } catch (err) {
      console.error('Error fetching options:', err);
    }
  };

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build the API URL with filters
      let apiUrl = '/api/starships';
      const queryParams = [];
      
      if (selectedCollectionType) {
        queryParams.push(`collectionType=${encodeURIComponent(selectedCollectionType)}`);
      }
      
      if (selectedFranchise) {
        queryParams.push(`franchise=${encodeURIComponent(selectedFranchise)}`);
      }
      
      if (queryParams.length > 0) {
        apiUrl += `?${queryParams.join('&')}`;
      }
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      
      const data = await response.json();
      const items = data.data || [];
      
      // Calculate statistics
      const totalItems = items.length;
      const ownedItems = items.filter((item: any) => item.owned).length;
      
      // Calculate faction breakdown
      const factionBreakdown: { [key: string]: { total: number; owned: number } } = {};
      items.forEach((item: any) => {
        const faction = item.faction;
        if (!factionBreakdown[faction]) {
          factionBreakdown[faction] = { total: 0, owned: 0 };
        }
        factionBreakdown[faction].total++;
        if (item.owned) {
          factionBreakdown[faction].owned++;
        }
      });
      
      // Calculate edition breakdown
      const editionBreakdown: { [key: string]: { total: number; owned: number } } = {};
      items.forEach((item: any) => {
        const edition = item.edition;
        if (!editionBreakdown[edition]) {
          editionBreakdown[edition] = { total: 0, owned: 0 };
        }
        editionBreakdown[edition].total++;
        if (item.owned) {
          editionBreakdown[edition].owned++;
        }
      });
      
      // Calculate collection type breakdown
      const collectionTypeBreakdown: { [key: string]: { total: number; owned: number } } = {};
      items.forEach((item: any) => {
        const collectionType = item.collectionType || 'Unknown';
        if (!collectionTypeBreakdown[collectionType]) {
          collectionTypeBreakdown[collectionType] = { total: 0, owned: 0 };
        }
        collectionTypeBreakdown[collectionType].total++;
        if (item.owned) {
          collectionTypeBreakdown[collectionType].owned++;
        }
      });
      
      // Calculate franchise breakdown
      const franchiseBreakdown: { [key: string]: { total: number; owned: number } } = {};
      items.forEach((item: any) => {
        const franchise = item.franchise || 'Unknown';
        if (!franchiseBreakdown[franchise]) {
          franchiseBreakdown[franchise] = { total: 0, owned: 0 };
        }
        franchiseBreakdown[franchise].total++;
        if (item.owned) {
          franchiseBreakdown[franchise].owned++;
        }
      });
      
      setStatistics({
        totalItems,
        ownedItems,
        factionBreakdown,
        editionBreakdown,
        collectionTypeBreakdown,
        franchiseBreakdown
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle collection type selection
  const handleCollectionTypeChange = (collectionType: string) => {
    setSelectedCollectionType(collectionType === selectedCollectionType ? '' : collectionType);
  };

  // Function to handle franchise selection
  const handleFranchiseChange = (franchise: string) => {
    setSelectedFranchise(franchise === selectedFranchise ? '' : franchise);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Collection Statistics</h1>
        <p className="text-gray-600">Insights and analytics about your collectibles</p>
      </div>

      {/* Filter controls */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Collection Type</label>
          <select
            value={selectedCollectionType}
            onChange={(e) => handleCollectionTypeChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All Collection Types</option>
            {allCollectionTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Franchise</label>
          <select
            value={selectedFranchise}
            onChange={(e) => handleFranchiseChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All Franchises</option>
            {allFranchises.map((franchise) => (
              <option key={franchise} value={franchise}>{franchise}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading statistics...</span>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : (
          <Statistics
            totalItems={statistics.totalItems}
            ownedItems={statistics.ownedItems}
            factionBreakdown={statistics.factionBreakdown}
            editionBreakdown={statistics.editionBreakdown}
            collectionTypeBreakdown={statistics.collectionTypeBreakdown}
            franchiseBreakdown={statistics.franchiseBreakdown}
            viewMode="all"
            selectedCollectionType={selectedCollectionType}
            selectedFranchise={selectedFranchise}
          />
        )}
      </div>
    </div>
  );
};

export default StatisticsPage; 