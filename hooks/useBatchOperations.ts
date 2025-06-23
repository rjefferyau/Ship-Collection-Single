import { useState, useEffect } from 'react';
import { Starship } from '../types';

interface Manufacturer {
  _id: string;
  name: string;
  franchises?: string[];
}

interface UseBatchOperationsProps {
  filteredStarships: Starship[];
}

interface UseBatchOperationsReturn {
  // State
  selectedStarships: string[];
  availableManufacturers: Manufacturer[];
  
  // Actions
  handleSelectionToggle: (id: string) => void;
  handleSelectAll: () => void;
  clearSelection: () => void;
  handleBatchUpdateManufacturer: (manufacturerId: string) => Promise<void>;
  handleBatchUpdateFaction: (factionId: string) => Promise<void>;
  handleBatchUpdateEdition: (editionId: string) => Promise<void>;
  handleBatchDelete: () => Promise<void>;
}

export const useBatchOperations = ({
  filteredStarships
}: UseBatchOperationsProps): UseBatchOperationsReturn => {
  const [selectedStarships, setSelectedStarships] = useState<string[]>([]);
  const [availableManufacturers, setAvailableManufacturers] = useState<Manufacturer[]>([]);
  
  // Fetch manufacturers for batch operations
  useEffect(() => {
    const fetchManufacturers = async () => {
      try {
        const response = await fetch('/api/manufacturers');
        if (response.ok) {
          const data = await response.json();
          setAvailableManufacturers(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching manufacturers:', error);
      }
    };
    
    fetchManufacturers();
  }, []);
  
  // Handle selection toggle
  const handleSelectionToggle = (id: string) => {
    setSelectedStarships(prev => 
      prev.includes(id) 
        ? prev.filter(shipId => shipId !== id) 
        : [...prev, id]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedStarships.length === filteredStarships.length) {
      // If all are selected, clear selection
      setSelectedStarships([]);
    } else {
      // Otherwise select all filtered starships
      setSelectedStarships(filteredStarships.map(ship => ship._id));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedStarships([]);
  };

  // Batch update handlers
  const handleBatchUpdateManufacturer = async (manufacturerId: string) => {
    try {
      const response = await fetch('/api/starships/update-manufacturers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          starshipIds: selectedStarships,
          manufacturerId
        })
      });
      
      if (response.ok) {
        alert(`Updated manufacturer for ${selectedStarships.length} starships`);
        setSelectedStarships([]);
        return Promise.resolve();
      } else {
        throw new Error('Failed to update manufacturers');
      }
    } catch (error) {
      console.error('Error updating manufacturers:', error);
      alert('Error updating manufacturers');
      return Promise.reject(error);
    }
  };

  const handleBatchUpdateFaction = async (factionId: string) => {
    try {
      const response = await fetch('/api/starships/update-factions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          starshipIds: selectedStarships,
          factionId
        })
      });
      
      if (response.ok) {
        alert(`Updated faction for ${selectedStarships.length} starships`);
        setSelectedStarships([]);
        return Promise.resolve();
      } else {
        throw new Error('Failed to update factions');
      }
    } catch (error) {
      console.error('Error updating factions:', error);
      alert('Error updating factions');
      return Promise.reject(error);
    }
  };

  const handleBatchUpdateEdition = async (editionId: string) => {
    try {
      const response = await fetch('/api/starships/update-editions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          starshipIds: selectedStarships,
          editionId
        })
      });
      
      if (response.ok) {
        alert(`Updated edition for ${selectedStarships.length} starships`);
        setSelectedStarships([]);
        return Promise.resolve();
      } else {
        throw new Error('Failed to update editions');
      }
    } catch (error) {
      console.error('Error updating editions:', error);
      alert('Error updating editions');
      return Promise.reject(error);
    }
  };

  const handleBatchDelete = async () => {
    try {
      const deletePromises = selectedStarships.map(id => 
        fetch(`/api/starships/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      
      alert(`Deleted ${selectedStarships.length} starships`);
      setSelectedStarships([]);
      return Promise.resolve();
    } catch (error) {
      console.error('Error deleting starships:', error);
      alert('Error deleting starships');
      return Promise.reject(error);
    }
  };

  return {
    // State
    selectedStarships,
    availableManufacturers,
    
    // Actions
    handleSelectionToggle,
    handleSelectAll,
    clearSelection,
    handleBatchUpdateManufacturer,
    handleBatchUpdateFaction,
    handleBatchUpdateEdition,
    handleBatchDelete
  };
}; 