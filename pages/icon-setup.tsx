import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faIcons, faSave, faUndo, faCog } from '@fortawesome/free-solid-svg-icons';

interface IconOption {
  value: string;
  label: string;
}

const IconSetupPage: React.FC = () => {
  const [navIcons, setNavIcons] = useState<Record<string, string>>({
    collection: 'fa-space-shuttle',
    'fancy-view': 'fa-images',
    statistics: 'fa-chart-bar',
    'price-vault': 'fa-dollar-sign',
    wishlist: 'fa-star',
    setup: 'fa-cog',
    management: 'fa-clipboard-list'
  });
  
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Icon options for each navigation item
  const iconOptions: Record<string, IconOption[]> = {
    collection: [
      { value: 'fa-space-shuttle', label: 'Space Shuttle' },
      { value: 'fa-rocket', label: 'Rocket' },
      { value: 'fa-ship', label: 'Ship' },
      { value: 'fa-database', label: 'Database' },
      { value: 'fa-list', label: 'List' }
    ],
    'fancy-view': [
      { value: 'fa-images', label: 'Images' },
      { value: 'fa-image', label: 'Image' },
      { value: 'fa-th', label: 'Grid' },
      { value: 'fa-th-large', label: 'Large Grid' },
      { value: 'fa-camera', label: 'Camera' }
    ],
    statistics: [
      { value: 'fa-chart-bar', label: 'Bar Chart' },
      { value: 'fa-chart-pie', label: 'Pie Chart' },
      { value: 'fa-chart-line', label: 'Line Chart' },
      { value: 'fa-analytics', label: 'Analytics' },
      { value: 'fa-tachometer-alt', label: 'Dashboard' }
    ],
    'price-vault': [
      { value: 'fa-dollar-sign', label: 'Dollar Sign' },
      { value: 'fa-money-bill-wave', label: 'Money Bill' },
      { value: 'fa-coins', label: 'Coins' },
      { value: 'fa-piggy-bank', label: 'Piggy Bank' },
      { value: 'fa-cash-register', label: 'Cash Register' }
    ],
    wishlist: [
      { value: 'fa-star', label: 'Star' },
      { value: 'fa-heart', label: 'Heart' },
      { value: 'fa-bookmark', label: 'Bookmark' },
      { value: 'fa-shopping-cart', label: 'Shopping Cart' },
      { value: 'fa-gift', label: 'Gift' }
    ],
    setup: [
      { value: 'fa-cog', label: 'Cog' },
      { value: 'fa-tools', label: 'Tools' },
      { value: 'fa-sliders-h', label: 'Sliders' },
      { value: 'fa-wrench', label: 'Wrench' },
      { value: 'fa-screwdriver', label: 'Screwdriver' }
    ],
    management: [
      { value: 'fa-clipboard-list', label: 'Clipboard List' },
      { value: 'fa-tasks', label: 'Tasks' },
      { value: 'fa-clipboard-check', label: 'Clipboard Check' },
      { value: 'fa-file-invoice', label: 'Invoice' },
      { value: 'fa-id-card', label: 'ID Card' },
      { value: 'fa-shield-alt', label: 'Shield' },
      { value: 'fa-certificate', label: 'Certificate' }
    ]
  };
  
  // Load icons from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedIcons = localStorage.getItem('navIcons');
      if (savedIcons) {
        setNavIcons(JSON.parse(savedIcons));
      }
    }
  }, []);
  
  // Handle icon change
  const handleIconChange = (navItem: string, iconValue: string) => {
    setNavIcons({
      ...navIcons,
      [navItem]: iconValue
    });
  };
  
  // Save icons to localStorage
  const saveIcons = () => {
    try {
      localStorage.setItem('navIcons', JSON.stringify(navIcons));
      setSuccess('Icons saved successfully. Changes will take effect immediately.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save icons. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Reset to defaults
  const resetToDefaults = () => {
    const defaultIcons = {
      collection: 'fa-space-shuttle',
      'fancy-view': 'fa-images',
      statistics: 'fa-chart-bar',
      'price-vault': 'fa-dollar-sign',
      wishlist: 'fa-star',
      setup: 'fa-cog',
      management: 'fa-clipboard-list'
    };
    
    setNavIcons(defaultIcons);
    localStorage.setItem('navIcons', JSON.stringify(defaultIcons));
    setSuccess('Icons reset to defaults.');
    setTimeout(() => setSuccess(null), 3000);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Head>
        <title>Icon Setup - CollectHub</title>
      </Head>
      
      <div className="w-full px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Icon Setup</h1>
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
                    <FontAwesomeIcon icon={faIcons} className="mr-2" /> Icon Setup
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
        
        {success && (
          <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
            {success}
          </div>
        )}
        
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h5 className="text-lg font-medium text-gray-700 mb-0">Navigation Icons</h5>
          </div>
          <div className="p-5">
            <p className="text-gray-600 mb-4">
              Customize the icons used in the navigation menu. Changes will take effect immediately after saving.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(navIcons).map((navItem) => (
                <div key={navItem} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                    <h6 className="font-medium text-gray-700 mb-0 capitalize">
                      {navItem === 'fancy-view' ? 'Gallery' : 
                       navItem === 'price-vault' ? 'Price Vault' : navItem}
                    </h6>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 flex items-center justify-center text-indigo-600">
                        <i className={`fa-solid ${navIcons[navItem]} text-2xl`}></i>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor={`icon-select-${navItem}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Select Icon
                      </label>
                      <select
                        id={`icon-select-${navItem}`}
                        value={navIcons[navItem]}
                        onChange={(e) => handleIconChange(navItem, e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        {iconOptions[navItem].map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between mt-6">
              <button 
                onClick={resetToDefaults}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FontAwesomeIcon icon={faUndo} className="mr-2" />
                Reset to Defaults
              </button>
              
              <button 
                onClick={saveIcons}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IconSetupPage; 