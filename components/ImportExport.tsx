import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileImport, faFileExport } from '@fortawesome/free-solid-svg-icons';
import CsvUpload from './CsvUpload';

interface ImportExportProps {
  onDataChange?: () => void;
}

const ImportExport: React.FC<ImportExportProps> = ({ onDataChange }) => {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExportSuccess(null);
      setExportError(null);
      setIsExporting(true);
      
      const response = await fetch(`/api/export?format=${exportFormat}`);
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `starship-collection.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setExportSuccess(`Data exported successfully as ${exportFormat.toUpperCase()}`);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FontAwesomeIcon icon={faFileExport} className="mr-2 text-gray-600" />
            Export Collection
          </h3>
        </div>
        <div className="p-4">
          {exportSuccess && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{exportSuccess}</p>
                </div>
              </div>
            </div>
          )}
          
          {exportError && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{exportError}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Export Format
            </label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  id="format-json"
                  name="export-format"
                  type="radio"
                  checked={exportFormat === 'json'}
                  onChange={() => setExportFormat('json')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="format-json" className="ml-2 block text-sm text-gray-700">
                  JSON
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="format-csv"
                  name="export-format"
                  type="radio"
                  checked={exportFormat === 'csv'}
                  onChange={() => setExportFormat('csv')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="format-csv" className="ml-2 block text-sm text-gray-700">
                  CSV
                </label>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Export your entire collectibles data to a file that you can back up or import later.
            </p>
          </div>
          
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isExporting
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faFileExport} className="mr-2" />
                Export as {exportFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
      
      <div>
        <CsvUpload onUploadComplete={() => onDataChange && onDataChange()} />
      </div>
    </div>
  );
};

export default ImportExport; 