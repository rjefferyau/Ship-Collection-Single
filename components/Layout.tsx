import React, { ReactNode, useState } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faSpaceShuttle, 
  faChartBar, 
  faImages, 
  faCog, 
  faBars,
  faTachometerAlt,
  faDatabase,
  faWrench
} from '@fortawesome/free-solid-svg-icons';

interface LayoutProps {
  children: ReactNode;
  activeTab?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab = 'collection' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Mobile header with menu toggle */}
      <div className="d-md-none bg-primary text-white p-2 d-flex align-items-center">
        <button 
          className="btn btn-link text-white p-0 me-3" 
          onClick={toggleSidebar}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <h5 className="mb-0">Starship Collection</h5>
      </div>
      
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'show' : ''}`}>
        <div className="sidebar-header d-flex align-items-center justify-content-between">
          <h4 className="sidebar-brand">Starship Collection</h4>
        </div>
        
        <div className="nav-section">
          <div className="nav-section-title">Main</div>
          <div className="nav flex-column nav-pills">
            <Link 
              href="/" 
              className={`nav-link ${activeTab === 'collection' ? 'active' : ''}`}
            >
              <FontAwesomeIcon icon={faSpaceShuttle} className="me-2" /> 
              <span>Collection</span>
            </Link>
            <Link 
              href="/fancy-view" 
              className={`nav-link ${activeTab === 'fancy-view' ? 'active' : ''}`}
            >
              <FontAwesomeIcon icon={faImages} className="me-2" /> 
              <span>Gallery</span>
            </Link>
          </div>
        </div>
        
        <div className="nav-section">
          <div className="nav-section-title">Analytics</div>
          <div className="nav flex-column nav-pills">
            <Link 
              href="/statistics" 
              className={`nav-link ${activeTab === 'statistics' ? 'active' : ''}`}
            >
              <FontAwesomeIcon icon={faChartBar} className="me-2" /> 
              <span>Statistics</span>
            </Link>
          </div>
        </div>
        
        <div className="nav-section">
          <div className="nav-section-title">Configuration</div>
          <div className="nav flex-column nav-pills">
            <Link 
              href="/setup" 
              className={`nav-link ${activeTab === 'setup' ? 'active' : ''}`}
            >
              <FontAwesomeIcon icon={faCog} className="me-2" /> 
              <span>Setup</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="main-content">
        {children}
      </div>

      {/* Footer */}
      <footer className="footer">
        <Container>
          <Row>
            <Col className="text-center">
              <p className="mb-0">Starship Collection Manager &copy; {new Date().getFullYear()}</p>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default Layout; 