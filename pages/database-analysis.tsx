import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function DatabaseAnalysis() {
  const [databaseStatus, setDatabaseStatus] = useState<any>(null);
  const [orphanedRecords, setOrphanedRecords] = useState<any>(null);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [loading, setLoading] = useState<{ status: boolean, orphaned: boolean, cleanup: boolean }>({ 
    status: false, 
    orphaned: false,
    cleanup: false
  });
  const [error, setError] = useState<{ status: string | null, orphaned: string | null, cleanup: string | null }>({ 
    status: null, 
    orphaned: null,
    cleanup: null
  });
  
  const fetchDatabaseStatus = async () => {
    setLoading(prev => ({ ...prev, status: true }));
    setError(prev => ({ ...prev, status: null }));
    
    try {
      const response = await fetch('/api/check-database-status');
      const data = await response.json();
      
      if (data.success) {
        setDatabaseStatus(data);
      } else {
        setError(prev => ({ ...prev, status: data.error || 'Failed to fetch database status' }));
      }
    } catch (err) {
      setError(prev => ({ ...prev, status: err instanceof Error ? err.message : 'An unknown error occurred' }));
    } finally {
      setLoading(prev => ({ ...prev, status: false }));
    }
  };
  
  const fetchOrphanedRecords = async () => {
    setLoading(prev => ({ ...prev, orphaned: true }));
    setError(prev => ({ ...prev, orphaned: null }));
    
    try {
      const response = await fetch('/api/check-orphaned-records');
      const data = await response.json();
      
      if (data.success) {
        setOrphanedRecords(data);
      } else {
        setError(prev => ({ ...prev, orphaned: data.error || 'Failed to fetch orphaned records' }));
      }
    } catch (err) {
      setError(prev => ({ ...prev, orphaned: err instanceof Error ? err.message : 'An unknown error occurred' }));
    } finally {
      setLoading(prev => ({ ...prev, orphaned: false }));
    }
  };

  const performCleanup = async (action: string) => {
    if (!confirm(`Are you sure you want to perform the action: ${action}?`)) {
      return;
    }

    setLoading(prev => ({ ...prev, cleanup: true }));
    setError(prev => ({ ...prev, cleanup: null }));
    setCleanupResult(null);
    
    try {
      const response = await fetch('/api/database-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCleanupResult(data);
        // Refresh the data after cleanup
        fetchDatabaseStatus();
        fetchOrphanedRecords();
      } else {
        setError(prev => ({ ...prev, cleanup: data.error || 'Failed to perform cleanup' }));
      }
    } catch (err) {
      setError(prev => ({ ...prev, cleanup: err instanceof Error ? err.message : 'An unknown error occurred' }));
    } finally {
      setLoading(prev => ({ ...prev, cleanup: false }));
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Head>
        <title>Database Analysis | Ship Collection</title>
      </Head>
      
      <div className="w-full px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Database Analysis</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Database Status Section */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Database Status</h2>
              <button
                onClick={fetchDatabaseStatus}
                disabled={loading.status}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading.status ? 'Loading...' : 'Check Status'}
              </button>
            </div>
            
            {error.status && (
              <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
                {error.status}
              </div>
            )}
            
            {databaseStatus && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Legacy Collections</h3>
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left">Collection</th>
                        <th className="px-4 py-2 text-left">Exists</th>
                        <th className="px-4 py-2 text-left">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border px-4 py-2">starshipv3</td>
                        <td className="border px-4 py-2">{databaseStatus.legacyCollections.starshipv3 ? 'Yes' : 'No'}</td>
                        <td className="border px-4 py-2">{databaseStatus.legacyCollections.counts.starshipv3}</td>
                      </tr>
                      <tr>
                        <td className="border px-4 py-2">starshipv4</td>
                        <td className="border px-4 py-2">{databaseStatus.legacyCollections.starshipv4 ? 'Yes' : 'No'}</td>
                        <td className="border px-4 py-2">{databaseStatus.legacyCollections.counts.starshipv4}</td>
                      </tr>
                      <tr>
                        <td className="border px-4 py-2">starshipv5</td>
                        <td className="border px-4 py-2">{databaseStatus.legacyCollections.counts.starshipv5 > 0 ? 'Yes' : 'No'}</td>
                        <td className="border px-4 py-2">{databaseStatus.legacyCollections.counts.starshipv5}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">ID Mapping Collection</h3>
                  <p>Exists: {databaseStatus.idMapping.exists ? 'Yes' : 'No'}</p>
                  <p>Document Count: {databaseStatus.idMapping.count}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Unused Fields (less than 10% usage)</h3>
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left">Field</th>
                        <th className="px-4 py-2 text-left">Count</th>
                        <th className="px-4 py-2 text-left">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(databaseStatus.fieldUsage.unusedFields).map(([field, data]: [string, any]) => (
                        <tr key={field}>
                          <td className="border px-4 py-2">{field}</td>
                          <td className="border px-4 py-2">{data.count}</td>
                          <td className="border px-4 py-2">{data.percentage.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          {/* Orphaned Records Section */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Orphaned Records</h2>
              <button
                onClick={fetchOrphanedRecords}
                disabled={loading.orphaned}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading.orphaned ? 'Loading...' : 'Check Records'}
              </button>
            </div>
            
            {error.orphaned && (
              <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
                {error.orphaned}
              </div>
            )}
            
            {orphanedRecords && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Collection Counts</h3>
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left">Collection</th>
                        <th className="px-4 py-2 text-left">Total</th>
                        <th className="px-4 py-2 text-left">Orphaned</th>
                        <th className="px-4 py-2 text-left">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border px-4 py-2">Editions</td>
                        <td className="border px-4 py-2">{orphanedRecords.totalCounts.editions}</td>
                        <td className="border px-4 py-2">{orphanedRecords.orphanedCounts.editions}</td>
                        <td className="border px-4 py-2">{orphanedRecords.orphanedPercentages.editions.toFixed(2)}%</td>
                      </tr>
                      <tr>
                        <td className="border px-4 py-2">Factions</td>
                        <td className="border px-4 py-2">{orphanedRecords.totalCounts.factions}</td>
                        <td className="border px-4 py-2">{orphanedRecords.orphanedCounts.factions}</td>
                        <td className="border px-4 py-2">{orphanedRecords.orphanedPercentages.factions.toFixed(2)}%</td>
                      </tr>
                      <tr>
                        <td className="border px-4 py-2">Franchises</td>
                        <td className="border px-4 py-2">{orphanedRecords.totalCounts.franchises}</td>
                        <td className="border px-4 py-2">{orphanedRecords.orphanedCounts.franchises}</td>
                        <td className="border px-4 py-2">{orphanedRecords.orphanedPercentages.franchises.toFixed(2)}%</td>
                      </tr>
                      <tr>
                        <td className="border px-4 py-2">Collection Types</td>
                        <td className="border px-4 py-2">{orphanedRecords.totalCounts.collectionTypes}</td>
                        <td className="border px-4 py-2">{orphanedRecords.orphanedCounts.collectionTypes}</td>
                        <td className="border px-4 py-2">{orphanedRecords.orphanedPercentages.collectionTypes.toFixed(2)}%</td>
                      </tr>
                      <tr>
                        <td className="border px-4 py-2">Manufacturers</td>
                        <td className="border px-4 py-2">{orphanedRecords.totalCounts.manufacturers}</td>
                        <td className="border px-4 py-2">{orphanedRecords.orphanedCounts.manufacturers}</td>
                        <td className="border px-4 py-2">{orphanedRecords.orphanedPercentages.manufacturers.toFixed(2)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Orphaned Records Details</h3>
                  
                  <div className="mb-4">
                    <h4 className="font-medium">Editions ({orphanedRecords.orphanedRecords.editions.length})</h4>
                    <div className="max-h-32 overflow-y-auto">
                      {orphanedRecords.orphanedRecords.editions.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {orphanedRecords.orphanedRecords.editions.map((name: string) => (
                            <li key={name}>{name}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No orphaned records</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium">Factions ({orphanedRecords.orphanedRecords.factions.length})</h4>
                    <div className="max-h-32 overflow-y-auto">
                      {orphanedRecords.orphanedRecords.factions.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {orphanedRecords.orphanedRecords.factions.map((name: string) => (
                            <li key={name}>{name}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No orphaned records</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium">Franchises ({orphanedRecords.orphanedRecords.franchises.length})</h4>
                    <div className="max-h-32 overflow-y-auto">
                      {orphanedRecords.orphanedRecords.franchises.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {orphanedRecords.orphanedRecords.franchises.map((name: string) => (
                            <li key={name}>{name}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No orphaned records</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Database Cleanup Section */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Database Cleanup</h2>
          
          {error.cleanup && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
              {error.cleanup}
            </div>
          )}
          
          {cleanupResult && (
            <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">
              <h3 className="font-medium mb-2">Cleanup Results:</h3>
              <ul className="list-disc pl-5">
                {cleanupResult.actions.map((action: string, index: number) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Legacy Collections</h3>
              <button
                onClick={() => performCleanup('remove_legacy_collections')}
                disabled={loading.cleanup}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 mr-2"
              >
                Remove Legacy Collections
              </button>
              <p className="mt-2 text-sm text-gray-600">Removes starshipv3 and starshipv4 collections if they exist</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">ID Mapping Collection</h3>
              <button
                onClick={() => performCleanup('remove_mapping_collection')}
                disabled={loading.cleanup}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 mr-2"
              >
                Remove ID Mapping Collection
              </button>
              <p className="mt-2 text-sm text-gray-600">Removes the starshipIdMapping collection if it exists</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Orphaned Records</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  onClick={() => performCleanup('remove_orphaned_editions')}
                  disabled={loading.cleanup}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
                >
                  Remove Orphaned Editions
                </button>
                <button
                  onClick={() => performCleanup('remove_orphaned_factions')}
                  disabled={loading.cleanup}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
                >
                  Remove Orphaned Factions
                </button>
                <button
                  onClick={() => performCleanup('remove_orphaned_franchises')}
                  disabled={loading.cleanup}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
                >
                  Remove Orphaned Franchises
                </button>
                <button
                  onClick={() => performCleanup('remove_orphaned_collection_types')}
                  disabled={loading.cleanup}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
                >
                  Remove Orphaned Collection Types
                </button>
                <button
                  onClick={() => performCleanup('remove_orphaned_manufacturers')}
                  disabled={loading.cleanup}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
                >
                  Remove Orphaned Manufacturers
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600">Removes records that are not referenced by any starship</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 