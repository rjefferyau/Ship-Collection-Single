import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faHome } from '@fortawesome/free-solid-svg-icons';

const Custom404: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <div className="max-w-md mx-auto">
        <FontAwesomeIcon 
          icon={faExclamationTriangle} 
          size="4x" 
          className="text-yellow-500 mb-6" 
        />
        
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
        
        <p className="text-lg text-gray-600 mb-8">
          The starship you're looking for seems to have warped to another dimension.
          Our sensors cannot locate the requested page in this sector of space.
        </p>
        
        <Link href="/" className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <FontAwesomeIcon icon={faHome} className="mr-2" />
          Return to Starfleet
        </Link>
      </div>
    </div>
  );
};

export default Custom404; 