import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload, 
  faUpload, 
  faTrash, 
  faSpinner,
  faDatabase,
  faCheckCircle,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

interface BackupFile {
  filename: string;
  created: string;
  size: string;
  path: string;
}

interface BackupStats {
  size: number;
  created: string;
  filename: string;
}

const BackupManager: React.FC = () => {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/backups');
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      } else {
        setError('Failed to load backup list');
      }
    } catch (err) {
      setError('Error loading backups');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    setBackupProgress([]);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start backup');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Unable to read backup response');
      }

      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'progress') {
                  setBackupProgress(prev => [...prev, data.message]);
                } else if (data.type === 'error') {
                  setBackupProgress(prev => [...prev, `ERROR: ${data.message}`]);
                } else if (data.type === 'complete') {
                  if (data.success) {
                    setSuccess(`Backup completed successfully! File: ${data.backupStats?.filename || 'Unknown'}`);
                    await loadBackups(); // Refresh backup list
                  } else {
                    setError(`Backup failed: ${data.message}`);
                  }
                }
              } catch (parseError) {
                console.error('Error parsing backup response:', parseError);
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backup failed');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const downloadBackup = (filename: string) => {
    const link = document.createElement('a');
    link.href = `/api/backups/download?filename=${encodeURIComponent(filename)}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete backup "${filename}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/backups', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      if (response.ok) {
        setSuccess(`Backup "${filename}" deleted successfully`);
        await loadBackups();
      } else {
        setError('Failed to delete backup');
      }
    } catch (err) {
      setError('Error deleting backup');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FontAwesomeIcon icon={faDatabase} className="text-blue-600 text-2xl mr-3" />
          <h2 className="text-xl font-semibold text-gray-800">Database Backup Management</h2>
        </div>
        <button
          onClick={createBackup}
          disabled={isCreatingBackup}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreatingBackup ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              Creating Backup...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Create Backup
            </>
          )}
        </button>
      </div>

      {/* Progress Display */}
      {isCreatingBackup && backupProgress.length > 0 && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Backup Progress:</h3>
          <div className="max-h-48 overflow-y-auto">
            {backupProgress.map((message, index) => (
              <div key={index} className="text-xs text-gray-600 font-mono">
                {message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-2 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Backup List */}
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-4">Available Backups</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faSpinner} spin className="text-gray-400 text-2xl" />
            <p className="text-gray-500 mt-2">Loading backups...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faDatabase} className="text-gray-400 text-3xl mb-2" />
            <p className="text-gray-500">No backups found. Create your first backup above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backups.map((backup) => (
                  <tr key={backup.filename} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {backup.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(backup.created)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {backup.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => downloadBackup(backup.filename)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Download backup"
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </button>
                        <button
                          onClick={() => deleteBackup(backup.filename)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete backup"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Backup Information</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Backups include all database collections and uploaded files</li>
          <li>• Backup files are compressed and stored in ZIP format</li>
          <li>• Use the restore functionality carefully as it will replace current data</li>
          <li>• Download backups to store them externally for additional safety</li>
        </ul>
      </div>
    </div>
  );
};

export default BackupManager;