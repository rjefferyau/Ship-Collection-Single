import React, { useState } from 'react';
import Head from 'next/head';
import { Container, Row, Col, Card, Button, Form, Alert, Breadcrumb } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faFileImport, faFileExport, faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';

const ImportExportPage: React.FC = () => {
  const [exportFormat, setExportFormat] = useState('json');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  
  // Handle export
  const handleExport = async () => {
    try {
      setExportSuccess(null);
      setExportError(null);
      
      const response = await fetch(`/api/export?format=${exportFormat}`);
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `starship-collection.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setExportSuccess('Data exported successfully');
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };
  
  // Handle import
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!importFile) {
      setImportError('Please select a file to import');
      return;
    }
    
    try {
      setImportSuccess(null);
      setImportError(null);
      
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import data');
      }
      
      const data = await response.json();
      setImportSuccess(`Import successful. ${data.imported} items imported.`);
      setImportFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('importFile') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };
  
  return (
    <>
      <Head>
        <title>Import/Export - Starship Collection Manager</title>
      </Head>
      
      <div className="page-header">
        <h1>Import/Export</h1>
        <Breadcrumb>
          <Breadcrumb.Item href="/">
            <FontAwesomeIcon icon={faHome} className="me-2" /> Home
          </Breadcrumb.Item>
          <Breadcrumb.Item href="/setup">
            Setup
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            <FontAwesomeIcon icon={faFileImport} className="me-2" /> Import/Export
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>
      
      <Row>
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header className="d-flex align-items-center">
              <FontAwesomeIcon icon={faFileExport} className="me-2 text-primary" />
              <h5 className="mb-0">Export Collection</h5>
            </Card.Header>
            <Card.Body>
              {exportSuccess && (
                <Alert variant="success" className="mb-4">
                  {exportSuccess}
                </Alert>
              )}
              
              {exportError && (
                <Alert variant="danger" className="mb-4">
                  {exportError}
                </Alert>
              )}
              
              <p>Export your entire starship collection to a file that you can backup or transfer to another device.</p>
              
              <Form.Group className="mb-3">
                <Form.Label>Export Format</Form.Label>
                <Form.Select 
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  <option value="json">JSON (Recommended)</option>
                  <option value="csv">CSV</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  JSON format preserves all data. CSV is compatible with spreadsheet applications but may not include all details.
                </Form.Text>
              </Form.Group>
              
              <Button 
                variant="primary" 
                onClick={handleExport}
                className="d-flex align-items-center"
              >
                <FontAwesomeIcon icon={faDownload} className="me-2" />
                Export Collection
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header className="d-flex align-items-center">
              <FontAwesomeIcon icon={faFileImport} className="me-2 text-primary" />
              <h5 className="mb-0">Import Collection</h5>
            </Card.Header>
            <Card.Body>
              {importSuccess && (
                <Alert variant="success" className="mb-4">
                  {importSuccess}
                </Alert>
              )}
              
              {importError && (
                <Alert variant="danger" className="mb-4">
                  {importError}
                </Alert>
              )}
              
              <p>Import a previously exported collection file. This will merge with your existing collection.</p>
              
              <Form onSubmit={handleImport}>
                <Form.Group className="mb-3">
                  <Form.Label>Import File</Form.Label>
                  <Form.Control
                    type="file"
                    id="importFile"
                    accept=".json,.csv"
                    onChange={(e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files.length > 0) {
                        setImportFile(files[0]);
                      }
                    }}
                  />
                  <Form.Text className="text-muted">
                    Select a JSON or CSV file that was previously exported from Starship Collection Manager.
                  </Form.Text>
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  type="submit"
                  className="d-flex align-items-center"
                  disabled={!importFile}
                >
                  <FontAwesomeIcon icon={faUpload} className="me-2" />
                  Import Collection
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Import/Export Notes</h5>
            </Card.Header>
            <Card.Body>
              <h6>About Importing</h6>
              <ul>
                <li>Importing will merge with your existing collection, not replace it.</li>
                <li>If a starship with the same edition and issue number already exists, its data will be updated.</li>
                <li>New starships will be added to your collection.</li>
                <li>For best results, use JSON format which preserves all data fields.</li>
              </ul>
              
              <h6>About Exporting</h6>
              <ul>
                <li>Exports include all starships in your collection, including wishlist items.</li>
                <li>JSON format is recommended for backups as it preserves all data.</li>
                <li>CSV format is useful for viewing your collection in spreadsheet applications.</li>
                <li>Regular backups are recommended to prevent data loss.</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default ImportExportPage; 