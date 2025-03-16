import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFont, faSync } from '@fortawesome/free-solid-svg-icons';
import BaseModal from './BaseModal';

interface FixEditionNamesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FixEditionNamesModal: React.FC<FixEditionNamesModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFixEditionNames = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/update-starship-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix edition names');
      }
      
      setResult({
        success: true,
        message: data.message,
        stats: data.stats
      });
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'An unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Fix Edition Names"
      icon={<FontAwesomeIcon icon={faFont} className="text-yellow-600" />}
    >
      <div className="mt-2">
        <p className="text-sm text-gray-500">
          This tool will fix incorrect edition internal names that may cause starships to not appear in the correct franchise.
        </p>
      </div>
      
      <div className="mt-5">
        <button
          onClick={handleFixEditionNames}
          disabled={isLoading}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faSync} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Fixing Edition Names...' : 'Fix Edition Names'}
        </button>
      </div>
      
      {/* Results */}
      {result && (
        <div className={`mt-4 p-4 rounded-md ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
          <p className={result.success ? 'text-green-700' : 'text-red-700'}>
            {result.message}
          </p>
          
          {result.success && result.stats && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-white p-2 rounded shadow text-center">
                <div className="text-lg font-semibold">{result.stats.total}</div>
                <div className="text-xs text-gray-500">Total Processed</div>
              </div>
              <div className="bg-white p-2 rounded shadow text-center">
                <div className="text-lg font-semibold text-green-600">{result.stats.updated}</div>
                <div className="text-xs text-gray-500">Updated</div>
              </div>
              <div className="bg-white p-2 rounded shadow text-center">
                <div className="text-lg font-semibold text-red-600">{result.stats.errors}</div>
                <div className="text-xs text-gray-500">Errors</div>
              </div>
            </div>
          )}
        </div>
      )}
    </BaseModal>
  );
};

export default FixEditionNamesModal; 