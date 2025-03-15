import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Statistics component
const Statistics = dynamic(() => import('../components/Statistics'), {
  loading: () => <div className="p-4 text-center">Loading statistics...</div>,
  ssr: false
});

interface StatisticsData {
  totalStarships: number;
  ownedStarships: number;
  factionBreakdown: { [key: string]: { total: number; owned: number } };
  editionBreakdown: { [key: string]: { total: number; owned: number } };
}

const StatisticsPage: React.FC = () => {
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalStarships: 0,
    ownedStarships: 0,
    factionBreakdown: {},
    editionBreakdown: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/starships');
      
      if (!response.ok) {
        throw new Error('Failed to fetch starships');
      }
      
      const data = await response.json();
      const starships = data.data || [];
      
      // Calculate statistics
      const totalStarships = starships.length;
      const ownedStarships = starships.filter((s: any) => s.owned).length;
      
      // Calculate faction breakdown
      const factionBreakdown: { [key: string]: { total: number; owned: number } } = {};
      starships.forEach((starship: any) => {
        const faction = starship.faction;
        if (!factionBreakdown[faction]) {
          factionBreakdown[faction] = { total: 0, owned: 0 };
        }
        factionBreakdown[faction].total++;
        if (starship.owned) {
          factionBreakdown[faction].owned++;
        }
      });
      
      // Calculate edition breakdown
      const editionBreakdown: { [key: string]: { total: number; owned: number } } = {};
      starships.forEach((starship: any) => {
        const edition = starship.edition;
        if (!editionBreakdown[edition]) {
          editionBreakdown[edition] = { total: 0, owned: 0 };
        }
        editionBreakdown[edition].total++;
        if (starship.owned) {
          editionBreakdown[edition].owned++;
        }
      });
      
      setStatistics({
        totalStarships,
        ownedStarships,
        factionBreakdown,
        editionBreakdown
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Collection Statistics</h1>
        <p className="text-gray-600">Insights and analytics about your starship collection</p>
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
            totalStarships={statistics.totalStarships}
            ownedStarships={statistics.ownedStarships}
            factionBreakdown={statistics.factionBreakdown}
            editionBreakdown={statistics.editionBreakdown}
            viewMode="all"
          />
        )}
      </div>
    </div>
  );
};

export default StatisticsPage; 