import React from 'react';
import Layout from '../components/Layout';
import FactionManager from '../components/FactionManager';

const FactionSetupPage: React.FC = () => {
  return (
    <Layout activeTab="faction-setup">
      <div className="page-header">
        <h1 className="mb-4">Faction Management</h1>
        <p className="mb-4">
          Create, edit, and manage factions for your starship collection.
        </p>
      </div>
      
      <FactionManager />
    </Layout>
  );
};

export default FactionSetupPage; 