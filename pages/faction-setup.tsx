import React from 'react';
import Head from 'next/head';
import { Breadcrumb } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUsers } from '@fortawesome/free-solid-svg-icons';
import FactionManager from '../components/FactionManager';

const FactionSetupPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Faction Setup - Starship Collection Manager</title>
      </Head>
      
      <div className="page-header">
        <h1>Faction Management</h1>
        <Breadcrumb>
          <Breadcrumb.Item href="/">
            <FontAwesomeIcon icon={faHome} className="me-2" /> Home
          </Breadcrumb.Item>
          <Breadcrumb.Item href="/setup">
            Setup
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            <FontAwesomeIcon icon={faUsers} className="me-2" /> Faction Setup
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>
      
      <FactionManager />
    </>
  );
};

export default FactionSetupPage; 