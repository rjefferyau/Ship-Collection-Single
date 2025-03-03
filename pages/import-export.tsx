import React from 'react';
import Layout from '../components/Layout';
import ImportExport from '../components/ImportExport';

const ImportExportPage: React.FC = () => {
  return (
    <Layout activeTab="import-export">
      <div className="page-header">
        <h1 className="mb-4">Import & Export Data</h1>
        <p className="mb-4">
          Import data from external sources or export your collection for backup and sharing.
        </p>
      </div>
      
      <ImportExport />
    </Layout>
  );
};

export default ImportExportPage; 