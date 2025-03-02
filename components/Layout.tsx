import React, { ReactNode } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faSpaceShuttle, faChartBar, faImages, faCog, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: ReactNode;
  activeTab?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab = 'collection' }) => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Sidebar */}
      <div className="sidebar p-3">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0">Starship Collection</h4>
          <div className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            <FontAwesomeIcon 
              icon={theme === 'light' ? faMoon : faSun} 
              className={`theme-icon ${theme === 'light' ? 'text-dark' : 'text-warning'}`} 
            />
          </div>
        </div>
        <div className="nav flex-column nav-pills">
          <Link 
            href="/" 
            className={`nav-link ${activeTab === 'collection' ? 'active' : ''}`}
          >
            <FontAwesomeIcon icon={faSpaceShuttle} className="me-2" /> Collection
          </Link>
          <Link 
            href="/fancy-view" 
            className={`nav-link ${activeTab === 'fancy-view' ? 'active' : ''}`}
          >
            <FontAwesomeIcon icon={faImages} className="me-2" /> Gallery
          </Link>
          <Link 
            href="/statistics" 
            className={`nav-link ${activeTab === 'statistics' ? 'active' : ''}`}
          >
            <FontAwesomeIcon icon={faChartBar} className="me-2" /> Statistics
          </Link>
          <Link 
            href="/setup" 
            className={`nav-link ${activeTab === 'setup' ? 'active' : ''}`}
          >
            <FontAwesomeIcon icon={faCog} className="me-2" /> Setup
          </Link>
        </div>
      </div>

      {/* Main content area */}
      <div className="content-area">
        {children}
      </div>

      {/* Footer */}
      <footer className="bg-dark text-light p-3 text-center">
        <Container>
          <p className="mb-0">Starship Collection Manager &copy; {new Date().getFullYear()}</p>
        </Container>
      </footer>
    </div>
  );
};

export default Layout; 