import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle, faHome, faRedo } from '@fortawesome/free-solid-svg-icons';

const Custom500: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <div className="max-w-md mx-auto">
        <FontAwesomeIcon 
          icon={faExclamationCircle} 
          size="4x" 
          className="text-red-500 mb-6" 
        />
        
        <h1 className="text-4xl font-bold text-gray-800 mb-4">500 - Server Error</h1>
        
        <p className="text-lg text-gray-600 mb-8">
          We've encountered a warp core breach in our systems.
          Our engineering team has been notified and is working to resolve the issue.
        </p>
        
        <div className="flex justify-center space-x-4">
          <button 
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => window.location.reload()}
          >
            <FontAwesomeIcon icon={faRedo} className="mr-2" />
            Try Again
          </button>
          
          <Link href="/" className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <FontAwesomeIcon icon={faHome} className="mr-2" />
            Return to Bridge
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Custom500; 