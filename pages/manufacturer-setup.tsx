import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faCog, faIndustry, faSync, faWandMagicSparkles, faWrench } from '@fortawesome/free-solid-svg-icons';
import ManufacturerManager from '../components/ManufacturerManager';

const ManufacturerSetupPage: React.FC = () => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<{ 
    success: boolean; 
    message: string;
    stats?: {
      total: number;
      updated: number;
      skipped: number;
      alreadyAssigned: number;
      errors: number;
    }
  } | null>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  
  // Add state for franchises and manufacturers
  const [franchises, setFranchises] = useState<string[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  
  // Load franchises when component mounts
  useEffect(() => {
    loadFranchises();
  }, []);
  
  const loadFranchises = async () => {
    setIsLoadingOptions(true);
    try {
      const response = await fetch('/api/franchises');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setFranchises(data.data.map((f: any) => f.name));
        }
      }
    } catch (err) {
      console.error('Error loading franchises:', err);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleAssignDefaultManufacturers = async () => {
    setIsAssigning(true);
    setAssignResult(null);
    
    try {
      const response = await fetch('/api/starships/assign-default-manufacturers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          overwriteExisting
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign manufacturers');
      }
      
      setAssignResult({
        success: true,
        message: data.message,
        stats: data.stats
      });
    } catch (err) {
      setAssignResult({
        success: false,
        message: err instanceof Error ? err.message : 'An unknown error occurred'
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <>
      <Head>
        <title>Manufacturer Setup - Collection Manager</title>
      </Head>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manufacturer Management</h1>
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600">
                <FontAwesomeIcon icon={faHome} className="mr-2" /> Home
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <a href="/setup" className="ml-1 text-sm font-medium text-gray-700 hover:text-indigo-600 md:ml-2">
                  <FontAwesomeIcon icon={faCog} className="mr-2" /> Setup
                </a>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                  <FontAwesomeIcon icon={faIndustry} className="mr-2" /> Manufacturer Setup
                </span>
              </div>
            </li>
          </ol>
        </nav>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <Link href="/manufacturer-assignment" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <FontAwesomeIcon icon={faSync} className="mr-2" />
            Mass Assign Manufacturers
          </Link>
          
          <button
            onClick={handleAssignDefaultManufacturers}
            disabled={isAssigning}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} className={`mr-2 ${isAssigning ? 'animate-spin' : ''}`} />
            {isAssigning ? 'Assigning...' : 'Auto-Assign by Franchise'}
          </button>
          
          <Link href="/manufacturer-diagnostics" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
            <FontAwesomeIcon icon={faWrench} className="mr-2" />
            Diagnostics & Fixes
          </Link>
        </div>
        
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="overwriteExisting"
            checked={overwriteExisting}
            onChange={(e) => setOverwriteExisting(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="overwriteExisting" className="ml-2 block text-sm text-gray-900">
            Overwrite existing manufacturer assignments
          </label>
        </div>
      </div>
      
      {assignResult && (
        <div className={`mb-6 p-4 rounded-md ${assignResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
          <p className={assignResult.success ? 'text-green-700' : 'text-red-700'}>
            {assignResult.message}
          </p>
          
          {assignResult.success && assignResult.stats && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
              <div className="bg-white p-2 rounded shadow text-center">
                <div className="text-lg font-semibold">{assignResult.stats.total}</div>
                <div className="text-xs text-gray-500">Total Processed</div>
              </div>
              <div className="bg-white p-2 rounded shadow text-center">
                <div className="text-lg font-semibold text-green-600">{assignResult.stats.updated}</div>
                <div className="text-xs text-gray-500">Updated</div>
              </div>
              <div className="bg-white p-2 rounded shadow text-center">
                <div className="text-lg font-semibold text-yellow-600">{assignResult.stats.skipped}</div>
                <div className="text-xs text-gray-500">Skipped</div>
              </div>
              <div className="bg-white p-2 rounded shadow text-center">
                <div className="text-lg font-semibold text-blue-600">{assignResult.stats.alreadyAssigned}</div>
                <div className="text-xs text-gray-500">Already Assigned</div>
              </div>
              <div className="bg-white p-2 rounded shadow text-center">
                <div className="text-lg font-semibold text-red-600">{assignResult.stats.errors}</div>
                <div className="text-xs text-gray-500">Errors</div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <ManufacturerManager />
    </>
  );
};

export default ManufacturerSetupPage; 