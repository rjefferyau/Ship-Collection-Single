import React, { useState } from 'react';
import { Card, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileImport, faFileExport } from '@fortawesome/free-solid-svg-icons';
import CsvUpload from './CsvUpload';

interface ImportExportProps {
  onDataChange?: () => void;
}

const ImportExport: React.FC<ImportExportProps> = ({ onDataChange }) => {
  const handleUploadComplete = () => {
    if (onDataChange) {
      onDataChange();
    }
  };

  return (
    <div className="import-export">
      <h2>
        <FontAwesomeIcon icon={faFileImport} className="me-2" />
        Import & Export
      </h2>
      
      <p className="lead mb-4">
        Import data from external sources or export your collection
      </p>
      
      <CsvUpload onUploadComplete={handleUploadComplete} />
      
      {/* Future export functionality can be added here */}
    </div>
  );
};

export default ImportExport; 