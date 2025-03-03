import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Container, Row, Col, Card, Button, Form, Alert, Breadcrumb } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faDollarSign, faSave, faUndo } from '@fortawesome/free-solid-svg-icons';

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

const CurrencySetupPage: React.FC = () => {
  const [currencySettings, setCurrencySettings] = useState({
    currency: 'GBP',
    symbol: '£',
    locale: 'en-GB'
  });
  
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
  
  // Load currency settings from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('currencySettings');
      if (savedSettings) {
        setCurrencySettings(JSON.parse(savedSettings));
      }
    }
  }, []);
  
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
  
  // Save currency settings to localStorage
  const saveCurrencySettings = () => {
    try {
      localStorage.setItem('currencySettings', JSON.stringify(currencySettings));
      setSuccess('Currency settings saved successfully. Changes will take effect immediately.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save currency settings. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Reset to defaults
  const resetToDefaults = () => {
    const defaultSettings = {
      currency: 'GBP',
      symbol: '£',
      locale: 'en-GB'
    };
    
    setCurrencySettings(defaultSettings);
    localStorage.setItem('currencySettings', JSON.stringify(defaultSettings));
    setSuccess('Currency settings reset to defaults.');
    setTimeout(() => setSuccess(null), 3000);
  };
  
  // Format example price
  const formatExamplePrice = (value: number) => {
    return new Intl.NumberFormat(currencySettings.locale, {
      style: 'currency',
      currency: currencySettings.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  return (
    <>
      <Head>
        <title>Currency Setup - Starship Collection Manager</title>
      </Head>
      
      <div className="page-header">
        <h1>Currency Setup</h1>
        <Breadcrumb>
          <Breadcrumb.Item href="/">
            <FontAwesomeIcon icon={faHome} className="me-2" /> Home
          </Breadcrumb.Item>
          <Breadcrumb.Item href="/setup">
            Setup
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            <FontAwesomeIcon icon={faDollarSign} className="me-2" /> Currency Setup
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>
      
      {success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Row>
        <Col md={8} className="mx-auto">
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Currency Settings</h5>
            </Card.Header>
            <Card.Body>
              <p>
                Select your preferred currency for displaying prices throughout the application.
                Changes will take effect immediately after saving.
              </p>
              
              <Form.Group className="mb-4">
                <Form.Label>Select Currency</Form.Label>
                <Form.Select
                  value={currencySettings.currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                >
                  {currencyOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.name} ({option.symbol})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              
              <div className="currency-preview p-3 mb-4 bg-light rounded">
                <h6>Preview</h6>
                <div className="d-flex flex-column">
                  <div className="mb-2">
                    <strong>Symbol:</strong> {currencySettings.symbol}
                  </div>
                  <div className="mb-2">
                    <strong>Code:</strong> {currencySettings.currency}
                  </div>
                  <div className="mb-2">
                    <strong>Locale:</strong> {currencySettings.locale}
                  </div>
                  <div>
                    <strong>Example Price:</strong> {formatExamplePrice(19.99)}
                  </div>
                </div>
              </div>
              
              <div className="d-flex justify-content-between">
                <Button 
                  variant="secondary" 
                  onClick={resetToDefaults}
                  className="d-flex align-items-center"
                >
                  <FontAwesomeIcon icon={faUndo} className="me-2" />
                  Reset to Default
                </Button>
                
                <Button 
                  variant="primary" 
                  onClick={saveCurrencySettings}
                  className="d-flex align-items-center"
                >
                  <FontAwesomeIcon icon={faSave} className="me-2" />
                  Save Changes
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default CurrencySetupPage; 