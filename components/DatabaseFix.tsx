import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDatabase, 
  faSpinner, 
  faCheck, 
  faTimes, 
  faExclamationTriangle,
  faWrench,
  faTrash
} from '@fortawesome/free-solid-svg-icons';

interface FixResults {
  totalStarships: number;
  processed: number;
  successful: number;
  failed: number;
  idMappingsSample: { oldId: string; newId: string }[];
}

interface DeleteResults {
  v3Deleted: boolean;
  v4Deleted: boolean;
  v3Count?: number;
  v4Count?: number;
}

const DatabaseFix: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<FixResults | null>(null);
  const [deleteResults, setDeleteResults] = useState<DeleteResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleFixDatabase = async () => {
    setIsProcessing(true);
    setError(null);
    setResults(null);
    
    try {
      const response = await fetch('/api/database-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix database');
      }
      
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
      setShowConfirmation(false);
    }
  };

  const handleUpdateStarshipModel = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/update-starship-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update Starship model');
      }
      
      alert('Starship model updated successfully! Please restart the server for changes to take effect.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteOldCollections = async () => {
    setIsProcessing(true);
    setError(null);
    setDeleteResults(null);
    
    try {
      const response = await fetch('/api/delete-old-collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete old collections');
      }
      
      setDeleteResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirmation(false);
    }
  };

  return (
    <div className="space-y-6 mt-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          <FontAwesomeIcon icon={faWrench} className="mr-2 text-indigo-600" />
          Database Maintenance
        </h2>
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Warning:</strong> This utility will create new IDs for all starships in the database.
              It will create a new collection called <code>starshipv5</code> and a mapping collection called <code>starshipIdMapping</code>.
              This operation cannot be undone. Make sure you have a backup of your database before proceeding.
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FontAwesomeIcon icon={faTimes} className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {error}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Fix Database IDs</h2>
        <p className="mb-4">
          This will create new IDs for all starships while maintaining references to the original IDs.
          The operation will create a new collection called <code>starshipv5</code> with the fixed data.
        </p>
        
        {!showConfirmation ? (
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => setShowConfirmation(true)}
            disabled={isProcessing}
          >
            <FontAwesomeIcon icon={faDatabase} className="mr-2" />
            Fix Database IDs
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-sm text-red-700 mb-4">
              Are you sure you want to proceed? This operation cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={handleFixDatabase}
                disabled={isProcessing}
              >
                Yes, I'm sure
              </button>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowConfirmation(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {isProcessing && (
          <div className="mt-4 flex items-center text-indigo-600">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
            <span>Processing... This may take a while.</span>
          </div>
        )}
      </div>
      
      {results && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faCheck} className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Database fix operation completed successfully!
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm font-medium text-gray-500">Total Starships</div>
              <div className="mt-1 text-3xl font-semibold text-gray-900">{results.totalStarships}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm font-medium text-gray-500">Processed</div>
              <div className="mt-1 text-3xl font-semibold text-gray-900">{results.processed}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-md">
              <div className="text-sm font-medium text-green-600">Successful</div>
              <div className="mt-1 text-3xl font-semibold text-green-700">{results.successful}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-md">
              <div className="text-sm font-medium text-red-600">Failed</div>
              <div className="mt-1 text-3xl font-semibold text-red-700">{results.failed}</div>
            </div>
          </div>
          
          <h3 className="text-lg font-medium mb-2">ID Mapping Sample</h3>
          <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New ID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.idMappingsSample.map((mapping, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {mapping.oldId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {mapping.newId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Next Steps</h3>
            <p className="mb-4">
              Now that you have created the new collection with fixed IDs, you need to update the Starship model
              to use the new collection. Click the button below to update the model.
            </p>
            
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleUpdateStarshipModel}
              disabled={isProcessing}
            >
              <FontAwesomeIcon icon={faDatabase} className="mr-2" />
              Update Starship Model
            </button>
          </div>
        </div>
      )}

      {/* Delete Old Collections Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Delete Old Collections</h2>
        <p className="mb-4">
          After successfully migrating to the new <code>starshipv5</code> collection and verifying that everything is working correctly,
          you can delete the old <code>starshipv3</code> and <code>starshipv4</code> collections to free up space.
        </p>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Warning:</strong> This operation will permanently delete the old starship collections.
                Make sure you have verified that the migration was successful and all your data is accessible in the new collection.
              </p>
            </div>
          </div>
        </div>
        
        {!showDeleteConfirmation ? (
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={() => setShowDeleteConfirmation(true)}
            disabled={isProcessing}
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2" />
            Delete Old Collections
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-sm text-red-700 mb-4">
              Are you absolutely sure you want to delete the old starship collections? This operation cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={handleDeleteOldCollections}
                disabled={isProcessing}
              >
                Yes, delete them
              </button>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowDeleteConfirmation(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {deleteResults && (
          <div className="mt-4">
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faCheck} className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Old collections have been successfully deleted!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm font-medium text-gray-500">starshipv3 Collection</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {deleteResults.v3Deleted ? 
                    `Deleted (${deleteResults.v3Count || 0} documents)` : 
                    'Not found or already deleted'}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm font-medium text-gray-500">starshipv4 Collection</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {deleteResults.v4Deleted ? 
                    `Deleted (${deleteResults.v4Count || 0} documents)` : 
                    'Not found or already deleted'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseFix; 