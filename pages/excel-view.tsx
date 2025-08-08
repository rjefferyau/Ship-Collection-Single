import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { Starship } from '../types';

// Dynamically import the ExcelView component
const ExcelView = dynamic(() => import('../components/ExcelView'), {
  loading: () => <div className="flex items-center justify-center h-screen">Loading Excel view...</div>,
  ssr: false
});

const ExcelViewPage: React.FC = () => {
  const [starships, setStarships] = useState<Starship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we're running in the browser
    if (typeof window !== 'undefined') {
      // Try to get the starships data from the parent window
      if (window.opener && (window.opener as any).starships) {
        setStarships((window.opener as any).starships);
        setLoading(false);
      } else {
        // If there's no data from the parent window, fetch it from the API
        fetchStarships();
      }
    }
  }, []);

  const fetchStarships = async () => {
    try {
      const response = await fetch(`/api/starships?_t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch starships');
      }
      const data = await response.json();
      setStarships(data.data || []);
    } catch (error) {
      console.error('Error fetching starships:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // If opened from parent window, use the parent's close function
    if (window.opener && (window.opener as any).onClose) {
      (window.opener as any).onClose();
    } else {
      // Otherwise just close this window
      window.close();
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Ship Collection - Excel Online</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="flex items-center justify-center h-screen bg-white">
          <div className="text-center">
            <div className="relative mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-green-600 absolute top-0 left-0"></div>
            </div>
            <p className="text-gray-600">Loading Excel View...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Ship Collection - Excel Online</title>
        <link rel="icon" href="https://cdn-icons-png.flaticon.com/512/888/888850.png" />
      </Head>
      <ExcelView starships={starships} onClose={handleClose} />
    </>
  );
};

export default ExcelViewPage; 