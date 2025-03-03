import React from 'react';
import Layout from '../components/Layout';
import EditionManager from '../components/EditionManager';

const EditionSetupPage: React.FC = () => {
  return (
    <Layout activeTab="edition-setup">
      <div className="page-header">
        <h1 className="mb-4">Edition Management</h1>
        <p className="mb-4">
          Create, edit, and manage editions for your starship collection.
        </p>
      </div>
      
      <EditionManager />
    </Layout>
  );
};

export default EditionSetupPage; 