import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import CollectionFilter from '../components/CollectionFilter';

// Dynamically import the Statistics component
const Statistics = dynamic(() => import('../components/Statistics'), {
  loading: () => <div className="p-4 text-center">Loading statistics...</div>,
  ssr: false
});

interface StatisticsData {
  totalItems: number;
  ownedItems: number;
  orderedItems: number;
  factionBreakdown: { [key: string]: { total: number; owned: number; ordered: number } };
  editionBreakdown: { [key: string]: { total: number; owned: number; ordered: number } };
  collectionTypeBreakdown: { [key: string]: { total: number; owned: number; ordered: number } };
  franchiseBreakdown: { [key: string]: { total: number; owned: number; ordered: number } };
}

const StatisticsPage: React.FC = () => {
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalItems: 0,
    ownedItems: 0,
    orderedItems: 0,
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
      const response = await fetch(`/api/starships?limit=1000&fields=_id,issue,edition,editionInternalName,shipName,faction,franchise,collectionType,owned,wishlist,onOrder,marketValue,retailPrice&_t=${Date.now()}` , { cache: 'no-store' });
      
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
      
      // Always add limit=1000 to get all items for statistics
      queryParams.push('limit=1000');
      
      if (queryParams.length > 0) {
        apiUrl += `?${queryParams.join('&')}`;
      }
      
      const response = await fetch(`${apiUrl}${apiUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`, { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      
      const data = await response.json();
      const items = data.data || [];
      
      // Calculate statistics
      const totalItems = items.length;
      const ownedItems = items.filter((item: any) => item.owned).length;
      const orderedItems = items.filter((item: any) => item.onOrder && !item.owned).length;
      
      // Calculate faction breakdown
      const factionBreakdown: { [key: string]: { total: number; owned: number; ordered: number } } = {};
      items.forEach((item: any) => {
        const faction = item.faction;
        if (!factionBreakdown[faction]) {
          factionBreakdown[faction] = { total: 0, owned: 0, ordered: 0 };
        }
        factionBreakdown[faction].total++;
        if (item.owned) {
          factionBreakdown[faction].owned++;
        } else if (item.onOrder) {
          factionBreakdown[faction].ordered++;
        }
      });
      
      // Calculate edition breakdown
      const editionBreakdown: { [key: string]: { total: number; owned: number; ordered: number } } = {};
      items.forEach((item: any) => {
        const edition = item.edition;
        if (!editionBreakdown[edition]) {
          editionBreakdown[edition] = { total: 0, owned: 0, ordered: 0 };
        }
        editionBreakdown[edition].total++;
        if (item.owned) {
          editionBreakdown[edition].owned++;
        } else if (item.onOrder) {
          editionBreakdown[edition].ordered++;
        }
      });
      
      // Calculate collection type breakdown
      const collectionTypeBreakdown: { [key: string]: { total: number; owned: number; ordered: number } } = {};
      items.forEach((item: any) => {
        const collectionType = item.collectionType || 'Unknown';
        if (!collectionTypeBreakdown[collectionType]) {
          collectionTypeBreakdown[collectionType] = { total: 0, owned: 0, ordered: 0 };
        }
        collectionTypeBreakdown[collectionType].total++;
        if (item.owned) {
          collectionTypeBreakdown[collectionType].owned++;
        } else if (item.onOrder) {
          collectionTypeBreakdown[collectionType].ordered++;
        }
      });
      
      // Calculate franchise breakdown
      const franchiseBreakdown: { [key: string]: { total: number; owned: number; ordered: number } } = {};
      items.forEach((item: any) => {
        const franchise = item.franchise || 'Unknown';
        if (!franchiseBreakdown[franchise]) {
          franchiseBreakdown[franchise] = { total: 0, owned: 0, ordered: 0 };
        }
        franchiseBreakdown[franchise].total++;
        if (item.owned) {
          franchiseBreakdown[franchise].owned++;
        } else if (item.onOrder) {
          franchiseBreakdown[franchise].ordered++;
        }
      });
      
      setStatistics({
        totalItems,
        ownedItems,
        orderedItems,
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

  // Function to handle filter changes from CollectionFilter component
  const handleFilterChange = (collectionType: string, franchise: string) => {
    setSelectedCollectionType(collectionType);
    setSelectedFranchise(franchise);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="w-full px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Collection Statistics</h1>
          <p className="text-gray-600">Insights and analytics about your collectibles</p>
        </div>

        {/* Collection Filter */}
        <CollectionFilter onFilterChange={handleFilterChange} className="mb-6" />

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
              orderedItems={statistics.orderedItems}
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
    </div>
  );
};

export default StatisticsPage; 