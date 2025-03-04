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
    'price-vault': 'fa-dollar-sign',
    wishlist: 'fa-star',
    setup: 'fa-cog',
    'management': 'fa-clipboard-list'
  });
  
  // Load icons from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedIcons = localStorage.getItem('navIcons');
      if (savedIcons) {
        setNavIcons(JSON.parse(savedIcons));
      }
      
      // Set default currency if not already set
      if (!localStorage.getItem('currencySettings')) {
        localStorage.setItem('currencySettings', JSON.stringify({
          currency: 'GBP',
          symbol: '£',
          locale: 'en-GB'
        }));
      }
    }
  }, []);
  
  // Open setup submenu if any setup page is active
  useEffect(() => {
    if (activeTab === 'setup' || 
        activeTab === 'icon-setup' || 
        activeTab === 'faction-setup' || 
        activeTab === 'edition-setup' || 
        activeTab === 'import-export' ||
        activeTab === 'currency-setup') {
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
          {/* Close button for mobile view */}
          <button 
            className="btn btn-link text-white p-0 d-md-none" 
            onClick={toggleSidebar}
          >
            <i className="fa-solid fa-times"></i>
          </button>
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
            <Link 
              href="/wishlist" 
              className={`nav-link ${activeTab === 'wishlist' ? 'active' : ''}`}
            >
              <i className={`fa-solid ${navIcons.wishlist} me-2`}></i>
              <span>Wishlist</span>
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
            <Link 
              href="/price-vault" 
              className={`nav-link ${activeTab === 'price-vault' ? 'active' : ''}`}
            >
              <i className={`fa-solid ${navIcons['price-vault']} me-2`}></i>
              <span>Price Vault</span>
            </Link>
            <Link 
              href="/management" 
              className={`nav-link ${activeTab === 'management' ? 'active' : ''}`}
            >
              <i className={`fa-solid ${navIcons['management']} me-2`}></i>
              <span>Management</span>
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
                  activeTab === 'import-export' ||
                  activeTab === 'currency-setup' ? 'active' : ''
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
                <Link 
                  href="/currency-setup" 
                  className={`custom-submenu-link ${activeTab === 'currency-setup' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-dollar-sign me-2"></i>
                  <span>Currency</span>
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
      
      <style jsx>{`
        .wrapper {
          display: flex;
          min-height: 100vh;
        }
        
        .sidebar {
          width: 250px;
          background-color: #343a40;
          color: #fff;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 100;
          transition: all 0.3s;
          overflow-y: auto;
          padding: 1rem 0;
        }
        
        @media (max-width: 767.98px) {
          .sidebar {
            margin-left: -250px;
          }
          
          .sidebar.show {
            margin-left: 0;
          }
        }
        
        .sidebar-header {
          padding: 0 1rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 1rem;
        }
        
        .sidebar-brand {
          margin-bottom: 0;
          font-size: 1.25rem;
          color: #fff;
        }
        
        .nav-section {
          margin-bottom: 1.5rem;
        }
        
        .nav-section-title {
          text-transform: uppercase;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          padding: 0 1rem;
          margin-bottom: 0.5rem;
        }
        
        .nav-link {
          color: rgba(255, 255, 255, 0.75);
          padding: 0.5rem 1rem;
          transition: all 0.2s;
        }
        
        .nav-link:hover {
          color: #fff;
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .nav-link.active {
          color: #fff;
          background-color: #007bff;
        }
        
        .custom-submenu {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out;
        }
        
        .custom-submenu.show {
          max-height: 500px;
        }
        
        .custom-submenu-link {
          display: block;
          padding: 0.5rem 1rem 0.5rem 2.5rem;
          color: rgba(255, 255, 255, 0.75);
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .custom-submenu-link:hover {
          color: #fff;
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .custom-submenu-link.active {
          color: #fff;
          background-color: rgba(0, 123, 255, 0.5);
        }
        
        .main-content {
          flex: 1;
          padding: 2rem;
          margin-left: 250px;
          transition: all 0.3s;
        }
        
        @media (max-width: 767.98px) {
          .main-content {
            margin-left: 0;
            padding-top: 4rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout; 