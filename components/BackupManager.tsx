import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload, 
  faUpload, 
  faTrash, 
  faSpinner,
  faDatabase,
  faCheckCircle,
  faExclamationTriangle,
  faSync,
  faCog
} from '@fortawesome/free-solid-svg-icons';
import DatabaseConfig from './DatabaseConfig';

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

interface DatabaseConfigType {
  current: string;
  databases: {
    [key: string]: {
      name: string;
      uri: string;
      description: string;
    };
  };
}

const BackupManager: React.FC = () => {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // File backup state
  const [isCreatingFileBackup, setIsCreatingFileBackup] = useState(false);
  const [fileBackupProgress, setFileBackupProgress] = useState<string[]>([]);
  const [isRestoringFiles, setIsRestoringFiles] = useState(false);
  const [fileRestoreProgress, setFileRestoreProgress] = useState<string[]>([]);
  const [showFileRestoreModal, setShowFileRestoreModal] = useState(false);
  const [selectedFileBackup, setSelectedFileBackup] = useState<BackupFile | null>(null);
  
  // Database configuration state
  const [databaseConfig, setDatabaseConfig] = useState<DatabaseConfigType | null>(null);
  const [showDatabaseConfig, setShowDatabaseConfig] = useState(false);
  
  // Restore functionality state
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null);
  const [selectedTargetDatabase, setSelectedTargetDatabase] = useState<string>('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<string[]>([]);

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

  const startRestore = async (backup: BackupFile) => {
    setSelectedBackup(backup);
    setSelectedTargetDatabase(databaseConfig?.current || '');
    setShowRestoreModal(true);
  };

  const performRestore = async () => {
    if (!selectedBackup || !selectedTargetDatabase || !databaseConfig) {
      setError('Please select a backup and target database');
      return;
    }

    const targetUri = databaseConfig.databases[selectedTargetDatabase]?.uri;
    if (!targetUri) {
      setError('Invalid target database selected');
      return;
    }

    setIsRestoring(true);
    setRestoreProgress([]);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupFilename: selectedBackup.filename,
          targetDatabaseUri: targetUri
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start restore');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Unable to read restore response');
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
                  setRestoreProgress(prev => [...prev, data.message]);
                } else if (data.type === 'error') {
                  setRestoreProgress(prev => [...prev, `ERROR: ${data.message}`]);
                } else if (data.type === 'complete') {
                  if (data.success) {
                    setSuccess(`Restore completed successfully to ${databaseConfig.databases[selectedTargetDatabase].name}!`);
                  } else {
                    setError(`Restore failed: ${data.message}`);
                  }
                }
              } catch (parseError) {
                console.error('Error parsing restore response:', parseError);
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed');
    } finally {
      setIsRestoring(false);
      setShowRestoreModal(false);
    }
  };

  const handleDatabaseConfigChange = (config: DatabaseConfigType) => {
    setDatabaseConfig(config);
  };

  const createFileBackup = async () => {
    setIsCreatingFileBackup(true);
    setFileBackupProgress([]);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/backup-files', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to start file backup');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Unable to read file backup response');
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
                  setFileBackupProgress(prev => [...prev, data.message]);
                } else if (data.type === 'error') {
                  setFileBackupProgress(prev => [...prev, `ERROR: ${data.message}`]);
                } else if (data.type === 'complete') {
                  if (data.success) {
                    setSuccess(`File backup completed successfully! ${data.stats?.totalFiles || ''} files backed up.`);
                    loadBackups(); // Refresh backup list
                  } else {
                    setError(`File backup failed: ${data.message}`);
                  }
                }
              } catch (parseError) {
                console.error('Error parsing file backup response:', parseError);
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'File backup failed');
    } finally {
      setIsCreatingFileBackup(false);
    }
  };

  const restoreFileBackup = async () => {
    if (!selectedFileBackup) {
      setError('No file backup selected');
      return;
    }

    setIsRestoringFiles(true);
    setFileRestoreProgress([]);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/restore-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupFilename: selectedFileBackup.filename
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start file restore');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Unable to read file restore response');
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
                  setFileRestoreProgress(prev => [...prev, data.message]);
                } else if (data.type === 'error') {
                  setFileRestoreProgress(prev => [...prev, `ERROR: ${data.message}`]);
                } else if (data.type === 'complete') {
                  if (data.success) {
                    setSuccess(`File restore completed successfully! ${data.result?.restoredFiles || ''} files restored.`);
                  } else {
                    setError(`File restore failed: ${data.message}`);
                  }
                }
              } catch (parseError) {
                console.error('Error parsing file restore response:', parseError);
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'File restore failed');
    } finally {
      setIsRestoringFiles(false);
      setShowFileRestoreModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Database Configuration Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCog} className="text-gray-600 text-xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Database Configuration</h3>
            {databaseConfig && (
              <span className="ml-4 text-sm text-gray-600">
                Current: {databaseConfig.databases[databaseConfig.current]?.name || 'Unknown'}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowDatabaseConfig(!showDatabaseConfig)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faCog} className="mr-2" />
            {showDatabaseConfig ? 'Hide Config' : 'Show Config'}
          </button>
        </div>
        
        {showDatabaseConfig && (
          <DatabaseConfig onDatabaseChange={handleDatabaseConfigChange} />
        )}
      </div>

      {/* File Backup Management Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faUpload} className="text-green-600 text-2xl mr-3" />
            <h2 className="text-xl font-semibold text-gray-800">File Backup Management</h2>
            <span className="ml-4 text-sm text-gray-600">(Images, Magazines, etc.)</span>
          </div>
          <button
            onClick={createFileBackup}
            disabled={isCreatingFileBackup}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingFileBackup ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                Creating File Backup...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                Create File Backup
              </>
            )}
          </button>
        </div>

        {/* File Backup Progress Display */}
        {isCreatingFileBackup && fileBackupProgress.length > 0 && (
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">File Backup Progress:</h3>
            <div className="max-h-48 overflow-y-auto">
              {fileBackupProgress.map((message, index) => (
                <div key={index} className="text-xs text-gray-600 font-mono">
                  {message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Restore Progress Display */}
        {isRestoringFiles && fileRestoreProgress.length > 0 && (
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">File Restore Progress:</h3>
            <div className="max-h-48 overflow-y-auto">
              {fileRestoreProgress.map((message, index) => (
                <div key={index} className="text-xs text-gray-600 font-mono">
                  {message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Database Backup Management Section */}
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
                      <div className="flex items-center">
                        {backup.filename.startsWith('files-backup-') ? (
                          <FontAwesomeIcon icon={faUpload} className="text-green-600 mr-2" />
                        ) : (
                          <FontAwesomeIcon icon={faDatabase} className="text-blue-600 mr-2" />
                        )}
                        {backup.filename}
                      </div>
                      {backup.filename.startsWith('files-backup-') && (
                        <span className="text-xs text-green-600">File Backup</span>
                      )}
                      {backup.filename.startsWith('backup-') && !backup.filename.startsWith('files-backup-') && (
                        <span className="text-xs text-blue-600">Database + Files</span>
                      )}
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
                          onClick={() => {
                            if (backup.filename.startsWith('files-backup-')) {
                              setSelectedFileBackup(backup);
                              setShowFileRestoreModal(true);
                            } else {
                              startRestore(backup);
                            }
                          }}
                          className="text-green-600 hover:text-green-900 p-1"
                          title={backup.filename.startsWith('files-backup-') ? "Restore files" : "Restore database"}
                          disabled={!backup.filename.startsWith('files-backup-') && !databaseConfig}
                        >
                          <FontAwesomeIcon icon={faSync} />
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
          <li>• Use database configuration to switch between different databases</li>
          <li>• Restore backups to any configured database using the restore button</li>
        </ul>
      </div>
      </div>

      {/* Restore Modal */}
      {showRestoreModal && selectedBackup && databaseConfig && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Restore Backup</h3>
              <p className="text-sm text-gray-600 mb-4">
                Restore backup "{selectedBackup.filename}" to a target database
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Database
                </label>
                <select
                  value={selectedTargetDatabase}
                  onChange={(e) => setSelectedTargetDatabase(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(databaseConfig.databases).map(([id, db]) => (
                    <option key={id} value={id}>
                      {db.name} ({id})
                    </option>
                  ))}
                </select>
              </div>

              {restoreProgress.length > 0 && (
                <div className="mb-4 bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {restoreProgress.map((message, index) => (
                    <div key={index} className="text-xs text-gray-600 font-mono">
                      {message}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowRestoreModal(false)}
                  disabled={isRestoring}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={performRestore}
                  disabled={isRestoring || !selectedTargetDatabase}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isRestoring ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                      Restoring...
                    </>
                  ) : (
                    'Restore'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Restore Modal */}
      {showFileRestoreModal && selectedFileBackup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <FontAwesomeIcon icon={faUpload} className="text-green-600 text-xl mr-3" />
                <h3 className="text-lg font-medium text-gray-900">
                  Restore File Backup
                </h3>
              </div>
              
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-700 font-medium">Warning</p>
                    <p className="text-sm text-yellow-600">
                      This will replace your current files (images, magazines, etc.). 
                      Existing files will be backed up first.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <strong>File Backup:</strong> {selectedFileBackup.filename}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Created:</strong> {formatDate(selectedFileBackup.created)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Size:</strong> {selectedFileBackup.size}
                </p>
              </div>

              {fileRestoreProgress.length > 0 && (
                <div className="mb-4 bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {fileRestoreProgress.map((message, index) => (
                    <div key={index} className="text-xs text-gray-600 font-mono">
                      {message}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowFileRestoreModal(false)}
                  disabled={isRestoringFiles}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={restoreFileBackup}
                  disabled={isRestoringFiles}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isRestoringFiles ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                      Restoring Files...
                    </>
                  ) : (
                    'Restore Files'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupManager;