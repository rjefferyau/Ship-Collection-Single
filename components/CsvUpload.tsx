import React, { useState } from 'react';
import { Form, Button, Alert, Spinner, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faFileAlt, faDownload } from '@fortawesome/free-solid-svg-icons';

interface CsvUploadProps {
  onUploadComplete: () => void;
}

const CsvUpload: React.FC<CsvUploadProps> = ({ onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadStats, setUploadStats] = useState<{
    imported?: number;
    errors?: number;
    headers?: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setError(null);
      setSuccess(false);
      setUploadStats(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a CSV file to upload');
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setError('Please select a valid CSV file');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);
    setUploadStats(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload CSV');
      }

      setSuccess(true);
      setUploadStats({
        imported: data.message ? parseInt(data.message.match(/Imported (\d+)/)?.[1] || '0') : 0,
        errors: data.message ? parseInt(data.message.match(/\((\d+) errors\)/)?.[1] || '0') : 0,
        headers: data.headers || []
      });
      setFile(null);
      
      // Reset the file input
      const fileInput = document.getElementById('csvFile') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      onUploadComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCsv = () => {
    window.open('/sample.csv', '_blank');
  };

  return (
    <div className="csv-upload mb-4">
      <Card>
        <Card.Header>
          <h3 className="mb-0">
            <FontAwesomeIcon icon={faFileAlt} className="me-2" />
            Import Starships from CSV
          </h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && (
            <Alert variant="success">
              <div>CSV file uploaded and processed successfully!</div>
              {uploadStats && (
                <div className="mt-2">
                  <strong>Results:</strong> Imported {uploadStats.imported} starships ({uploadStats.errors} errors)
                </div>
              )}
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="csvFile" className="mb-3">
              <Form.Label>Select CSV File</Form.Label>
              <Form.Control
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <Form.Text className="text-muted">
                The CSV file should have headers: Issue, Edition, Ship Name, Race/Faction, Release Date, Image, owned
              </Form.Text>
            </Form.Group>
            
            <div className="d-flex">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={!file || uploading}
                className="me-2"
              >
                {uploading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUpload} className="me-2" />
                    Upload CSV
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline-secondary" 
                onClick={downloadSampleCsv}
              >
                <FontAwesomeIcon icon={faDownload} className="me-2" />
                Download Sample CSV
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CsvUpload; 