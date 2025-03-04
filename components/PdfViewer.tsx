import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

interface PdfViewerProps {
  pdfUrl: string;
  show: boolean;
  onHide: () => void;
  title?: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfUrl, show, onHide, title = 'PDF Document' }) => {
  const downloadPdf = () => {
    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = title.replace(/\s+/g, '_').toLowerCase() + '.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center p-4">
        <p>Click the button below to download the PDF document.</p>
        <Button variant="primary" onClick={downloadPdf} className="mt-3">
          <FontAwesomeIcon icon={faDownload} /> Download PDF
        </Button>
      </Modal.Body>
    </Modal>
  );
};

export default PdfViewer; 