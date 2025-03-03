import React from 'react';
import Head from 'next/head';
import { Breadcrumb } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faBook } from '@fortawesome/free-solid-svg-icons';
import EditionManager from '../components/EditionManager';

const EditionSetupPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Edition Setup - Starship Collection Manager</title>
      </Head>
      
      <div className="page-header">
        <h1>Edition Management</h1>
        <Breadcrumb>
          <Breadcrumb.Item href="/">
            <FontAwesomeIcon icon={faHome} className="me-2" /> Home
          </Breadcrumb.Item>
          <Breadcrumb.Item href="/setup">
            Setup
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            <FontAwesomeIcon icon={faBook} className="me-2" /> Edition Setup
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>
      
      <EditionManager />
    </>
  );
};

export default EditionSetupPage; 