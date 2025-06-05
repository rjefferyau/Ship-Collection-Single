import React, { useEffect, useState } from 'react';
import { Starship } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';

interface ExcelViewProps {
  starships: Starship[];
  onClose: () => void;
}

const ExcelView: React.FC<ExcelViewProps> = ({ starships, onClose }) => {
  const { formatCurrency } = useCurrency();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  // Extract unique values for column filters (not used in UI but could be used for future features)
  const factions = Array.from(new Set(starships.map(ship => ship.faction))).sort();
  const editions = Array.from(new Set(starships.map(ship => ship.edition))).sort();
  
  const handleFullscreen = () => {
    const elem = document.documentElement;
    
    if (!isFullscreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };
  
  // Get current date and time for Excel header
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white text-xs">
      {/* Excel-like ribbon */}
      <div className="bg-[#f3f2f1] border-b border-gray-300">
        <div className="flex items-center p-1 border-b border-gray-300">
          <div className="flex space-x-1 text-xs">
            <button className="px-2 py-1 hover:bg-gray-200 rounded" onClick={onClose}>File</button>
            <button className="px-2 py-1 hover:bg-gray-200 rounded">Home</button>
            <button className="px-2 py-1 hover:bg-gray-200 rounded">Insert</button>
            <button className="px-2 py-1 hover:bg-gray-200 rounded">Page Layout</button>
            <button className="px-2 py-1 hover:bg-gray-200 rounded">Formulas</button>
            <button className="px-2 py-1 hover:bg-gray-200 rounded">Data</button>
            <button className="px-2 py-1 hover:bg-gray-200 rounded">Review</button>
            <button className="px-2 py-1 hover:bg-gray-200 rounded">View</button>
            <button className="px-2 py-1 hover:bg-gray-200 rounded">Help</button>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <span className="text-xs text-gray-600">{`Ship Collection - Excel`}</span>
            <button 
              className="p-1 hover:bg-gray-200 rounded"
              onClick={handleFullscreen}
            >
              {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              )}
            </button>
            <button 
              className="p-1 hover:bg-gray-200 rounded"
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Formatting toolbar */}
        <div className="flex p-1 text-xs items-center">
          <div className="flex space-x-2 mr-4">
            <select className="border border-gray-300 rounded px-1 py-0.5 bg-white">
              <option>Calibri</option>
            </select>
            <select className="border border-gray-300 rounded px-1 py-0.5 w-12 bg-white">
              <option>11</option>
            </select>
          </div>
          
          <div className="flex space-x-1 border-l border-r border-gray-300 px-2">
            <button className="p-1 hover:bg-gray-200 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12M6 18h12" />
              </svg>
            </button>
            <button className="p-1 hover:bg-gray-200 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 18h14M5 6h14" />
              </svg>
            </button>
            <button className="p-1 hover:bg-gray-200 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6M9 16h6M9 8h6" />
              </svg>
            </button>
          </div>
          
          <div className="flex space-x-1 px-2">
            <button className="p-1 hover:bg-gray-200 rounded font-bold">B</button>
            <button className="p-1 hover:bg-gray-200 rounded italic">I</button>
            <button className="p-1 hover:bg-gray-200 rounded underline">U</button>
          </div>
          
          <div className="flex space-x-1 border-l border-r border-gray-300 px-2">
            <button className="p-1 hover:bg-gray-200 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button className="p-1 hover:bg-gray-200 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="p-1 hover:bg-gray-200 rounded">%</button>
            <button className="p-1 hover:bg-gray-200 rounded">.0</button>
            <button className="p-1 hover:bg-gray-200 rounded">.00</button>
          </div>
          
          <div className="ml-auto flex items-center space-x-2 text-gray-600">
            <span>{dateStr}</span>
            <span>{timeStr}</span>
            <span>User: Admin</span>
          </div>
        </div>
      </div>
      
      {/* Formula bar */}
      <div className="bg-white border-b border-gray-300 flex items-center px-2 py-1">
        <div className="w-8 mr-2 text-center border-r border-gray-300">fx</div>
        <input
          type="text"
          className="flex-grow border border-gray-300 px-2 py-0.5 bg-white"
          placeholder='=FILTER(A2:H100,C2:C100="Owned")'
          readOnly
        />
      </div>
      
      {/* Excel grid */}
      <div className="flex-grow overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[#f3f2f1]">
              <th className="border border-gray-300 px-2 py-1 w-10 bg-[#e6e6e6]">
                <div className="w-full h-full"></div>
              </th>
              <th className="border border-gray-300 px-2 py-1 w-16 bg-[#e6e6e6]">A</th>
              <th className="border border-gray-300 px-2 py-1 w-16 bg-[#e6e6e6]">B</th>
              <th className="border border-gray-300 px-2 py-1 w-32 bg-[#e6e6e6]">C</th>
              <th className="border border-gray-300 px-2 py-1 w-28 bg-[#e6e6e6]">D</th>
              <th className="border border-gray-300 px-2 py-1 w-24 bg-[#e6e6e6]">E</th>
              <th className="border border-gray-300 px-2 py-1 w-20 bg-[#e6e6e6]">F</th>
              <th className="border border-gray-300 px-2 py-1 w-20 bg-[#e6e6e6]">G</th>
              <th className="border border-gray-300 px-2 py-1 w-20 bg-[#e6e6e6]">H</th>
            </tr>
            <tr className="bg-[#f3f2f1] font-semibold">
              <th className="border border-gray-300 px-2 py-1 bg-[#e6e6e6]">1</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Issue</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Edition</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Ship Name</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Faction</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Retail Price</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Purchase Price</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Status</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {starships.map((ship, index) => (
              <tr key={ship._id} className={index % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'}>
                <td className="border border-gray-300 px-2 py-1 bg-[#e6e6e6] font-semibold">{index + 2}</td>
                <td className="border border-gray-300 px-2 py-1">{ship.issue}</td>
                <td className="border border-gray-300 px-2 py-1">{ship.edition}</td>
                <td className="border border-gray-300 px-2 py-1">{ship.shipName}</td>
                <td className="border border-gray-300 px-2 py-1">{ship.faction}</td>
                <td className="border border-gray-300 px-2 py-1">{formatCurrency(ship.retailPrice)}</td>
                <td className="border border-gray-300 px-2 py-1">{formatCurrency(ship.purchasePrice)}</td>
                <td className="border border-gray-300 px-2 py-1">
                  {ship.owned ? 'Owned' : ship.onOrder ? 'On Order' : ship.wishlist ? 'Wishlist' : 'Not Owned'}
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {ship.sightings && ship.sightings.length > 0 ? ship.sightings[0].notes || '' : ''}
                </td>
              </tr>
            ))}
            {/* Add some empty rows to fill the space */}
            {Array.from({ length: Math.max(0, 20 - starships.length) }).map((_, index) => (
              <tr key={`empty-${index}`}>
                <td className="border border-gray-300 px-2 py-1 bg-[#e6e6e6] font-semibold">{starships.length + index + 2}</td>
                <td className="border border-gray-300 px-2 py-1"></td>
                <td className="border border-gray-300 px-2 py-1"></td>
                <td className="border border-gray-300 px-2 py-1"></td>
                <td className="border border-gray-300 px-2 py-1"></td>
                <td className="border border-gray-300 px-2 py-1"></td>
                <td className="border border-gray-300 px-2 py-1"></td>
                <td className="border border-gray-300 px-2 py-1"></td>
                <td className="border border-gray-300 px-2 py-1"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Status bar */}
      <div className="bg-[#f3f2f1] border-t border-gray-300 flex justify-between items-center px-4 py-1 text-xs text-gray-600">
        <div className="flex space-x-4">
          <span>Ready</span>
          <span>Owned: {starships.filter(s => s.owned).length}</span>
          <span>Not Owned: {starships.filter(s => !s.owned).length}</span>
          <span>Total: {starships.length}</span>
        </div>
        <div className="flex space-x-4">
          <span>Sheet 1</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};

export default ExcelView; 