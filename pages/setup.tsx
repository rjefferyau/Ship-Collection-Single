import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Row, Col, Breadcrumb, Nav, Tab, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faCog, faUsers, faBookOpen, faFileImport } from '@fortawesome/free-solid-svg-icons';

import FactionManager from '../components/FactionManager';
import EditionManager from '../components/EditionManager';
import ImportExport from '../components/ImportExport';

const SetupPage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('factions');

  useEffect(() => {
    // Get the tab from the URL query
    const { tab } = router.query;
    if (tab === 'editions' || tab === 'factions' || tab === 'import') {
      setActiveTab(tab);
    }
  }, [router.query]);

  const handleTabChange = (key: string | null) => {
    if (key) {
      setActiveTab(key);
      // Update the URL without refreshing the page
      router.push(`/setup?tab=${key}`, undefined, { shallow: true });
    }
  };

  return (
    <>
      <Head>
        <title>Setup - Starship Collection Manager</title>
      </Head>

      <div className="mb-4">
        <h1>Setup & Configuration</h1>
        <Breadcrumb>
          <Breadcrumb.Item>
            <Link href="/" className="text-decoration-none">
              <FontAwesomeIcon icon={faHome} className="me-2" /> Home
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            <FontAwesomeIcon icon={faCog} className="me-2" /> Setup
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Card>
        <Card.Body>
          <Tab.Container activeKey={activeTab} onSelect={handleTabChange}>
            <Row>
              <Col md={3}>
                <Nav variant="pills" className="flex-column">
                  <Nav.Item>
                    <Nav.Link eventKey="factions">
                      <FontAwesomeIcon icon={faUsers} className="me-2" /> Factions
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="editions">
                      <FontAwesomeIcon icon={faBookOpen} className="me-2" /> Editions
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="import">
                      <FontAwesomeIcon icon={faFileImport} className="me-2" /> Import/Export
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Col>
              <Col md={9}>
                <Tab.Content>
                  <Tab.Pane eventKey="factions">
                    <FactionManager />
                  </Tab.Pane>
                  <Tab.Pane eventKey="editions">
                    <EditionManager />
                  </Tab.Pane>
                  <Tab.Pane eventKey="import">
                    <ImportExport />
                  </Tab.Pane>
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        </Card.Body>
      </Card>
    </>
  );
};

export default SetupPage; 