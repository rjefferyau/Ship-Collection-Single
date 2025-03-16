import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faIndustry, faSearch, faWrench, 
  faExclamationTriangle 
} from '@fortawesome/free-solid-svg-icons';
import BaseModal from './BaseModal';

interface ManufacturerDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManufacturerDiagnosticsModal: React.FC<ManufacturerDiagnosticsModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);
  
  const [franchise, setFranchise] = useState("Star Trek");
  const [manufacturerName, setManufacturerName] = useState("Eaglemoss");
  const [forceUpdate, setForceUpdate] = useState(true);
  
  const [franchises, setFranchises] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<{name: string, franchises: string[]}[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Run diagnostics when modal opens
  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
      loadOptions();
    }
  }, [isOpen]);
  
  // Load franchises and manufacturers for dropdowns
  const loadOptions = async () => {
    setIsLoadingOptions(true);
    try {
      // Load franchises
      const franchiseResponse = await fetch('/api/franchises');
      if (franchiseResponse.ok) {
        const franchiseData = await franchiseResponse.json();
        if (franchiseData.success && franchiseData.franchises) {
          setFranchises(franchiseData.franchises.map((f: any) => f.name));
        }
      }
      
      // Load manufacturers
      const manufacturerResponse = await fetch('/api/manufacturers');
      if (manufacturerResponse.ok) {
        const manufacturerData = await manufacturerResponse.json();
        if (manufacturerData.success && manufacturerData.manufacturers) {
          setManufacturers(manufacturerData.manufacturers.map((m: any) => ({
            name: m.name,
            franchises: m.franchises || []
          })));
        }
      }
    } catch (err) {
      console.error('Error loading options:', err);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const runDiagnostics = async () => {
    setIsLoading(true);
    setDiagnosticResult(null);
    
    try {
      const response = await fetch('/api/starships/check-manufacturer-status');
      
      if (!response.ok) {
        throw new Error('Failed to run manufacturer diagnostics');
      }
      
      const data = await response.json();
      setDiagnosticResult(data);
      
      // Update manufacturers list from diagnostic results if available
      if (data.manufacturers && data.manufacturers.length > 0) {
        setManufacturers(data.manufacturers);
      }
      
      // Extract unique franchises from the franchise-manufacturer mappings
      if (data.franchiseManufacturerMap) {
        const uniqueFranchises = Object.keys(data.franchiseManufacturerMap);
        if (uniqueFranchises.length > 0) {
          setFranchises(uniqueFranchises);
        }
      }
    } catch (err) {
      console.error('Error running diagnostics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceUpdateManufacturers = async () => {
    setIsFixing(true);
    setFixResult(null);
    
    try {
      const response = await fetch('/api/starships/force-update-manufacturers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          franchise,
          manufacturerName,
          forceUpdate
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update manufacturers');
      }
      
      setFixResult(data);
      
      // Refresh diagnostics after fix
      await runDiagnostics();
    } catch (err) {
      console.error('Error updating manufacturers:', err);
      setFixResult({
        success: false,
        message: err instanceof Error ? err.message : 'An unknown error occurred'
      });
    } finally {
      setIsFixing(false);
    }
  };
  
  // Update manufacturer options when franchise changes
  const handleFranchiseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedFranchise = e.target.value;
    setFranchise(selectedFranchise);
    
    // Find manufacturer for this franchise from diagnosticResult if available
    if (diagnosticResult && diagnosticResult.franchiseManufacturerMap && 
        diagnosticResult.franchiseManufacturerMap[selectedFranchise]) {
      setManufacturerName(diagnosticResult.franchiseManufacturerMap[selectedFranchise]);
    }
  };
  
  // Add a helper function to get the recommended manufacturer for a franchise
  const getRecommendedManufacturer = (franchiseName: string): string => {
    if (diagnosticResult?.franchiseManufacturerMap?.[franchiseName]) {
      return diagnosticResult.franchiseManufacturerMap[franchiseName];
    }
    return manufacturerName;
  };

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Manufacturer Diagnostics & Fixes"
      icon={<FontAwesomeIcon icon={faIndustry} className="text-indigo-600" />}
      maxWidth="sm:max-w-4xl"
    >
      <div className="mt-2">
        <p className="text-sm text-gray-500">
          Diagnose and fix manufacturer assignment issues for your starships.
        </p>
      </div>
      
      <div className="mb-6 mt-4">
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={runDiagnostics}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faSearch} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </button>
        </div>
      </div>
      
      <div className="max-h-[60vh] overflow-y-auto">
        {/* Diagnostic Results */}
        {diagnosticResult && (
          <div className="bg-white shadow-md rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold mb-4">Diagnostic Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">Starship Stats</h3>
                <ul className="space-y-1">
                  <li><span className="font-medium">Total Starships:</span> {diagnosticResult.stats.total}</li>
                  <li><span className="font-medium">With Manufacturer:</span> {diagnosticResult.stats.withManufacturer}</li>
                  <li><span className="font-medium">Without Manufacturer:</span> {diagnosticResult.stats.withoutManufacturer}</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">Franchise Stats</h3>
                <ul className="space-y-1">
                  <li><span className="font-medium">With Franchise:</span> {diagnosticResult.stats.withFranchise}</li>
                  <li><span className="font-medium">Without Franchise:</span> {diagnosticResult.stats.withoutFranchise}</li>
                  <li><span className="font-medium">Franchise Has Manufacturer:</span> {diagnosticResult.stats.franchiseHasManufacturer}</li>
                  <li><span className="font-medium">Franchise No Manufacturer:</span> {diagnosticResult.stats.franchiseNoManufacturer}</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">Manufacturer Stats</h3>
                <ul className="space-y-1">
                  <li><span className="font-medium">Total Manufacturers:</span> {diagnosticResult.manufacturers.length}</li>
                  <li><span className="font-medium">Franchise-Manufacturer Mappings:</span> {Object.keys(diagnosticResult.franchiseManufacturerMap).length}</li>
                </ul>
              </div>
            </div>
            
            {/* Sample Starships */}
            {diagnosticResult.stats.sampleStarships && diagnosticResult.stats.sampleStarships.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Sample Starships</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ship Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Franchise</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {diagnosticResult.stats.sampleStarships.map((ship: any) => (
                        <tr key={ship.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ship.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ship.shipName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ship.franchise}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ship.manufacturer === 'N/A' ? (
                              <span className="text-red-500 flex items-center">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" /> Missing
                              </span>
                            ) : ship.manufacturer}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Force Update Form */}
        <div className="bg-white shadow-md rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">Force Update Manufacturers</h2>
          <p className="mb-4 text-gray-600">
            Use this tool to force update the manufacturer field for starships. This is useful if you have starships that are missing manufacturer information.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="franchise" className="block text-sm font-medium text-gray-700 mb-1">
                Franchise
              </label>
              <select
                id="franchise"
                value={franchise}
                onChange={handleFranchiseChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={isLoadingOptions || franchises.length === 0}
              >
                {franchises.length === 0 ? (
                  <option value="">Loading franchises...</option>
                ) : (
                  franchises.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))
                )}
              </select>
            </div>
            
            <div>
              <label htmlFor="manufacturerName" className="block text-sm font-medium text-gray-700 mb-1">
                Manufacturer Name
              </label>
              <select
                id="manufacturerName"
                value={manufacturerName}
                onChange={(e) => setManufacturerName(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={isLoadingOptions || manufacturers.length === 0}
              >
                {manufacturers.length === 0 ? (
                  <option value="">Loading manufacturers...</option>
                ) : (
                  manufacturers.map((m) => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))
                )}
              </select>
              {franchise && diagnosticResult?.franchiseManufacturerMap?.[franchise] && (
                <p className="mt-1 text-sm text-green-600">
                  <span className="font-medium">Recommended:</span> {getRecommendedManufacturer(franchise)}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="forceUpdate"
              checked={forceUpdate}
              onChange={(e) => setForceUpdate(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="forceUpdate" className="ml-2 block text-sm text-gray-900">
              Force update all starships (including those that already have a manufacturer)
            </label>
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleForceUpdateManufacturers}
              disabled={isFixing || franchises.length === 0 || manufacturers.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faWrench} className={`mr-2 ${isFixing ? 'animate-spin' : ''}`} />
              {isFixing ? 'Updating...' : 'Force Update Manufacturers'}
            </button>
          </div>
        </div>
        
        {/* Fix Results */}
        {fixResult && (
          <div className={`mb-6 p-4 rounded-md ${fixResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className={fixResult.success ? 'text-green-700' : 'text-red-700'}>
              {fixResult.message}
            </p>
            
            {fixResult.success && fixResult.stats && (
              <div className="mt-4">
                <div className="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="bg-white p-2 rounded shadow text-center">
                    <div className="text-lg font-semibold">{fixResult.stats.total}</div>
                    <div className="text-xs text-gray-500">Total Found</div>
                  </div>
                  <div className="bg-white p-2 rounded shadow text-center">
                    <div className="text-lg font-semibold text-green-600">{fixResult.stats.updated}</div>
                    <div className="text-xs text-gray-500">Updated</div>
                  </div>
                  <div className="bg-white p-2 rounded shadow text-center">
                    <div className="text-lg font-semibold text-red-600">{fixResult.stats.errors}</div>
                    <div className="text-xs text-gray-500">Errors</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default ManufacturerDiagnosticsModal; 