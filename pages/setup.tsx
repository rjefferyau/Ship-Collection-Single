import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, faCog, faIcons, faUsers, 
  faBookOpen, faFileImport, faDollarSign, faArrowRight, faDatabase
} from '@fortawesome/free-solid-svg-icons';

const SetupPage: React.FC = () => {
  const router = useRouter();

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <>
      <Head>
        <title>Setup - Starship Collection Manager</title>
      </Head>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Setup</h1>
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
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                  <FontAwesomeIcon icon={faCog} className="mr-2" /> Setup
                </span>
              </div>
            </li>
          </ol>
        </nav>
      </div>
      
      <p className="text-gray-600 mb-6">
        Configure your collection manager settings and preferences.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Icon Setup */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
          <div className="p-6 flex flex-col items-center text-center h-full">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <FontAwesomeIcon icon={faIcons} size="lg" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Icon Setup</h4>
            <p className="text-gray-600 mb-6">
              Customize the icons used throughout the application.
            </p>
            <div className="mt-auto">
              <button 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => navigateTo('/icon-setup')}
              >
                Configure Icons <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Faction Setup */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
          <div className="p-6 flex flex-col items-center text-center h-full">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <FontAwesomeIcon icon={faUsers} size="lg" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Faction Setup</h4>
            <p className="text-gray-600 mb-6">
              Manage factions and races for your starship collection.
            </p>
            <div className="mt-auto">
              <button 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => navigateTo('/faction-setup')}
              >
                Manage Factions <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Edition Setup */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
          <div className="p-6 flex flex-col items-center text-center h-full">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <FontAwesomeIcon icon={faBookOpen} size="lg" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Edition Setup</h4>
            <p className="text-gray-600 mb-6">
              Manage editions and series for your starship collection.
            </p>
            <div className="mt-auto">
              <button 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => navigateTo('/edition-setup')}
              >
                Manage Editions <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Import/Export */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
          <div className="p-6 flex flex-col items-center text-center h-full">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <FontAwesomeIcon icon={faFileImport} size="lg" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Import/Export</h4>
            <p className="text-gray-600 mb-6">
              Import or export your collection data.
            </p>
            <div className="mt-auto">
              <button 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => navigateTo('/import-export')}
              >
                Import/Export Data <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Currency Setup */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
          <div className="p-6 flex flex-col items-center text-center h-full">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <FontAwesomeIcon icon={faDollarSign} size="lg" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Currency Setup</h4>
            <p className="text-gray-600 mb-6">
              Configure your preferred currency for prices.
            </p>
            <div className="mt-auto">
              <button 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => navigateTo('/currency-setup')}
              >
                Configure Currency <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Database Check - NEW */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
          <div className="p-6 flex flex-col items-center text-center h-full">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <FontAwesomeIcon icon={faDatabase} size="lg" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Database Check</h4>
            <p className="text-gray-600 mb-6">
              View database information, collection statistics, and storage usage.
            </p>
            <div className="mt-auto">
              <button 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => navigateTo('/database-check')}
              >
                Check Database <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SetupPage; 