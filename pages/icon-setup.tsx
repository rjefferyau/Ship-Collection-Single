import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, ListGroup } from 'react-bootstrap';
import Layout from '../components/Layout';

// Define navigation items
const navigationItems = [
  { id: 'collection', label: 'Collection', defaultIcon: 'fa-space-shuttle' },
  { id: 'fancy-view', label: 'Gallery', defaultIcon: 'fa-images' },
  { id: 'statistics', label: 'Statistics', defaultIcon: 'fa-chart-bar' },
  { id: 'price-vault', label: 'Price Vault', defaultIcon: 'fa-dollar-sign' },
  { id: 'wishlist', label: 'Wishlist', defaultIcon: 'fa-star' },
  { id: 'setup', label: 'Setup', defaultIcon: 'fa-cog' }
];

// Popular Font Awesome icons that might be suitable for navigation
const popularIcons = [
  'fa-space-shuttle', 'fa-rocket', 'fa-star', 'fa-planet-ringed', 'fa-galaxy',
  'fa-starship', 'fa-starfighter', 'fa-satellite', 'fa-user-astronaut',
  'fa-space-station-moon', 'fa-meteor', 'fa-moon', 'fa-sun', 'fa-solar-system',
  'fa-alien', 'fa-robot', 'fa-ufo', 'fa-radar', 'fa-telescope',
  'fa-images', 'fa-image', 'fa-photo-film', 'fa-camera', 'fa-film',
  'fa-chart-bar', 'fa-chart-line', 'fa-chart-pie', 'fa-chart-simple', 'fa-analytics',
  'fa-cog', 'fa-gear', 'fa-wrench', 'fa-screwdriver-wrench', 'fa-sliders',
  'fa-home', 'fa-dashboard', 'fa-tachometer-alt', 'fa-gauge', 'fa-compass'
];

const IconSetupPage: React.FC = () => {
  // State to store selected icons for each navigation item
  const [selectedIcons, setSelectedIcons] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredIcons, setFilteredIcons] = useState(popularIcons);
  const [selectedNavItem, setSelectedNavItem] = useState<string | null>(null);
  
  // Load saved icons from localStorage on component mount
  useEffect(() => {
    const savedIcons = localStorage.getItem('navIcons');
    if (savedIcons) {
      setSelectedIcons(JSON.parse(savedIcons));
    } else {
      // Initialize with default icons
      const defaults = navigationItems.reduce((acc, item) => {
        acc[item.id] = item.defaultIcon;
        return acc;
      }, {} as Record<string, string>);
      setSelectedIcons(defaults);
    }
  }, []);
  
  // Filter icons based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredIcons(popularIcons);
      return;
    }
    
    const filtered = popularIcons.filter(icon => 
      icon.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredIcons(filtered);
  }, [searchTerm]);
  
  // Handle icon selection
  const handleIconSelect = (navId: string, iconClass: string) => {
    const newSelectedIcons = { ...selectedIcons, [navId]: iconClass };
    setSelectedIcons(newSelectedIcons);
    localStorage.setItem('navIcons', JSON.stringify(newSelectedIcons));
  };
  
  // Handle save all changes
  const handleSaveChanges = () => {
    localStorage.setItem('navIcons', JSON.stringify(selectedIcons));
    alert('Navigation icons saved successfully!');
  };
  
  return (
    <Layout activeTab="icon-setup">
      <div className="page-header">
        <h1 className="mb-4">Navigation Icon Setup</h1>
        <p className="mb-4">
          Select Font Awesome icons for each navigation item. Changes are automatically saved to your browser's local storage.
        </p>
      </div>
      
      <Row className="mb-4">
        <Col>
          <div className="alert alert-info">
            <i className="fa-solid fa-info-circle me-2"></i>
            {selectedNavItem ? (
              <>
                Select an icon for <strong>{navigationItems.find(item => item.id === selectedNavItem)?.label}</strong>. 
                Current icon: <i className={`fa-solid ${selectedIcons[selectedNavItem] || navigationItems.find(item => item.id === selectedNavItem)?.defaultIcon} ms-2`}></i>
              </>
            ) : (
              <>Click on a navigation item to change its icon.</>
            )}
          </div>
        </Col>
      </Row>
      
      <Row>
        <Col md={4} className="mb-4">
          <Card>
            <Card.Header>Navigation Items</Card.Header>
            <ListGroup variant="flush">
              {navigationItems.map(item => (
                <ListGroup.Item 
                  key={item.id}
                  action
                  active={selectedNavItem === item.id}
                  onClick={() => setSelectedNavItem(item.id)}
                  className="d-flex align-items-center"
                >
                  <i className={`fa-solid ${selectedIcons[item.id] || item.defaultIcon} me-2`}></i>
                  <span>{item.label}</span>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <span>Available Icons</span>
                <Form.Control 
                  type="text" 
                  placeholder="Search icons..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-50"
                />
              </div>
            </Card.Header>
            <Card.Body>
              <div className="icon-grid">
                <Row>
                  {filteredIcons.map(icon => (
                    <Col key={icon} xs={4} sm={3} md={2} className="mb-3 text-center">
                      <div 
                        className={`icon-item p-2 ${selectedNavItem && selectedIcons[selectedNavItem] === icon ? 'selected' : ''}`}
                        onClick={() => selectedNavItem && handleIconSelect(selectedNavItem, icon)}
                      >
                        <i className={`fa-solid ${icon} fa-2x mb-2`}></i>
                        <div className="small text-truncate">{icon}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </Card.Body>
            <Card.Footer className="text-end">
              <Button variant="primary" onClick={handleSaveChanges}>
                Save Changes
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      
      <style jsx>{`
        .icon-grid {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .icon-item {
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .icon-item:hover {
          background-color: #f8f9fa;
          transform: scale(1.05);
        }
        
        .icon-item.selected {
          background-color: #e9f5ff;
          border: 2px solid #0d6efd !important;
          transform: scale(1.05);
        }
      `}</style>
    </Layout>
  );
};

export default IconSetupPage; 