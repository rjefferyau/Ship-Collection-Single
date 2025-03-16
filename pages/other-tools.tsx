import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, faCog, faTools, faWrench, faIndustry, 
  faFont, faSync, faWandMagicSparkles, faSearch
} from '@fortawesome/free-solid-svg-icons';

// Import modal components
import FixEditionNamesModal from '../components/modals/FixEditionNamesModal';
import ManufacturerDiagnosticsModal from '../components/modals/ManufacturerDiagnosticsModal';

const OtherToolsPage: React.FC = () => {
  // State for controlling which modal is open
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Function to open a specific modal
  const openModal = (modalName: string) => {
    setActiveModal(modalName);
  };

  // Function to close the active modal
  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <>
      <Head>
        <title>Other Tools - Collection Manager</title>
      </Head>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Other Tools & Utilities</h1>
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
                  <FontAwesomeIcon icon={faTools} className="mr-2" /> Other Tools
                </span>
              </div>
            </li>
          </ol>
        </nav>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Fix Edition Names Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-yellow-500">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faFont} className="text-yellow-500 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Fix Edition Names</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Fix incorrect edition internal names that may cause starships to not appear in the correct franchise.
            </p>
            <button
              onClick={() => openModal('fixEditionNames')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <FontAwesomeIcon icon={faWrench} className="mr-2" />
              Open Tool
            </button>
          </div>
        </div>
        
        {/* Manufacturer Diagnostics Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-indigo-600">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faIndustry} className="text-indigo-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Manufacturer Diagnostics</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Diagnose and fix manufacturer assignment issues, including forcing updates for specific franchises.
            </p>
            <button
              onClick={() => openModal('manufacturerDiagnostics')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FontAwesomeIcon icon={faSearch} className="mr-2" />
              Open Tool
            </button>
          </div>
        </div>
        
        {/* Auto-Assign Manufacturers Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-purple-600">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faWandMagicSparkles} className="text-purple-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Auto-Assign Manufacturers</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Automatically assign manufacturers to starships based on their franchise.
            </p>
            <Link href="/manufacturer-setup" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
              <FontAwesomeIcon icon={faSync} className="mr-2" />
              Go to Tool
            </Link>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {activeModal === 'fixEditionNames' && (
        <FixEditionNamesModal isOpen={true} onClose={closeModal} />
      )}
      
      {activeModal === 'manufacturerDiagnostics' && (
        <ManufacturerDiagnosticsModal isOpen={true} onClose={closeModal} />
      )}
    </>
  );
};

export default OtherToolsPage; 