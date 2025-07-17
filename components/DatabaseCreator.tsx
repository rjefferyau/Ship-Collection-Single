import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDatabase,
  faPlus,
  faSpinner,
  faCheckCircle,
  faExclamationTriangle,
  faTimes,
  faDownload,
  faUpload,
  faCloudDownload,
  faServer
} from '@fortawesome/free-solid-svg-icons';

interface Backup {
  filename: string;
  created: string;
  size: string;
  timestamp: string;
}

interface DatabaseCreationResult {
  success: boolean;
  database?: {
    id: string;
    name: string;
    uri: string;
    description: string;
  };
  error?: string;
}

const DatabaseCreator: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [availableBackups, setAvailableBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    selectedBackup: '',
    databaseId: '',
    databaseName: '',
    databaseUri: '',
    description: ''
  });

  useEffect(() => {
    loadAvailableBackups();
  }, []);

  const loadAvailableBackups = async () => {
    try {
      const response = await fetch('/api/backups');
      if (response.ok) {
        const data = await response.json();
        setAvailableBackups(data.backups || []);
      } else {
        console.error('Failed to load backups');
      }
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  };

  const clearMessages = () => {
    setSuccess(null);
    setError(null);
    setProgress(null);
  };

  const testDatabaseConnection = async (uri: string) => {
    if (!uri.trim()) {
      setError('Please enter a database URI');
      return false;
    }

    setTesting(true);
    setError(null);

    try {
      const response = await fetch('/api/database-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', uri })
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('✅ Database connection successful');
        setTimeout(() => setSuccess(null), 3000);
        return true;
      } else {
        setError(result.error || 'Connection test failed');
        return false;
      }
    } catch (error) {
      setError('Failed to test database connection');
      return false;
    } finally {
      setTesting(false);
    }
  };

  const createDatabaseFromBackup = async () => {
    const { selectedBackup, databaseId, databaseName, databaseUri, description } = formData;

    // Validation
    if (!selectedBackup) {
      setError('Please select a backup file');
      return;
    }
    if (!databaseId.trim()) {
      setError('Please enter a database ID');
      return;
    }
    if (!databaseName.trim()) {
      setError('Please enter a database name');
      return;
    }
    if (!databaseUri.trim()) {
      setError('Please enter a database URI');
      return;
    }

    setCreating(true);
    setError(null);
    setProgress('Starting database creation...');

    try {
      const response = await fetch('/api/create-database-from-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupFile: selectedBackup,
          databaseId,
          databaseName,
          databaseUri,
          description
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`✅ Database '${databaseName}' created successfully!`);
        setProgress(null);
        setFormData({
          selectedBackup: '',
          databaseId: '',
          databaseName: '',
          databaseUri: '',
          description: ''
        });
        setShowCreateForm(false);
      } else {
        setError(result.error || 'Failed to create database');
        setProgress(null);
      }
    } catch (error) {
      setError('An error occurred while creating the database');
      setProgress(null);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      selectedBackup: '',
      databaseId: '',
      databaseName: '',
      databaseUri: '',
      description: ''
    });
    setShowCreateForm(false);
    clearMessages();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FontAwesomeIcon icon={faServer} className="text-blue-600 text-2xl mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Create Database from Backup</h2>
            <p className="text-sm text-gray-600">Create new databases by restoring from backup files</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Create Database
        </button>
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

      {progress && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500 mr-2" />
            <p className="text-sm text-blue-700">{progress}</p>
          </div>
        </div>
      )}

      {/* Create Database Form */}
      {showCreateForm && (
        <div className="mb-6 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Create New Database</h3>
          
          <div className="space-y-4">
            {/* Backup Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Backup <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.selectedBackup}
                onChange={(e) => setFormData({ ...formData, selectedBackup: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a backup file...</option>
                {availableBackups.map((backup) => (
                  <option key={backup.filename} value={backup.filename}>
                    {backup.filename} - {backup.created} ({backup.size})
                  </option>
                ))}
              </select>
              {availableBackups.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">No backup files available</p>
              )}
            </div>

            {/* Database Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.databaseId}
                  onChange={(e) => setFormData({ ...formData, databaseId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., test-db, backup-db"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.databaseName}
                  onChange={(e) => setFormData({ ...formData, databaseName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Test Database"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Database URI <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={formData.databaseUri}
                  onChange={(e) => setFormData({ ...formData, databaseUri: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="mongodb://localhost:27017/database-name"
                />
                <button
                  onClick={() => testDatabaseConnection(formData.databaseUri)}
                  disabled={testing || !formData.databaseUri}
                  className="px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  {testing ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    'Test'
                  )}
                </button>
              </div>
            </div>

            <div>
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

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              onClick={resetForm}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faTimes} className="mr-2" />
              Cancel
            </button>
            <button
              onClick={createDatabaseFromBackup}
              disabled={creating || !formData.selectedBackup || !formData.databaseId || !formData.databaseName || !formData.databaseUri}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {creating ? (
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              ) : (
                <FontAwesomeIcon icon={faDatabase} className="mr-2" />
              )}
              Create Database
            </button>
          </div>
        </div>
      )}

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Database Creation Information</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Select a backup file to restore from your available backups</li>
          <li>• Provide a unique database ID and descriptive name</li>
          <li>• Test the database connection before creating</li>
          <li>• Created databases will be added to your configuration automatically</li>
          <li>• You can switch between databases using the Database Configuration tool</li>
        </ul>
      </div>
    </div>
  );
};

export default DatabaseCreator; 