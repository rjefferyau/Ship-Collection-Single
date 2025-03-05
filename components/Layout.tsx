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

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector('.sidebar');
      const toggleButton = document.querySelector('.sidebar-toggle');
      
      if (sidebar && 
          !sidebar.contains(event.target as Node) && 
          toggleButton && 
          !toggleButton.contains(event.target as Node) &&
          window.innerWidth < 768 && 
          sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const toggleSetupSubmenu = () => {
    setSetupSubmenuOpen(!setupSubmenuOpen);
  };
  
  return (
    <div className="wrapper">
      {/* Mobile header with menu toggle */}
      <div className="d-md-none bg-primary text-white p-3 d-flex align-items-center sticky-top shadow-sm">
        <button 
          className="btn btn-link text-white p-0 me-3 sidebar-toggle" 
          onClick={toggleSidebar}
          aria-label="Toggle navigation"
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
            aria-label="Close navigation"
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
              onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
            >
              <i className={`fa-solid ${navIcons.collection} me-2`}></i>
              <span>Collection</span>
            </Link>
            <Link 
              href="/fancy-view" 
              className={`nav-link ${activeTab === 'fancy-view' ? 'active' : ''}`}
              onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
            >
              <i className={`fa-solid ${navIcons['fancy-view']} me-2`}></i>
              <span>Gallery</span>
            </Link>
            <Link 
              href="/wishlist" 
              className={`nav-link ${activeTab === 'wishlist' ? 'active' : ''}`}
              onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
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
              onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
            >
              <i className={`fa-solid ${navIcons.statistics} me-2`}></i>
              <span>Statistics</span>
            </Link>
            <Link 
              href="/price-vault" 
              className={`nav-link ${activeTab === 'price-vault' ? 'active' : ''}`}
              onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
            >
              <i className={`fa-solid ${navIcons['price-vault']} me-2`}></i>
              <span>Price Vault</span>
            </Link>
            <Link 
              href="/management" 
              className={`nav-link ${activeTab === 'management' ? 'active' : ''}`}
              onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
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
                <i className={`fa-solid ${setupSubmenuOpen ? 'fa-chevron-down' : 'fa-chevron-right'} ms-2 transition-icon`}></i>
              </div>
              
              <div className={`custom-submenu ${setupSubmenuOpen ? 'show' : ''}`}>
                <Link 
                  href="/setup" 
                  className={`custom-submenu-link ${activeTab === 'setup' ? 'active' : ''}`}
                  onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
                >
                  <i className="fa-solid fa-home me-2"></i>
                  <span>Overview</span>
                </Link>
                <Link 
                  href="/icon-setup" 
                  className={`custom-submenu-link ${activeTab === 'icon-setup' ? 'active' : ''}`}
                  onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
                >
                  <i className="fa-solid fa-icons me-2"></i>
                  <span>Icons</span>
                </Link>
                <Link 
                  href="/faction-setup" 
                  className={`custom-submenu-link ${activeTab === 'faction-setup' ? 'active' : ''}`}
                  onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
                >
                  <i className="fa-solid fa-users me-2"></i>
                  <span>Factions</span>
                </Link>
                <Link 
                  href="/edition-setup" 
                  className={`custom-submenu-link ${activeTab === 'edition-setup' ? 'active' : ''}`}
                  onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
                >
                  <i className="fa-solid fa-book me-2"></i>
                  <span>Editions</span>
                </Link>
                <Link 
                  href="/import-export" 
                  className={`custom-submenu-link ${activeTab === 'import-export' ? 'active' : ''}`}
                  onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
                >
                  <i className="fa-solid fa-file-import me-2"></i>
                  <span>Import/Export</span>
                </Link>
                <Link 
                  href="/currency-setup" 
                  className={`custom-submenu-link ${activeTab === 'currency-setup' ? 'active' : ''}`}
                  onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
                >
                  <i className="fa-solid fa-money-bill-wave me-2"></i>
                  <span>Currency</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="sidebar-footer">
          <div className="version">v1.0.0</div>
        </div>
      </div>
      
      {/* Main content */}
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Container fluid className="py-4 px-md-4">
          {children}
        </Container>
      </div>
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay d-md-none" 
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default Layout; 