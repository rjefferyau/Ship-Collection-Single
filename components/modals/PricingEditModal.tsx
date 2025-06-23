import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faDollarSign, faSave, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useCurrency } from '../../contexts/CurrencyContext';

interface Starship {
  _id: string;
  issue: string;
  edition: string;
  shipName: string;
  faction: string;
  retailPrice?: number;
  purchasePrice?: number;
  marketValue?: number;
}

interface PricingEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  starship: Starship | null;
  onPricingUpdated: () => void;
}

const PricingEditModal: React.FC<PricingEditModalProps> = ({
  isOpen,
  onClose,
  starship,
  onPricingUpdated
}) => {
  const { formatCurrency } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [pricingData, setPricingData] = useState({
    retailPrice: '',
    purchasePrice: '',
    marketValue: ''
  });

  // Reset form data when starship changes
  useEffect(() => {
    if (starship) {
      setPricingData({
        retailPrice: starship.retailPrice?.toString() || '',
        purchasePrice: starship.purchasePrice?.toString() || '',
        marketValue: starship.marketValue?.toString() || ''
      });
      setError(null);
      setSuccess(null);
    }
  }, [starship]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPricingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!starship) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/starships/${starship._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          retailPrice: pricingData.retailPrice ? parseFloat(pricingData.retailPrice) : undefined,
          purchasePrice: pricingData.purchasePrice ? parseFloat(pricingData.purchasePrice) : undefined,
          marketValue: pricingData.marketValue ? parseFloat(pricingData.marketValue) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update pricing');
      }

      setSuccess('Pricing updated successfully!');
      onPricingUpdated();
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!starship) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 flex items-center"
                  >
                    <FontAwesomeIcon icon={faDollarSign} className="mr-2 text-green-500" />
                    Edit Pricing
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onClick={handleClose}
                    disabled={isLoading}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                {/* Item Info */}
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <div className="font-medium text-gray-900">{starship.shipName}</div>
                  <div className="text-sm text-gray-500">
                    {starship.edition} #{starship.issue} - {starship.faction}
                  </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
                    {success}
                  </div>
                )}

                {/* Pricing Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Retail Price */}
                  <div>
                    <label htmlFor="retailPrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Retail Price (RRP)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">{formatCurrency(0).charAt(0)}</span>
                      </div>
                      <input
                        type="number"
                        id="retailPrice"
                        name="retailPrice"
                        value={pricingData.retailPrice}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        disabled={isLoading}
                        className="block w-full pl-7 pr-3 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Purchase Price */}
                  <div>
                    <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Price (I Paid)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">{formatCurrency(0).charAt(0)}</span>
                      </div>
                      <input
                        type="number"
                        id="purchasePrice"
                        name="purchasePrice"
                        value={pricingData.purchasePrice}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        disabled={isLoading}
                        className="block w-full pl-7 pr-3 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Market Value */}
                  <div>
                    <label htmlFor="marketValue" className="block text-sm font-medium text-gray-700 mb-1">
                      Market Value
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">{formatCurrency(0).charAt(0)}</span>
                      </div>
                      <input
                        type="number"
                        id="marketValue"
                        name="marketValue"
                        value={pricingData.marketValue}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        disabled={isLoading}
                        className="block w-full pl-7 pr-3 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleClose}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      disabled={isLoading}
                    >
                      <FontAwesomeIcon 
                        icon={isLoading ? faSpinner : faSave} 
                        className={`mr-2 ${isLoading ? 'animate-spin' : ''}`}
                      />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PricingEditModal; 