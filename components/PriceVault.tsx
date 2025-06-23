import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign, faTag, faShoppingCart, faChartLine, faEdit } from '@fortawesome/free-solid-svg-icons';
import { useCurrency } from '../contexts/CurrencyContext';
import PricingEditModal from './modals/PricingEditModal';

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
  onRefresh?: () => void;
}

const PriceVault: React.FC<PriceVaultProps> = ({ starships, viewMode, onRefresh }) => {
  const { formatCurrency } = useCurrency();
  
  // Modal state
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedStarship, setSelectedStarship] = useState<Starship | null>(null);

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

  // Calculate investment return (profit/loss from market value vs purchase price)
  const totalInvestmentReturn = totalMarketValue - totalPurchasePrice;
  const investmentReturnPercentage = totalPurchasePrice > 0 
    ? Math.round((totalInvestmentReturn / totalPurchasePrice) * 100) 
    : 0;

  // Calculate savings vs retail (keep for reference but less prominent)
  const totalSavings = totalRetailPrice - totalPurchasePrice;
  const savingsPercentage = totalRetailPrice > 0 
    ? Math.round((totalSavings / totalRetailPrice) * 100) 
    : 0;

  // Handle modal actions
  const handleEditPricing = (starship: Starship) => {
    setSelectedStarship(starship);
    setShowPricingModal(true);
  };

  const handleClosePricingModal = () => {
    setShowPricingModal(false);
    setSelectedStarship(null);
  };

  const handlePricingUpdated = () => {
    if (onRefresh) {
      onRefresh();
    }
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
              <FontAwesomeIcon icon={faChartLine} className="text-purple-600" />
            </div>
            <h5 className="text-lg font-medium text-gray-800 mb-0">Investment Return</h5>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {formatCurrency(totalInvestmentReturn)}
            <span className={`text-sm font-normal ml-2 ${totalInvestmentReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({totalInvestmentReturn >= 0 ? '+' : ''}{investmentReturnPercentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
            <div 
              className={`h-2 rounded-full ${totalInvestmentReturn >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(Math.abs(investmentReturnPercentage), 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mb-0">Profit/loss vs purchase price</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center mb-2">
            <div className="rounded-full bg-yellow-100 p-2 mr-3">
              <FontAwesomeIcon icon={faDollarSign} className="text-yellow-600" />
            </div>
            <h5 className="text-lg font-medium text-gray-800 mb-0">Market Value</h5>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {formatCurrency(totalMarketValue)}
            <span className="text-sm font-normal text-gray-600 ml-2">
              (Portfolio Value)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
            <div 
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${totalMarketValue > 0 ? Math.min((totalMarketValue / Math.max(totalRetailPrice, totalMarketValue)) * 100, 100) : 0}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mb-0">Current estimated portfolio value</p>
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
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStarships.map(ship => {
                // Calculate profit/loss from investment (market value vs purchase price)
                const profitLoss = (ship.marketValue || 0) - (ship.purchasePrice || 0);
                const profitLossPercent = (ship.purchasePrice || 0) > 0 
                  ? Math.round((profitLoss / (ship.purchasePrice || 1)) * 100) 
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
                      <span className={`text-sm ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(profitLoss)} ({profitLoss >= 0 ? '+' : ''}{profitLossPercent}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleEditPricing(ship)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        title="Edit pricing for this item"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-1" />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pricing Edit Modal */}
      <PricingEditModal
        isOpen={showPricingModal}
        onClose={handleClosePricingModal}
        starship={selectedStarship}
        onPricingUpdated={handlePricingUpdated}
      />
    </div>
  );
};

export default PriceVault; 