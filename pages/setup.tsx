import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Container, Row, Col, Card, Button, Breadcrumb } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, faCog, faIcons, faUsers, 
  faBookOpen, faFileImport, faDollarSign, faArrowRight
} from '@fortawesome/free-solid-svg-icons';

const SetupPage: React.FC = () => {
  const router = useRouter();

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <>
      <Head>
        <title>Setup - Starship Collection Manager</title>
      </Head>
      
      <div className="page-header">
        <h1>Setup</h1>
        <Breadcrumb>
          <Breadcrumb.Item href="/">
            <FontAwesomeIcon icon={faHome} className="me-2" /> Home
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            <FontAwesomeIcon icon={faCog} className="me-2" /> Setup
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>
      
      <p className="lead mb-4">
        Configure your collection manager settings and preferences.
      </p>
      
      <Row>
        {/* Icon Setup */}
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body className="d-flex flex-column align-items-center text-center">
              <div className="icon-container mb-3">
                <FontAwesomeIcon icon={faIcons} size="2x" />
              </div>
              <h4>Icon Setup</h4>
              <p className="text-muted">
                Customize the icons used throughout the application.
              </p>
              <div className="mt-auto">
                <Button 
                  variant="primary" 
                  className="d-flex align-items-center mx-auto"
                  onClick={() => navigateTo('/icon-setup')}
                >
                  Configure Icons <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Faction Setup */}
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body className="d-flex flex-column align-items-center text-center">
              <div className="icon-container mb-3">
                <FontAwesomeIcon icon={faUsers} size="2x" />
              </div>
              <h4>Faction Setup</h4>
              <p className="text-muted">
                Manage factions and races for your starship collection.
              </p>
              <div className="mt-auto">
                <Button 
                  variant="primary" 
                  className="d-flex align-items-center mx-auto"
                  onClick={() => navigateTo('/faction-setup')}
                >
                  Manage Factions <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Edition Setup */}
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body className="d-flex flex-column align-items-center text-center">
              <div className="icon-container mb-3">
                <FontAwesomeIcon icon={faBookOpen} size="2x" />
              </div>
              <h4>Edition Setup</h4>
              <p className="text-muted">
                Manage editions and series for your starship collection.
              </p>
              <div className="mt-auto">
                <Button 
                  variant="primary" 
                  className="d-flex align-items-center mx-auto"
                  onClick={() => navigateTo('/edition-setup')}
                >
                  Manage Editions <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Import/Export */}
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body className="d-flex flex-column align-items-center text-center">
              <div className="icon-container mb-3">
                <FontAwesomeIcon icon={faFileImport} size="2x" />
              </div>
              <h4>Import/Export</h4>
              <p className="text-muted">
                Import or export your collection data.
              </p>
              <div className="mt-auto">
                <Button 
                  variant="primary" 
                  className="d-flex align-items-center mx-auto"
                  onClick={() => navigateTo('/import-export')}
                >
                  Import/Export Data <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Currency Setup */}
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body className="d-flex flex-column align-items-center text-center">
              <div className="icon-container mb-3">
                <FontAwesomeIcon icon={faDollarSign} size="2x" />
              </div>
              <h4>Currency Setup</h4>
              <p className="text-muted">
                Configure your preferred currency for prices.
              </p>
              <div className="mt-auto">
                <Button 
                  variant="primary" 
                  className="d-flex align-items-center mx-auto"
                  onClick={() => navigateTo('/currency-setup')}
                >
                  Configure Currency <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <style jsx>{`
        .icon-container {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background-color: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #007bff;
        }
      `}</style>
    </>
  );
};

export default SetupPage; 