import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import Link from 'next/link';
import Layout from '../components/Layout';

const SetupPage: React.FC = () => {
  return (
    <Layout activeTab="setup">
      <div className="page-header">
        <h1 className="mb-4">Setup & Configuration</h1>
        <p className="mb-4">
          Configure various aspects of your Starship Collection Manager. Click on a card to access the specific configuration page.
        </p>
      </div>
      
      <Row>
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body className="text-center d-flex flex-column">
              <div className="flex-grow-1">
                <i className="fa-solid fa-icons fa-3x mb-3 text-primary"></i>
                <h5>Navigation Icons</h5>
                <p>Customize the icons used in the navigation menu.</p>
              </div>
              <Link href="/icon-setup" passHref>
                <Button variant="primary">Configure Icons</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body className="text-center d-flex flex-column">
              <div className="flex-grow-1">
                <i className="fa-solid fa-users fa-3x mb-3 text-primary"></i>
                <h5>Factions</h5>
                <p>Manage factions for your starship collection.</p>
              </div>
              <Link href="/faction-setup" passHref>
                <Button variant="primary">Manage Factions</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body className="text-center d-flex flex-column">
              <div className="flex-grow-1">
                <i className="fa-solid fa-book fa-3x mb-3 text-primary"></i>
                <h5>Editions</h5>
                <p>Configure editions for your starship collection.</p>
              </div>
              <Link href="/edition-setup" passHref>
                <Button variant="primary">Manage Editions</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Body className="text-center d-flex flex-column">
              <div className="flex-grow-1">
                <i className="fa-solid fa-file-import fa-3x mb-3 text-primary"></i>
                <h5>Import/Export</h5>
                <p>Import or export your starship collection data.</p>
              </div>
              <Link href="/import-export" passHref>
                <Button variant="primary">Import/Export Data</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};

export default SetupPage; 