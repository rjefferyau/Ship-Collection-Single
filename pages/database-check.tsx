import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faCog, faDatabase, faWrench } from '@fortawesome/free-solid-svg-icons';
import DatabaseInfo from '../components/DatabaseInfo';

const DatabaseCheckPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Head>
        <title>Database Check - CollectHub</title>
      </Head>
      
      <div className="w-full px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Database Check</h1>
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
                    <FontAwesomeIcon icon={faDatabase} className="mr-2" /> Database Check
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
        
        <p className="text-gray-600 mb-6">
          View detailed information about your database, including connection status, collection statistics, and storage usage.
          This page also provides database maintenance tools to fix issues with your database.
        </p>
        
        <DatabaseInfo />
      </div>
    </div>
  );
};

export default DatabaseCheckPage; 