import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faFileAlt, faDownload, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface CsvUploadProps {
  onUploadComplete?: () => void;
  selectedEdition?: string;
  selectedFranchise?: string;
}

const CsvUpload: React.FC<CsvUploadProps> = ({ onUploadComplete, selectedEdition, selectedFranchise }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv') {
        setError('Please select a CSV file');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!selectedEdition) {
      setError('Please select an edition first');
      return;
    }

    if (!selectedFranchise) {
      setError('Please select a franchise first');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadStatus('Uploading and processing CSV...');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('editionId', selectedEdition);
      formData.append('franchise', selectedFranchise);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadStatus(`Successfully imported ${data.imported} ships`);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        setError(data.error || 'Failed to import CSV');
      }
    } catch (err) {
      setError('Error uploading or processing the CSV file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'Issue,Edition,Ship Name,Race/Faction,Release Date,Image,owned\n1,Regular,USS Enterprise,Federation,2020-01-01,,true\n2,Special,Klingon Bird of Prey,Klingon,2020-02-01,,false';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'starship-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="mt-4">
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload CSV File
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <FontAwesomeIcon icon={faUpload} className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    disabled={isUploading}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                CSV files only
              </p>
            </div>
          </div>
        </div>

        {selectedFile && (
          <div className="text-sm text-gray-600">
            Selected file: {selectedFile.name}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        {uploadStatus && (
          <div className="text-sm text-green-600">
            {uploadStatus}
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedFile || !selectedEdition || !selectedFranchise || isUploading}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            'Upload CSV'
          )}
        </button>
      </form>
    </div>
  );
};

export default CsvUpload; 