import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import Layout from '../components/Layout';

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

const currencyOptions: CurrencyOption[] = [
  { code: 'GBP', name: 'British Pound (UK)', symbol: '£', locale: 'en-GB' },
  { code: 'USD', name: 'US Dollar (USA)', symbol: '$', locale: 'en-US' },
  { code: 'EUR', name: 'Euro (EU)', symbol: '€', locale: 'de-DE' },
  { code: 'AUD', name: 'Australian Dollar (AU)', symbol: 'A$', locale: 'en-AU' },
  { code: 'NZD', name: 'New Zealand Dollar (NZ)', symbol: 'NZ$', locale: 'en-NZ' }
];

const CurrencySetupPage: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('GBP');
  const [showSuccess, setShowSuccess] = useState(false);

  // Load saved currency settings on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('currencySettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setSelectedCurrency(settings.currency);
    }
  }, []);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCurrency(e.target.value);
  };

  const handleSave = () => {
    const selectedOption = currencyOptions.find(option => option.code === selectedCurrency);
    
    if (selectedOption) {
      localStorage.setItem('currencySettings', JSON.stringify({
        currency: selectedOption.code,
        symbol: selectedOption.symbol,
        locale: selectedOption.locale
      }));
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <Layout activeTab="currency-setup">
      <div className="page-header">
        <h1 className="mb-4">Currency Settings</h1>
        <p className="mb-4">
          Select your preferred currency for displaying prices throughout the application.
        </p>
      </div>
      
      {showSuccess && (
        <Alert variant="success" className="mb-4">
          Currency settings saved successfully!
        </Alert>
      )}
      
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>Currency Preferences</Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Select Currency</Form.Label>
                  <Form.Select 
                    value={selectedCurrency}
                    onChange={handleCurrencyChange}
                  >
                    {currencyOptions.map(option => (
                      <option key={option.code} value={option.code}>
                        {option.name} ({option.symbol})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    This will change how prices are displayed throughout the application.
                  </Form.Text>
                </Form.Group>
                
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div>
                    <strong>Preview: </strong>
                    {currencyOptions.find(option => option.code === selectedCurrency)?.symbol}100.00
                  </div>
                  <Button variant="primary" onClick={handleSave}>
                    Save Settings
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>About Currency Settings</Card.Header>
            <Card.Body>
              <p>
                The currency setting affects how prices are displayed throughout the application, including:
              </p>
              <ul>
                <li>Retail Prices (RRP)</li>
                <li>Purchase Prices</li>
                <li>Market Values</li>
                <li>Statistics and Reports</li>
              </ul>
              <p>
                <strong>Note:</strong> This setting only changes how prices are displayed. It does not convert between currencies.
                All prices stored in the database remain in their original values.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};

export default CurrencySetupPage; 