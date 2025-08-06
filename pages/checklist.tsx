import React from 'react';
import Link from 'next/link';
import ChecklistGenerator from '../components/ChecklistGenerator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faClipboardList } from '@fortawesome/free-solid-svg-icons';

const ChecklistPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 pt-8 pb-12">
        <div className="w-full px-6">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              className="inline-flex items-center text-white hover:text-indigo-100 transition-colors duration-200"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              <span>Back to Collection</span>
            </Link>
          </div>
          
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <FontAwesomeIcon icon={faClipboardList} className="text-3xl text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Collection Checklist
            </h1>
            <p className="text-xl text-indigo-100 font-medium max-w-3xl mx-auto">
              Generate a printable PDF checklist of your starship collection with customizable filters
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-6 -mt-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">How to Use</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Select a franchise to filter by specific universe (optional)</li>
              <li>Choose which editions to include in your checklist</li>
              <li>Select which status types to include (owned, wishlist, etc.)</li>
              <li>Click "Generate Preview" to see what will be included</li>
              <li>Download the PDF checklist for printing or sharing</li>
            </ol>
            <div className="mt-4 p-3 bg-blue-100 rounded">
              <p className="text-sm text-blue-900 font-medium">Tip:</p>
              <p className="text-sm text-blue-800">
                The checklist includes checkboxes (☐) for owned items and crosses (✗) for items you don't have yet.
                Perfect for conventions, shopping trips, or inventory management!
              </p>
            </div>
          </div>

          {/* Checklist Generator Component */}
          <ChecklistGenerator />

          {/* Features List */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Filterable by Franchise</h4>
                  <p className="text-sm text-gray-600">Focus on specific universes like Star Trek or BSG</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Edition Selection</h4>
                  <p className="text-sm text-gray-600">Choose specific editions or collections to include</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Status Filtering</h4>
                  <p className="text-sm text-gray-600">Include owned, wishlist, on-order, or not-owned items</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Print-Ready Format</h4>
                  <p className="text-sm text-gray-600">Clean PDF layout optimized for printing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChecklistPage;