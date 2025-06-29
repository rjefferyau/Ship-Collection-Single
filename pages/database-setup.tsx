import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faDatabase, 
  faFileImport,
  faTools,
  faChartLine,
  faCog
} from '@fortawesome/free-solid-svg-icons';
import BackupManager from '../components/BackupManager';

const DatabaseSetupPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Head>
        <title>Database Management - Collection Manager</title>
      </Head>
      
      <div className="w-full px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Database Management</h1>
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
                  <Link href="/setup" className="ml-1 text-sm font-medium text-gray-700 hover:text-indigo-600 md:ml-2">
                    <FontAwesomeIcon icon={faCog} className="mr-2" /> Setup
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                    <FontAwesomeIcon icon={faDatabase} className="mr-2" /> Database
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Backup Management Section */}
        <div className="mb-8">
          <BackupManager />
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Import/Export Tools */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-yellow-500">
            <div className="p-5">
              <div className="flex items-center mb-4">
                <FontAwesomeIcon icon={faFileImport} className="text-yellow-500 text-2xl mr-3" />
                <h2 className="text-xl font-semibold text-gray-800">Import/Export</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Import data from CSV files or export your collection data for analysis and backup.
              </p>
              <Link href="/import-export" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
                Import/Export Tools
              </Link>
            </div>
          </div>

          {/* Database Analysis */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-green-600">
            <div className="p-5">
              <div className="flex items-center mb-4">
                <FontAwesomeIcon icon={faChartLine} className="text-green-600 text-2xl mr-3" />
                <h2 className="text-xl font-semibold text-gray-800">Database Analysis</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Analyze your database structure, check for issues, and view collection statistics.
              </p>
              <Link href="/database-analysis" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Analyze Database
              </Link>
            </div>
          </div>

          {/* Database Check */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-blue-600">
            <div className="p-5">
              <div className="flex items-center mb-4">
                <FontAwesomeIcon icon={faDatabase} className="text-blue-600 text-2xl mr-3" />
                <h2 className="text-xl font-semibold text-gray-800">Database Check</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Check database connectivity, validate data integrity, and run diagnostic tests.
              </p>
              <Link href="/database-check" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Check Database
              </Link>
            </div>
          </div>

          {/* Other Tools */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-gray-600">
            <div className="p-5">
              <div className="flex items-center mb-4">
                <FontAwesomeIcon icon={faTools} className="text-gray-600 text-2xl mr-3" />
                <h2 className="text-xl font-semibold text-gray-800">Maintenance Tools</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Access additional database maintenance utilities and repair tools.
              </p>
              <Link href="/other-tools" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                Maintenance Tools
              </Link>
            </div>
          </div>
        </div>

        {/* Information Panel */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Database Management Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-2">Backup Best Practices</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create regular backups before major changes</li>
                <li>• Store backups in multiple locations for safety</li>
                <li>• Test restore procedures periodically</li>
                <li>• Keep backup files secure and accessible</li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-2">Database Maintenance</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Run database checks regularly to ensure integrity</li>
                <li>• Monitor collection sizes and performance</li>
                <li>• Clean up orphaned records and unused data</li>
                <li>• Keep database indexes optimized</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetupPage;