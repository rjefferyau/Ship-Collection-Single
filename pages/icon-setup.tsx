import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faIcons, faSave, faUndo, faCog } from '@fortawesome/free-solid-svg-icons';

interface IconOption {
  value: string;
  label: string;
}

const IconSetupPage: React.FC = () => {
  const [navIcons, setNavIcons] = useState<Record<string, string>>({
    collection: 'fa-space-shuttle',
    'fancy-view': 'fa-images',
    statistics: 'fa-chart-bar',
    'price-vault': 'fa-dollar-sign',
    wishlist: 'fa-star',
    setup: 'fa-cog',
    management: 'fa-clipboard-list'
  });
  
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Icon options for each navigation item
  const iconOptions: Record<string, IconOption[]> = {
    collection: [
      { value: 'fa-space-shuttle', label: 'Space Shuttle' },
      { value: 'fa-rocket', label: 'Rocket' },
      { value: 'fa-ship', label: 'Ship' },
      { value: 'fa-database', label: 'Database' },
      { value: 'fa-list', label: 'List' }
    ],
    'fancy-view': [
      { value: 'fa-images', label: 'Images' },
      { value: 'fa-image', label: 'Image' },
      { value: 'fa-th', label: 'Grid' },
      { value: 'fa-th-large', label: 'Large Grid' },
      { value: 'fa-camera', label: 'Camera' }
    ],
    statistics: [
      { value: 'fa-chart-bar', label: 'Bar Chart' },
      { value: 'fa-chart-pie', label: 'Pie Chart' },
      { value: 'fa-chart-line', label: 'Line Chart' },
      { value: 'fa-analytics', label: 'Analytics' },
      { value: 'fa-tachometer-alt', label: 'Dashboard' }
    ],
    'price-vault': [
      { value: 'fa-dollar-sign', label: 'Dollar Sign' },
      { value: 'fa-money-bill-wave', label: 'Money Bill' },
      { value: 'fa-coins', label: 'Coins' },
      { value: 'fa-piggy-bank', label: 'Piggy Bank' },
      { value: 'fa-cash-register', label: 'Cash Register' }
    ],
    wishlist: [
      { value: 'fa-star', label: 'Star' },
      { value: 'fa-heart', label: 'Heart' },
      { value: 'fa-bookmark', label: 'Bookmark' },
      { value: 'fa-shopping-cart', label: 'Shopping Cart' },
      { value: 'fa-gift', label: 'Gift' }
    ],
    setup: [
      { value: 'fa-cog', label: 'Cog' },
      { value: 'fa-tools', label: 'Tools' },
      { value: 'fa-sliders-h', label: 'Sliders' },
      { value: 'fa-wrench', label: 'Wrench' },
      { value: 'fa-screwdriver', label: 'Screwdriver' }
    ],
    management: [
      { value: 'fa-clipboard-list', label: 'Clipboard List' },
      { value: 'fa-tasks', label: 'Tasks' },
      { value: 'fa-clipboard-check', label: 'Clipboard Check' },
      { value: 'fa-file-invoice', label: 'Invoice' },
      { value: 'fa-id-card', label: 'ID Card' },
      { value: 'fa-shield-alt', label: 'Shield' },
      { value: 'fa-certificate', label: 'Certificate' }
    ]
  };
  
  // Load icons from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedIcons = localStorage.getItem('navIcons');
      if (savedIcons) {
        setNavIcons(JSON.parse(savedIcons));
      }
    }
  }, []);
  
  // Handle icon change
  const handleIconChange = (navItem: string, iconValue: string) => {
    setNavIcons({
      ...navIcons,
      [navItem]: iconValue
    });
  };
  
  // Save icons to localStorage
  const saveIcons = () => {
    try {
      localStorage.setItem('navIcons', JSON.stringify(navIcons));
      setSuccess('Icons saved successfully. Changes will take effect immediately.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save icons. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Reset to defaults
  const resetToDefaults = () => {
    const defaultIcons = {
      collection: 'fa-space-shuttle',
      'fancy-view': 'fa-images',
      statistics: 'fa-chart-bar',
      'price-vault': 'fa-dollar-sign',
      wishlist: 'fa-star',
      setup: 'fa-cog',
      management: 'fa-clipboard-list'
    };
    
    setNavIcons(defaultIcons);
    localStorage.setItem('navIcons', JSON.stringify(defaultIcons));
    setSuccess('Icons reset to defaults.');
    setTimeout(() => setSuccess(null), 3000);
  };
  
  return (
    <>
      <Head>
        <title>Icon Setup - Starship Collection Manager</title>
      </Head>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Icon Setup</h1>
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600">
                <FontAwesomeIcon icon={faHome} className="mr-2" /> Home
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <a href="/setup" className="ml-1 text-sm font-medium text-gray-700 hover:text-indigo-600 md:ml-2">
                  <FontAwesomeIcon icon={faCog} className="mr-2" /> Setup
                </a>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                  <FontAwesomeIcon icon={faIcons} className="mr-2" /> Icon Setup
                </span>
              </div>
            </li>
          </ol>
        </nav>
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
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Navigation Icons</h5>
        </Card.Header>
        <Card.Body>
          <p>
            Customize the icons used in the navigation menu. Changes will take effect immediately after saving.
          </p>
          
          <Row>
            {Object.keys(navIcons).map((navItem) => (
              <Col md={4} key={navItem} className="mb-4">
                <Card>
                  <Card.Header>
                    <h6 className="mb-0 text-capitalize">
                      {navItem === 'fancy-view' ? 'Gallery' : 
                       navItem === 'price-vault' ? 'Price Vault' : navItem}
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="text-center mb-3">
                      <div className="icon-preview">
                        <i className={`fa-solid ${navIcons[navItem]} fa-2x`}></i>
                      </div>
                    </div>
                    
                    <Form.Group>
                      <Form.Label>Select Icon</Form.Label>
                      <Form.Select
                        value={navIcons[navItem]}
                        onChange={(e) => handleIconChange(navItem, e.target.value)}
                      >
                        {iconOptions[navItem].map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          
          <div className="d-flex justify-content-between mt-4">
            <Button 
              variant="secondary" 
              onClick={resetToDefaults}
              className="d-flex align-items-center"
            >
              <FontAwesomeIcon icon={faUndo} className="me-2" />
              Reset to Defaults
            </Button>
            
            <Button 
              variant="primary" 
              onClick={saveIcons}
              className="d-flex align-items-center"
            >
              <FontAwesomeIcon icon={faSave} className="me-2" />
              Save Changes
            </Button>
          </div>
        </Card.Body>
      </Card>
      
      <style jsx>{`
        .icon-preview {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: #007bff;
          color: white;
          margin: 0 auto;
        }
      `}</style>
    </>
  );
};

export default IconSetupPage; 