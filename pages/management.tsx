import React, { useState, useEffect } from 'react';
import InsuranceReport from '../components/InsuranceReport';
import ConditionTracker from '../components/ConditionTracker';
import { Starship } from './api/starships';

const ManagementPage: React.FC = () => {
  const [starships, setStarships] = useState<Starship[]>([]);
  const [selectedStarshipId, setSelectedStarshipId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerInfo, setOwnerInfo] = useState({
    name: 'Your Name',
    address: 'Your Address',
    email: 'your.email@example.com',
    phone: '123-456-7890'
  });
  
  useEffect(() => {
    const fetchStarships = async () => {
      try {
        setIsLoading(true);
      const response = await fetch(`/api/starships?_t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to fetch starships');
        }
        const result = await response.json();
        // Handle the API response format which includes { success: true, data: [...] }
        const data = result.data || [];
        setStarships(data);
        
        // Select the first owned starship by default
        const ownedShips = data.filter((ship: Starship) => ship.owned);
        if (ownedShips.length > 0) {
          setSelectedStarshipId(ownedShips[0]._id);
        }
      } catch (error) {
        console.error('Error fetching starships:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStarships();
  }, []);
  
  const handleStarshipUpdate = async (updatedData: Partial<Starship>) => {
    if (!selectedStarshipId) return;
    
    try {
      const response = await fetch(`/api/starships/${selectedStarshipId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update starship');
      }
      
      const result = await response.json();
      const updatedStarship = result.data;
      
      // Update the starship in the local state
      setStarships(starships.map(ship => 
        ship._id === selectedStarshipId ? { ...ship, ...updatedData } : ship
      ));
      
      return updatedStarship;
    } catch (error) {
      console.error('Error updating starship:', error);
      throw error;
    }
  };
  
  const selectedStarship = starships.find(ship => ship._id === selectedStarshipId);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="w-full px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Management</h1>
        
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 className="text-lg font-medium text-gray-900">Owner Information</h2>
            </div>
            <div className="p-6">
              <form>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={ownerInfo.name}
                      onChange={(e) => setOwnerInfo({...ownerInfo, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={ownerInfo.email}
                      onChange={(e) => setOwnerInfo({...ownerInfo, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={ownerInfo.address}
                      onChange={(e) => setOwnerInfo({...ownerInfo, address: e.target.value})}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      id="phone"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={ownerInfo.phone}
                      onChange={(e) => setOwnerInfo({...ownerInfo, phone: e.target.value})}
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <InsuranceReport 
            starships={starships} 
            ownerInfo={ownerInfo} 
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h2 className="text-lg font-medium text-gray-900">Your Starships</h2>
              </div>
              <div className="p-6" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {isLoading ? (
                  <div className="flex justify-center items-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : (
                  <>
                    {starships.filter(ship => ship.owned).length === 0 ? (
                      <p className="text-gray-500">No owned starships found. Add some to your collection first!</p>
                    ) : (
                      <div>
                        <label htmlFor="starship-select" className="block text-sm font-medium text-gray-700 mb-1">
                          Select a starship to manage
                        </label>
                        <select
                          id="starship-select"
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          value={selectedStarshipId || ''}
                          onChange={(e) => setSelectedStarshipId(e.target.value)}
                        >
                          {starships
                            .filter(ship => ship.owned)
                            .map(ship => (
                              <option key={ship._id} value={ship._id}>
                                {ship.shipName} (Issue {ship.issue})
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="md:col-span-8">
            {selectedStarship && (
              <ConditionTracker 
                starship={selectedStarship}
                onUpdate={handleStarshipUpdate}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementPage; 