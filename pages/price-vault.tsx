import React, { useState, useEffect } from 'react';
import PriceVault from '../components/PriceVault';
import InsuranceReport from '../components/InsuranceReport';
import CollectionFilter from '../components/CollectionFilter';
import { Starship } from '../types';

// Define a local interface that matches what PriceVault expects
interface PriceVaultStarship {
  _id: string;
  issue: string;
  edition: string;
  shipName: string;
  faction: string;
  releaseDate?: Date;
  imageUrl?: string;
  owned: boolean;
  retailPrice?: number;
  purchasePrice?: number;
  marketValue?: number;
  franchise?: string;
  collectionType?: string;
}

const PriceVaultPage: React.FC = () => {
  // Maintain two separate state variables for the different component types
  const [priceVaultStarships, setPriceVaultStarships] = useState<PriceVaultStarship[]>([]);
  const [apiStarships, setApiStarships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'owned' | 'missing'>('all');
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  // Add owner information state for the insurance report
  const [ownerInfo, setOwnerInfo] = useState({
    name: '',
    address: '',
    email: '',
    phone: ''
  });
  // Add filtering state
  const [selectedCollectionType, setSelectedCollectionType] = useState<string>('');
  const [selectedFranchise, setSelectedFranchise] = useState<string>('');
  const [allFranchises, setAllFranchises] = useState<string[]>([]);
  const [allCollectionTypes, setAllCollectionTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchStarships();
    fetchOwnerInfo();
  }, [selectedCollectionType, selectedFranchise]);

  // Fetch all available franchises and collection types once on component mount
  useEffect(() => {
    fetchAllOptions();
  }, []);

  // Function to fetch all available franchises and collection types
  const fetchAllOptions = async () => {
    try {
      const response = await fetch('/api/starships');
      
      if (!response.ok) {
        throw new Error('Failed to fetch starships');
      }
      
      const data = await response.json();
      const starships = data.data || [];
      
      // Extract unique franchises
      const franchises = Array.from(new Set(
        starships.map((ship: any) => ship.franchise || 'Unknown')
      )).sort() as string[];
      setAllFranchises(franchises);
      
      // Extract unique collection types
      const collectionTypes = Array.from(new Set(
        starships.map((ship: any) => ship.collectionType || 'Unknown')
      )).sort() as string[];
      setAllCollectionTypes(collectionTypes);
      
    } catch (err) {
      console.error('Error fetching options:', err);
    }
  };

  const fetchStarships = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build the API URL with filters
      let apiUrl = '/api/starships';
      const queryParams = [];
      
      if (selectedCollectionType) {
        queryParams.push(`collectionType=${encodeURIComponent(selectedCollectionType)}`);
      }
      
      if (selectedFranchise) {
        queryParams.push(`franchise=${encodeURIComponent(selectedFranchise)}`);
      }
      
      if (queryParams.length > 0) {
        apiUrl += `?${queryParams.join('&')}`;
      }
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch starships');
      }
      
      const data = await response.json();
      // Store the original API data
      setApiStarships(data.data || []);
      
      // Convert API starships to the format expected by PriceVault
      const convertedStarships: PriceVaultStarship[] = (data.data || []).map((ship: any) => ({
        _id: ship._id,
        issue: ship.issue,
        edition: ship.edition,
        shipName: ship.shipName,
        faction: ship.faction,
        releaseDate: ship.releaseDate ? new Date(ship.releaseDate) : undefined,
        imageUrl: ship.imageUrl,
        owned: ship.owned,
        retailPrice: ship.retailPrice,
        purchasePrice: ship.purchasePrice,
        marketValue: ship.marketValue,
        franchise: ship.franchise,
        collectionType: ship.collectionType
      }));
      setPriceVaultStarships(convertedStarships);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnerInfo = async () => {
    try {
      const response = await fetch('/api/owner-info');
      
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setOwnerInfo(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch owner info:', err);
    }
  };

  const handleSetPurchasePrices = async () => {
    setIsUpdatingPrices(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/starships/update-purchase-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to update purchase prices');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Updated purchase prices for ${data.modifiedCount} owned starships to match their RRP.`);
        // Refresh the starships data to show the updated prices
        fetchStarships();
      } else {
        setError(data.error || 'Failed to update purchase prices');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  // Function to handle filter changes from CollectionFilter component
  const handleFilterChange = (collectionType: string, franchise: string) => {
    setSelectedCollectionType(collectionType);
    setSelectedFranchise(franchise);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="w-full px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Price Vault</h1>
          <p className="text-gray-600">Track and manage the value of your collection</p>
        </div>

        {/* Collection Filter */}
        <CollectionFilter onFilterChange={handleFilterChange} className="mb-6" />

        {/* Success and error messages */}
        {success && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{success}</span>
          </div>
        )}
        
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <div className="mb-4 flex flex-wrap justify-end">
          <div className="flex space-x-2">
            <InsuranceReport starships={apiStarships} ownerInfo={ownerInfo} />
            
            <button 
              className={`px-4 py-2 rounded-md border border-indigo-500 ${isUpdatingPrices || loading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}
              onClick={handleSetPurchasePrices}
              disabled={isUpdatingPrices || loading}
              title="Set purchase prices equal to RRP for all owned ships that don't have a purchase price set"
            >
              {isUpdatingPrices ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
                  <span>Updating Prices...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <span>Set Purchase = RRP</span>
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setViewMode('all')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  viewMode === 'all'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Starships
              </button>
              <button
                onClick={() => setViewMode('owned')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  viewMode === 'owned'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Owned Only
              </button>
              <button
                onClick={() => setViewMode('missing')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  viewMode === 'missing'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Missing Only
              </button>
            </nav>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                <span className="ml-3 text-gray-600">Loading price data...</span>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            ) : (
              <PriceVault
                starships={priceVaultStarships}
                viewMode={viewMode}
                onRefresh={fetchStarships}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceVaultPage; 