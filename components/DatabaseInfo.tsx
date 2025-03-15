import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDatabase, faServer, faTable, faShip, 
  faUsers, faBookOpen, faHeart, faStar, 
  faRefresh, faCircleInfo, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import DatabaseFix from './DatabaseFix';

interface CollectionDetail {
  name: string;
  documentCount: number;
  size: number;
  avgDocumentSize: number;
}

interface ConnectionInfo {
  host: string;
  port: number;
  name: string;
  readyState: number;
  readyStateText: string;
  models: string[];
}

interface Statistics {
  starships: {
    total: number;
    owned: number;
    wishlist: number;
  };
  editions: number;
  factions: number;
}

interface DbStats {
  dataSize: number;
  storageSize: number;
  indexSize: number;
  totalSize: number;
  avgObjSize: number;
}

interface DatabaseInfoData {
  connectionInfo: ConnectionInfo;
  collections: CollectionDetail[];
  statistics: Statistics;
  dbStats: DbStats;
}

const DatabaseInfo: React.FC = () => {
  const [data, setData] = useState<DatabaseInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchDatabaseInfo();
  }, [refreshKey]);

  const fetchDatabaseInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/database-info');
      
      if (!response.ok) {
        throw new Error('Failed to fetch database information');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Unknown error');
      }
      
      setData(result.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error fetching database info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Format bytes to human-readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-lg">Loading database information...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading database information</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FontAwesomeIcon icon={faRefresh} className="mr-2" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FontAwesomeIcon icon={faCircleInfo} className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">No database information available</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Unable to retrieve database information. Please try again.</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <FontAwesomeIcon icon={faRefresh} className="mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { connectionInfo, collections, statistics, dbStats } = data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          <FontAwesomeIcon icon={faDatabase} className="mr-2 text-indigo-600" />
          Database Information
        </h2>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FontAwesomeIcon icon={faRefresh} className="mr-2" />
          Refresh
        </button>
      </div>

      {/* Connection Information */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-indigo-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            <FontAwesomeIcon icon={faServer} className="mr-2 text-indigo-600" />
            Connection Information
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Details about your MongoDB connection.
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Database Host</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{connectionInfo.host}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Database Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{connectionInfo.name}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Connection Status</dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  connectionInfo.readyState === 1 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {connectionInfo.readyStateText}
                </span>
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Available Models</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {connectionInfo.models.map((model) => (
                    <span key={model} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
                      {model}
                    </span>
                  ))}
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Collection Statistics */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-indigo-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            <FontAwesomeIcon icon={faTable} className="mr-2 text-indigo-600" />
            Collection Statistics
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Information about your database collections.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collection Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Document Size
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {collections.map((collection) => (
                <tr key={collection.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {collection.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {collection.documentCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBytes(collection.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBytes(collection.avgDocumentSize)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Content Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Starships */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-indigo-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              <FontAwesomeIcon icon={faShip} className="mr-2 text-indigo-600" />
              Starships
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Total</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{statistics.starships.total}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Owned</dt>
                <dd className="mt-1 text-2xl font-semibold text-green-600">
                  {statistics.starships.owned}
                  <span className="text-sm text-gray-500 ml-2">
                    ({statistics.starships.total > 0 
                      ? Math.round((statistics.starships.owned / statistics.starships.total) * 100) 
                      : 0}%)
                  </span>
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Wishlist</dt>
                <dd className="mt-1 text-2xl font-semibold text-indigo-600">
                  {statistics.starships.wishlist}
                  <span className="text-sm text-gray-500 ml-2">
                    ({statistics.starships.total > 0 
                      ? Math.round((statistics.starships.wishlist / statistics.starships.total) * 100) 
                      : 0}%)
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Factions */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-indigo-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              <FontAwesomeIcon icon={faUsers} className="mr-2 text-indigo-600" />
              Factions
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Total Factions</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{statistics.factions}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Avg Ships per Faction</dt>
                <dd className="mt-1 text-2xl font-semibold text-indigo-600">
                  {statistics.factions > 0 
                    ? (statistics.starships.total / statistics.factions).toFixed(1) 
                    : 0}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Editions */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-indigo-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              <FontAwesomeIcon icon={faBookOpen} className="mr-2 text-indigo-600" />
              Editions
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Total Editions</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{statistics.editions}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Avg Ships per Edition</dt>
                <dd className="mt-1 text-2xl font-semibold text-indigo-600">
                  {statistics.editions > 0 
                    ? (statistics.starships.total / statistics.editions).toFixed(1) 
                    : 0}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Database Storage */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-indigo-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            <FontAwesomeIcon icon={faDatabase} className="mr-2 text-indigo-600" />
            Database Storage
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Information about database storage usage.
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Data Size</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatBytes(dbStats.dataSize)}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Storage Size</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatBytes(dbStats.storageSize)}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Index Size</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatBytes(dbStats.indexSize)}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Size</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatBytes(dbStats.totalSize)}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Average Object Size</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatBytes(dbStats.avgObjSize)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Database Fix Section */}
      <DatabaseFix />
    </div>
  );
};

export default DatabaseInfo; 