import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, faCog, faIcons, faUsers, 
  faBookOpen, faFileImport, faDollarSign, faArrowRight, faDatabase,
  faLayerGroup, faFilm, faClipboardList
} from '@fortawesome/free-solid-svg-icons';

const SetupPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Collection Setup - Collection Manager</title>
      </Head>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Collection Setup & Configuration</h1>
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600">
                <FontAwesomeIcon icon={faHome} className="mr-2" /> Home
              </Link>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Collection Type Setup Card - Primary */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-indigo-600">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faLayerGroup} className="text-indigo-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Collection Types</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Define the types of collections you want to manage. This is the foundation of your collection structure.
            </p>
            <Link href="/collection-type-setup" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Manage Collection Types
            </Link>
          </div>
        </div>
        
        {/* Franchise Setup Card - Primary */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-indigo-600">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faFilm} className="text-indigo-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Franchises</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Set up the franchises your collection items belong to (e.g., Star Trek, Star Wars, Battlestar Galactica).
            </p>
            <Link href="/franchise-setup" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Manage Franchises
            </Link>
          </div>
        </div>
        
        {/* Faction Setup Card - Primary */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-indigo-600">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faUsers} className="text-indigo-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Factions</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Configure the factions or groups that your collection items belong to (e.g., Federation, Empire).
            </p>
            <Link href="/faction-setup" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Manage Factions
            </Link>
          </div>
        </div>
        
        {/* Edition Setup Card - Secondary */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faBookOpen} className="text-indigo-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Editions</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Manage different editions or series of your collection items (e.g., Original Series, Special Edition).
            </p>
            <Link href="/edition-setup" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Manage Editions
            </Link>
          </div>
        </div>
        
        {/* Currency Setup Card - Secondary */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faDollarSign} className="text-indigo-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Currency Settings</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Configure currency settings for displaying prices and values throughout your collection.
            </p>
            <Link href="/currency-setup" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Configure Currency
            </Link>
          </div>
        </div>
        
        {/* Icon Setup Card - Secondary */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faIcons} className="text-indigo-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">UI Icons</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Customize the icons used throughout the application interface for better visual recognition.
            </p>
            <Link href="/icon-setup" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Customize Icons
            </Link>
          </div>
        </div>
        
        {/* Management Card - Utility */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden bg-gray-50">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faClipboardList} className="text-indigo-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Bulk Management</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Perform bulk operations on your collection items, such as batch updates, tagging, and organization.
            </p>
            <Link href="/management" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Bulk Operations
            </Link>
          </div>
        </div>
        
        {/* Import/Export Card - Utility */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden bg-gray-50">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faFileImport} className="text-indigo-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Import/Export</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Transfer your collection data between systems or create backups for safekeeping.
            </p>
            <Link href="/import-export" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Import/Export Data
            </Link>
          </div>
        </div>
        
        {/* Database Check Card - Utility */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden bg-gray-50">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faDatabase} className="text-indigo-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Database Maintenance</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Check database health, fix inconsistencies, and perform maintenance operations on your collection data.
            </p>
            <Link href="/database-check" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Database Tools
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default SetupPage; 