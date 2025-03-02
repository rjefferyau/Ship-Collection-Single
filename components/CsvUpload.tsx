import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faFileAlt } from '@fortawesome/free-solid-svg-icons';

interface CsvUploadProps {
  onUploadComplete: () => void;
}

const CsvUpload: React.FC<CsvUploadProps> = ({ onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setError(null);
      setSuccess(false);
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

  return (
    <div className="mb-4 p-3 border rounded">
      <h3 className="mb-3">
        <FontAwesomeIcon icon={faFileAlt} className="me-2" />
        Import Starships from CSV
      </h3>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">CSV file uploaded and processed successfully!</Alert>}
      
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
            The CSV file should have headers: name, registry, class, faction, commissioned, status, role, owned
          </Form.Text>
        </Form.Group>
        
        <Button 
          variant="primary" 
          type="submit" 
          disabled={!file || uploading}
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
      </Form>
    </div>
  );
};

export default CsvUpload; 