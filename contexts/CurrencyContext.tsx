import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define the currency settings type
export interface CurrencySettings {
  currency: string;
  symbol: string;
  locale: string;
}

// Default currency settings
export const defaultCurrencySettings: CurrencySettings = {
  currency: 'GBP',
  symbol: '£',
  locale: 'en-GB'
};

// Create the context
interface CurrencyContextType {
  currencySettings: CurrencySettings;
  setCurrencySettings: (settings: CurrencySettings) => void;
  formatCurrency: (value: number | undefined) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Provider component
interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings>(defaultCurrencySettings);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load currency settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('currencySettings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setCurrencySettings(parsedSettings);
        } catch (error) {
          console.error('Error parsing currency settings:', error);
          // If there's an error, reset to defaults
          localStorage.setItem('currencySettings', JSON.stringify(defaultCurrencySettings));
        }
      }
      setIsInitialized(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem('currencySettings', JSON.stringify(currencySettings));
    }
  }, [currencySettings, isInitialized]);

  // Format currency helper function
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return '-';
    
    return new Intl.NumberFormat(currencySettings.locale, {
      style: 'currency',
      currency: currencySettings.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <CurrencyContext.Provider value={{ currencySettings, setCurrencySettings, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom hook to use the currency context
export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}; 