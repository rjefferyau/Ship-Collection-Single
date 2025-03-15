import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign, faTag, faShoppingCart, faChartLine } from '@fortawesome/free-solid-svg-icons';

interface Starship {
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
}

interface PriceVaultProps {
  starships: Starship[];
  viewMode: 'all' | 'owned' | 'missing';
}

const PriceVault: React.FC<PriceVaultProps> = ({ starships, viewMode }) => {
  const [currencySettings, setCurrencySettings] = useState({
    currency: 'GBP',
    symbol: '£',
    locale: 'en-GB'
  });

  // Load currency settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('currencySettings');
      if (savedSettings) {
        setCurrencySettings(JSON.parse(savedSettings));
      }
    }
  }, []);

  // Filter starships based on viewMode
  const filteredStarships = viewMode === 'all' 
    ? starships 
    : viewMode === 'owned' 
      ? starships.filter(s => s.owned) 
      : starships.filter(s => !s.owned);

  // Calculate total retail price
  const totalRetailPrice = filteredStarships.reduce((sum, ship) => {
    return sum + (ship.retailPrice || 0);
  }, 0);

  // Calculate total purchase price
  const totalPurchasePrice = filteredStarships.reduce((sum, ship) => {
    return sum + (ship.purchasePrice || 0);
  }, 0);

  // Calculate total market value
  const totalMarketValue = filteredStarships.reduce((sum, ship) => {
    return sum + (ship.marketValue || 0);
  }, 0);

  // Calculate savings
  const totalSavings = totalRetailPrice - totalPurchasePrice;
  const savingsPercentage = totalRetailPrice > 0 
    ? Math.round((totalSavings / totalRetailPrice) * 100) 
    : 0;

  // Calculate potential profit
  const potentialProfit = totalMarketValue - totalPurchasePrice;
  const profitPercentage = totalPurchasePrice > 0 
    ? Math.round((potentialProfit / totalPurchasePrice) * 100) 
    : 0;

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return `${currencySettings.symbol}0.00`;
    
    return new Intl.NumberFormat(currencySettings.locale, {
      style: 'currency',
      currency: currencySettings.currency
    }).format(value);
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center mb-2">
            <div className="rounded-full bg-blue-100 p-2 mr-3">
              <FontAwesomeIcon icon={faTag} className="text-blue-600" />
            </div>
            <h5 className="text-lg font-medium text-gray-800 mb-0">Retail Value</h5>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(totalRetailPrice)}</div>
          <p className="text-sm text-gray-500 mb-0">Total MSRP of {filteredStarships.length} ships</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center mb-2">
            <div className="rounded-full bg-green-100 p-2 mr-3">
              <FontAwesomeIcon icon={faShoppingCart} className="text-green-600" />
            </div>
            <h5 className="text-lg font-medium text-gray-800 mb-0">Purchase Cost</h5>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(totalPurchasePrice)}</div>
          <p className="text-sm text-gray-500 mb-0">Total amount spent</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center mb-2">
            <div className="rounded-full bg-purple-100 p-2 mr-3">
              <FontAwesomeIcon icon={faDollarSign} className="text-purple-600" />
            </div>
            <h5 className="text-lg font-medium text-gray-800 mb-0">Savings</h5>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {formatCurrency(totalSavings)}
            <span className="text-sm font-normal text-green-600 ml-2">({savingsPercentage}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${Math.min(savingsPercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mb-0">Saved vs retail price</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center mb-2">
            <div className="rounded-full bg-yellow-100 p-2 mr-3">
              <FontAwesomeIcon icon={faChartLine} className="text-yellow-600" />
            </div>
            <h5 className="text-lg font-medium text-gray-800 mb-0">Market Value</h5>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {formatCurrency(totalMarketValue)}
            <span className={`text-sm font-normal ml-2 ${potentialProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({potentialProfit >= 0 ? '+' : ''}{profitPercentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
            <div 
              className={`h-2 rounded-full ${potentialProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(Math.abs(profitPercentage), 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mb-0">Current estimated value</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h5 className="font-medium text-gray-800 mb-0">Price Details</h5>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ship</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edition</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faction</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Retail Price</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Market Value</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Savings</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStarships.map(ship => {
                const savings = (ship.retailPrice || 0) - (ship.purchasePrice || 0);
                const savingsPercent = (ship.retailPrice || 0) > 0 
                  ? Math.round((savings / (ship.retailPrice || 1)) * 100) 
                  : 0;
                
                return (
                  <tr key={ship._id} className={ship.owned ? '' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{ship.shipName}</div>
                      <div className="text-sm text-gray-500">Issue: {ship.issue}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ship.edition}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ship.faction}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(ship.retailPrice)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(ship.purchasePrice)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(ship.marketValue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm ${savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(savings)} ({savingsPercent}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PriceVault; 