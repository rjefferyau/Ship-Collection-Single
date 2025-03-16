import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, faCog, faIcons, faUsers, 
  faBookOpen, faFileImport, faDollarSign, faArrowRight, faDatabase,
  faLayerGroup, faFilm
} from '@fortawesome/free-solid-svg-icons';

const SetupPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Setup - Collection Manager</title>
      </Head>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Setup & Configuration</h1>
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
        {/* Edition Setup Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faBookOpen} className="text-indigo-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Edition Setup</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Manage editions for your starship collections. Add, edit, or remove editions.
            </p>
            <Link href="/edition-setup" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Manage Editions
            </Link>
          </div>
        </div>
        
        {/* Faction Setup Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faUsers} className="text-indigo-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Faction Setup</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Manage factions for your starships. Add, edit, or remove factions.
            </p>
            <Link href="/faction-setup" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Manage Factions
            </Link>
          </div>
        </div>
        
        {/* Icon Setup Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faIcons} className="text-indigo-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Icon Setup</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Manage icons for your starships. Add, edit, or remove icons.
            </p>
            <Link href="/icon-setup" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Manage Icons
            </Link>
          </div>
        </div>
        
        {/* Currency Setup Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faDollarSign} className="text-indigo-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Currency Setup</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Configure currency settings for your collection.
            </p>
            <Link href="/currency-setup" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Manage Currency
            </Link>
          </div>
        </div>
        
        {/* Database Check Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faDatabase} className="text-indigo-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Database Check</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Check and maintain your database. Fix inconsistencies and errors.
            </p>
            <Link href="/database-check" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Check Database
            </Link>
          </div>
        </div>
        
        {/* Import/Export Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faFileImport} className="text-indigo-600 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Import/Export</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Import or export your collection data. Backup and restore your data.
            </p>
            <Link href="/import-export" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Import/Export Data
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default SetupPage; 