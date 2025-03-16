import React, { useState, useEffect } from 'react';
import Head from 'next/head';

// NOTE: Do NOT import the Layout component here
// The Layout is already applied globally in _app.tsx

const PageTemplate: React.FC = () => {
  // Your state and hooks
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Your initialization code
    const fetchData = async () => {
      try {
        // Fetch data here
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  return (
    <>
      {/* Optional: Add page-specific head content */}
      <Head>
        <title>Page Title - CollectHub</title>
      </Head>
      
      {/* Main content - this will be wrapped by the Layout component from _app.tsx */}
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Page Title</h1>
        
        <div className="mb-4">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h5 className="text-lg font-medium text-gray-700 mb-0">Card Title</h5>
            </div>
            <div className="p-5">
              {loading ? (
                <p className="text-gray-600">Loading...</p>
              ) : (
                <p className="text-gray-600">Your content here</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PageTemplate;

// INSTRUCTIONS:
// 1. Copy this file to pages/your-page-name.tsx
// 2. Rename PageTemplate to YourPageName
// 3. Update the content as needed
// 4. Add your page path to the activeTab detection in _app.tsx 