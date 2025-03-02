import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Container, Row, Col, Breadcrumb, Nav, Tab } from 'react-bootstrap';
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
    <div>
      <Head>
        <title>Setup - Starship Collection Manager</title>
        <meta name="description" content="Setup and configuration for your Star Trek starship collection" />
      </Head>

      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <Breadcrumb>
              <Breadcrumb.Item linkAs={Link} href="/">
                <FontAwesomeIcon icon={faHome} className="me-1" /> Home
              </Breadcrumb.Item>
              <Breadcrumb.Item active>
                <FontAwesomeIcon icon={faCog} className="me-1" /> Setup
              </Breadcrumb.Item>
            </Breadcrumb>
            
            <h1 className="display-4">Setup & Configuration</h1>
            <p className="lead">
              Manage settings and data for your starship collection
            </p>
          </Col>
        </Row>

        <Row>
          <Col>
            <Tab.Container activeKey={activeTab} onSelect={handleTabChange}>
              <Row>
                <Col md={3} lg={2} className="mb-4">
                  <Nav variant="pills" className="flex-column">
                    <Nav.Item>
                      <Nav.Link eventKey="factions">
                        <FontAwesomeIcon icon={faUsers} className="me-2" />
                        Factions/Races
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="editions">
                        <FontAwesomeIcon icon={faBookOpen} className="me-2" />
                        Editions
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="import">
                        <FontAwesomeIcon icon={faFileImport} className="me-2" />
                        Import & Export
                      </Nav.Link>
                    </Nav.Item>
                    {/* Add more setup tabs here in the future */}
                  </Nav>
                </Col>
                <Col md={9} lg={10}>
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
                    {/* Add more tab panes here in the future */}
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SetupPage; 