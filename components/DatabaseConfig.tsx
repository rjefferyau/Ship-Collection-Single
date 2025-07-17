import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDatabase, 
  faPlus, 
  faTrash, 
  faCheck, 
  faTimes,
  faSpinner,
  faExclamationTriangle,
  faCheckCircle,
  faSync
} from '@fortawesome/free-solid-svg-icons';

interface DatabaseConfig {
  current: string;
  databases: {
    [key: string]: {
      name: string;
      uri: string;
      description: string;
    };
  };
}

interface DatabaseConfigProps {
  onDatabaseChange?: (config: DatabaseConfig) => void;
}

const DatabaseConfig: React.FC<DatabaseConfigProps> = ({ onDatabaseChange }) => {
  const [config, setConfig] = useState<DatabaseConfig>({
    current: 'primary',
    databases: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    uri: '',
    description: ''
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/database-config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        if (onDatabaseChange) {
          onDatabaseChange(data.config);
        }
      } else {
        setError('Failed to load database configuration');
      }
    } catch (err) {
      setError('Error loading database configuration');
    } finally {
      setLoading(false);
    }
  };

  const addDatabase = async () => {
    if (!formData.id || !formData.name || !formData.uri) {
      setError('ID, name, and URI are required');
      return;
    }

    try {
      const response = await fetch('/api/database-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          ...formData
        })
      });

      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
        setSuccess(data.message);
        setShowAddForm(false);
        setFormData({ id: '', name: '', uri: '', description: '' });
        if (onDatabaseChange) {
          onDatabaseChange(data.config);
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error adding database configuration');
    }
  };

  const switchDatabase = async (databaseId: string) => {
    try {
      const response = await fetch('/api/database-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'switch',
          databaseId
        })
      });

      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
        setSuccess(data.message);
        if (onDatabaseChange) {
          onDatabaseChange(data.config);
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error switching database');
    }
  };

  const removeDatabase = async (databaseId: string) => {
    if (!confirm(`Are you sure you want to remove the database configuration "${config.databases[databaseId]?.name}"?`)) {
      return;
    }

    try {
      const response = await fetch('/api/database-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          databaseId
        })
      });

      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
        setSuccess(data.message);
        if (onDatabaseChange) {
          onDatabaseChange(data.config);
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error removing database configuration');
    }
  };

  const testConnection = async (uri: string, databaseId?: string) => {
    setTesting(databaseId || 'new');
    try {
      const response = await fetch('/api/database-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          uri
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`Connection test successful: ${data.message}`);
      } else {
        setError(`Connection test failed: ${data.message}`);
      }
    } catch (err) {
      setError('Error testing database connection');
    } finally {
      setTesting(null);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin className="text-gray-400 text-2xl" />
          <p className="text-gray-500 mt-2">Loading database configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FontAwesomeIcon icon={faDatabase} className="text-blue-600 text-2xl mr-3" />
          <h2 className="text-xl font-semibold text-gray-800">Database Configuration</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadConfig}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faSync} className="mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add Database
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex justify-between items-center">
            <div className="flex">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2 mt-0.5" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
            <button onClick={clearMessages} className="text-green-500 hover:text-green-700">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex justify-between items-center">
            <div className="flex">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-2 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={clearMessages} className="text-red-500 hover:text-red-700">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
      )}

      {/* Add Database Form */}
      {showAddForm && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Database</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Database ID
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., backup-db, test-db"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Backup Database"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MongoDB URI
              </label>
              <input
                type="text"
                value={formData.uri}
                onChange={(e) => setFormData({ ...formData, uri: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="mongodb://localhost:27017/database-name"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of this database"
              />
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 mt-4">
            <button
              onClick={() => testConnection(formData.uri)}
              disabled={!formData.uri || testing === 'new'}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {testing === 'new' ? (
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              ) : (
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
              )}
              Test Connection
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setFormData({ id: '', name: '', uri: '', description: '' });
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faTimes} className="mr-2" />
              Cancel
            </button>
            <button
              onClick={addDatabase}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add Database
            </button>
          </div>
        </div>
      )}

      {/* Database List */}
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-4">Configured Databases</h3>
        
        {Object.keys(config.databases).length === 0 ? (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faDatabase} className="text-gray-400 text-3xl mb-2" />
            <p className="text-gray-500">No databases configured. Add one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(config.databases).map(([id, db]) => (
              <div
                key={id}
                className={`border rounded-lg p-4 ${
                  config.current === id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <h4 className="text-lg font-medium text-gray-800">{db.name}</h4>
                      {config.current === id && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">URI:</span> {db.uri}
                    </p>
                    {db.description && (
                      <p className="text-sm text-gray-500">{db.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => testConnection(db.uri, id)}
                      disabled={testing === id}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Test connection"
                    >
                      {testing === id ? (
                        <FontAwesomeIcon icon={faSpinner} spin />
                      ) : (
                        <FontAwesomeIcon icon={faCheck} />
                      )}
                    </button>
                    {config.current !== id && (
                      <button
                        onClick={() => switchDatabase(id)}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="Switch to this database"
                      >
                        <FontAwesomeIcon icon={faSync} />
                      </button>
                    )}
                    {id !== 'primary' && (
                      <button
                        onClick={() => removeDatabase(id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Remove database"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Database Configuration Information</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Each database configuration stores connection details for MongoDB databases</li>
          <li>• Switch between databases to work with different collections</li>
          <li>• The primary database cannot be removed but can be reconfigured</li>
          <li>• Test connections before adding to ensure they work properly</li>
          <li>• Changes take effect immediately when switching databases</li>
        </ul>
      </div>
    </div>
  );
};

export default DatabaseConfig;
