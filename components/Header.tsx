import React, { useState } from 'react';
import Link from 'next/link';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center md:hidden">
            <button 
              onClick={toggleSidebar}
              className="text-gray-700 hover:text-gray-900 focus:outline-none"
              aria-label="Toggle navigation"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <div className="flex items-center">
            <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex items-center space-x-2 relative">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-rose-100 text-rose-500 text-sm font-medium">R</span>
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)} 
              className="font-medium text-gray-700 flex items-center"
            >
              Ryan Jeffery
              <svg className="h-4 w-4 text-gray-500 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {userMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                <Link href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Your Profile
                </Link>
                <Link href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Settings
                </Link>
                <Link href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Sign out
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search" 
              className="w-64 pl-3 pr-10 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500" 
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              <span className="text-xs">Ctrl+K</span>
            </div>
          </div>
          <Link href="#" className="text-gray-600 hover:text-gray-800">
            Docs
          </Link>
          <Link href="#" className="text-gray-600 hover:text-gray-800">
            Help
          </Link>
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-rose-100 text-rose-500 text-sm font-medium">R</span>
        </div>
      </div>
    </header>
  );
};

export default Header; 