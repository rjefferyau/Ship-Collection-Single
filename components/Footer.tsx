import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="w-full max-w-7xl mx-auto px-4 py-6 md:flex md:items-center md:justify-between">
        <div className="flex justify-center space-x-6 md:order-2">
          <Link href="/help" className="text-gray-500 hover:text-gray-700">
            Help
          </Link>
          <Link href="/documentation" className="text-gray-500 hover:text-gray-700">
            Documentation
          </Link>
          <Link href="/api" className="text-gray-500 hover:text-gray-700">
            API
          </Link>
          <Link href="/contact" className="text-gray-500 hover:text-gray-700">
            Contact
          </Link>
        </div>
        <div className="mt-4 md:mt-0 md:order-1 text-center md:text-left">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Ship Collection. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 