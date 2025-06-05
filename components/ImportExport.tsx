import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExport, faFileImport, faDownload } from '@fortawesome/free-solid-svg-icons';
import CsvUpload from './CsvUpload';

interface ImportExportProps {
  onDataChange?: () => void;
  onSelectionChange?: (editionId: string, franchise: string, editionName: string) => void;
}

interface Edition {
  _id: string;
  name: string;
  internalName: string;
  franchise: string;
}

interface Franchise {
  _id: string;
  name: string;
  description?: string;
}

const ImportExport: React.FC<ImportExportProps> = ({ onDataChange, onSelectionChange }) => {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [selectedFranchise, setSelectedFranchise] = useState<string>('');
  const [selectedEdition, setSelectedEdition] = useState<string>('');
  const [isLoadingEditions, setIsLoadingEditions] = useState(false);
  const [isLoadingFranchises, setIsLoadingFranchises] = useState(false);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);

  useEffect(() => {
    fetchFranchises();
  }, []);

  useEffect(() => {
    if (selectedFranchise) {
      fetchEditions();
    } else {
      setEditions([]);
      setSelectedEdition('');
    }
  }, [selectedFranchise]);

  // Notify parent when selections change
  useEffect(() => {
    if (onSelectionChange) {
      const selectedEditionObj = editions.find(e => e._id === selectedEdition);
      const editionName = selectedEditionObj ? selectedEditionObj.name : '';
      onSelectionChange(selectedEdition, selectedFranchise, editionName);
    }
  }, [selectedEdition, selectedFranchise, editions, onSelectionChange]);

  const fetchFranchises = async () => {
    try {
      setIsLoadingFranchises(true);
      const response = await fetch('/api/franchises');
      const data = await response.json();
      if (data.success) {
        setFranchises(data.data);
        // Auto-select Star Trek as default
        if (data.data.length > 0) {
          const starTrek = data.data.find((f: Franchise) => f.name === 'Star Trek');
          if (starTrek) {
            setSelectedFranchise(starTrek.name);
          } else {
            setSelectedFranchise(data.data[0].name);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching franchises:', error);
    } finally {
      setIsLoadingFranchises(false);
    }
  };

  const fetchEditions = async () => {
    if (!selectedFranchise) return;
    
    try {
      setIsLoadingEditions(true);
      const response = await fetch(`/api/editions?franchise=${encodeURIComponent(selectedFranchise)}`);
      const data = await response.json();
      if (data.success) {
        setEditions(data.data);
        // Reset selected edition when franchise changes
        setSelectedEdition('');
      }
    } catch (error) {
      console.error('Error fetching editions:', error);
    } finally {
      setIsLoadingEditions(false);
    }
  };

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

  const handleDownloadTemplate = async () => {
    if (!selectedFranchise) {
      setExportError('Please select a franchise first');
      return;
    }
    
    if (!selectedEdition) {
      setExportError('Please select an edition first');
      return;
    }

    try {
      setIsGeneratingTemplate(true);
      setExportError(null);
      
      const response = await fetch(`/api/editions/template-csv?editionId=${selectedEdition}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate template');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get edition name for filename
      const selectedEditionObj = editions.find(e => e._id === selectedEdition);
      const filename = selectedEditionObj 
        ? `${selectedFranchise}-${selectedEditionObj.name}-template.csv`
        : 'template.csv';
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setExportSuccess(`Template for ${selectedFranchise} ${selectedEditionObj?.name} downloaded successfully`);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsGeneratingTemplate(false);
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
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export Collection'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FontAwesomeIcon icon={faFileImport} className="mr-2 text-gray-600" />
            Import Collection
          </h3>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Franchise
            </label>
            <select
              value={selectedFranchise}
              onChange={(e) => setSelectedFranchise(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              disabled={isLoadingFranchises}
            >
              <option value="">Select a franchise</option>
              {franchises.map((franchise) => (
                <option key={franchise._id} value={franchise.name}>
                  {franchise.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Edition for Template
            </label>
            <select
              value={selectedEdition}
              onChange={(e) => setSelectedEdition(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              disabled={isLoadingEditions || !selectedFranchise}
            >
              <option value="">
                {!selectedFranchise ? 'Select a franchise first' : 'Select an edition'}
              </option>
              {editions.map((edition) => (
                <option key={edition._id} value={edition._id}>
                  {edition.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              First select a franchise, then select an edition to download a template CSV file. The template includes example entries pre-configured for that franchise and edition that you can modify and then import back.
            </p>
          </div>

          <button
            onClick={handleDownloadTemplate}
            disabled={!selectedFranchise || !selectedEdition || isGeneratingTemplate}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faDownload} className="mr-2" />
            {isGeneratingTemplate ? 'Generating Template...' : 'Download Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportExport; 