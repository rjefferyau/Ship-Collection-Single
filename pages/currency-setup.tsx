import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faDollarSign, faSave, faUndo, faCog } from '@fortawesome/free-solid-svg-icons';
import { useCurrency, defaultCurrencySettings } from '../contexts/CurrencyContext';

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

const CurrencySetupPage: React.FC = () => {
  const { currencySettings, setCurrencySettings, formatCurrency } = useCurrency();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Currency options
  const currencyOptions: CurrencyOption[] = [
    { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB' },
    { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
    { code: 'EUR', name: 'Euro', symbol: '€', locale: 'en-IE' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', locale: 'en-CA' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP' }
  ];
  
  // Handle currency change
  const handleCurrencyChange = (currencyCode: string) => {
    const selectedCurrency = currencyOptions.find(c => c.code === currencyCode);
    if (selectedCurrency) {
      setCurrencySettings({
        currency: selectedCurrency.code,
        symbol: selectedCurrency.symbol,
        locale: selectedCurrency.locale
      });
    }
  };
  
  // Save currency settings
  const saveCurrencySettings = () => {
    try {
      // The context automatically saves to localStorage
      setSuccess('Currency settings saved successfully. Changes will take effect immediately.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save currency settings. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Reset to defaults
  const resetToDefaults = () => {
    setCurrencySettings(defaultCurrencySettings);
    setSuccess('Currency settings reset to defaults.');
    setTimeout(() => setSuccess(null), 3000);
  };
  
  // Format example price
  const formatExamplePrice = (value: number) => {
    return formatCurrency(value);
  };
  
  return (
    <>
      <Head>
        <title>Currency Setup - CollectHub</title>
      </Head>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Currency Setup</h1>
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600">
                <FontAwesomeIcon icon={faHome} className="mr-2" /> Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <Link href="/setup" className="ml-1 text-sm font-medium text-gray-700 hover:text-indigo-600 md:ml-2">
                  <FontAwesomeIcon icon={faCog} className="mr-2" /> Setup
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                  <FontAwesomeIcon icon={faDollarSign} className="mr-2" /> Currency Setup
                </span>
              </div>
            </li>
          </ol>
        </nav>
      </div>
      
      {success && (
        <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
          {success}
        </div>
      )}
      
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-8 gap-6">
        <div className="md:col-span-6 md:col-start-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h5 className="text-lg font-medium text-gray-700 mb-0">Currency Settings</h5>
            </div>
            <div className="p-5">
              <p className="text-gray-600 mb-4">
                Select your preferred currency for displaying prices throughout the application.
                Changes will take effect immediately after saving.
              </p>
              
              <div className="mb-4">
                <label htmlFor="currency-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Currency
                </label>
                <select
                  id="currency-select"
                  value={currencySettings.currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  {currencyOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.name} ({option.symbol})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="p-4 mb-4 bg-gray-50 rounded-lg">
                <h6 className="text-sm font-medium text-gray-700 mb-2">Preview</h6>
                <div className="flex flex-col">
                  <div className="mb-2">
                    <span className="font-medium">Symbol:</span> {currencySettings.symbol}
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Code:</span> {currencySettings.currency}
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Locale:</span> {currencySettings.locale}
                  </div>
                  <div>
                    <span className="font-medium">Example Price:</span> {formatExamplePrice(19.99)}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <button 
                  onClick={resetToDefaults}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FontAwesomeIcon icon={faUndo} className="mr-2" />
                  Reset to Default
                </button>
                
                <button 
                  onClick={saveCurrencySettings}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CurrencySetupPage; 