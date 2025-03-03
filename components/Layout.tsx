import React, { ReactNode, useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Link from 'next/link';

interface LayoutProps {
  children: ReactNode;
  activeTab?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab = 'collection' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [setupSubmenuOpen, setSetupSubmenuOpen] = useState(false);
  const [navIcons, setNavIcons] = useState<Record<string, string>>({
    collection: 'fa-space-shuttle',
    'fancy-view': 'fa-images',
    statistics: 'fa-chart-bar',
    setup: 'fa-cog'
  });
  
  // Load icons from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedIcons = localStorage.getItem('navIcons');
      if (savedIcons) {
        setNavIcons(JSON.parse(savedIcons));
      }
    }
  }, []);
  
  // Open setup submenu if any setup page is active
  useEffect(() => {
    if (activeTab === 'setup' || 
        activeTab === 'icon-setup' || 
        activeTab === 'faction-setup' || 
        activeTab === 'edition-setup' || 
        activeTab === 'import-export') {
      setSetupSubmenuOpen(true);
    }
  }, [activeTab]);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const toggleSetupSubmenu = () => {
    setSetupSubmenuOpen(!setupSubmenuOpen);
  };
  
  return (
    <div className="wrapper">
      {/* Mobile header with menu toggle */}
      <div className="d-md-none bg-primary text-white p-2 d-flex align-items-center">
        <button 
          className="btn btn-link text-white p-0 me-3" 
          onClick={toggleSidebar}
        >
          <i className="fa-solid fa-bars"></i>
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
              <i className={`fa-solid ${navIcons.collection} me-2`}></i>
              <span>Collection</span>
            </Link>
            <Link 
              href="/fancy-view" 
              className={`nav-link ${activeTab === 'fancy-view' ? 'active' : ''}`}
            >
              <i className={`fa-solid ${navIcons['fancy-view']} me-2`}></i>
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
              <i className={`fa-solid ${navIcons.statistics} me-2`}></i>
              <span>Statistics</span>
            </Link>
          </div>
        </div>
        
        <div className="nav-section">
          <div className="nav-section-title">Configuration</div>
          <div className="nav flex-column nav-pills">
            <div className={`nav-item submenu-container ${setupSubmenuOpen ? 'open' : ''}`}>
              <div 
                className={`nav-link setup-nav-link d-flex justify-content-between align-items-center ${
                  activeTab === 'setup' || 
                  activeTab === 'icon-setup' || 
                  activeTab === 'faction-setup' || 
                  activeTab === 'edition-setup' || 
                  activeTab === 'import-export' ? 'active' : ''
                }`}
                onClick={toggleSetupSubmenu}
                style={{ cursor: 'pointer' }}
              >
                <div>
                  <i className={`fa-solid ${navIcons.setup} me-2`}></i>
                  <span>Setup</span>
                </div>
                <i className={`fa-solid ${setupSubmenuOpen ? 'fa-chevron-down' : 'fa-chevron-right'} ms-2`}></i>
              </div>
              
              <div className={`custom-submenu ${setupSubmenuOpen ? 'show' : ''}`}>
                <Link 
                  href="/setup" 
                  className={`custom-submenu-link ${activeTab === 'setup' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-home me-2"></i>
                  <span>Overview</span>
                </Link>
                <Link 
                  href="/icon-setup" 
                  className={`custom-submenu-link ${activeTab === 'icon-setup' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-icons me-2"></i>
                  <span>Icons</span>
                </Link>
                <Link 
                  href="/faction-setup" 
                  className={`custom-submenu-link ${activeTab === 'faction-setup' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-users me-2"></i>
                  <span>Factions</span>
                </Link>
                <Link 
                  href="/edition-setup" 
                  className={`custom-submenu-link ${activeTab === 'edition-setup' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-book me-2"></i>
                  <span>Editions</span>
                </Link>
                <Link 
                  href="/import-export" 
                  className={`custom-submenu-link ${activeTab === 'import-export' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-file-import me-2"></i>
                  <span>Import/Export</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default Layout; 