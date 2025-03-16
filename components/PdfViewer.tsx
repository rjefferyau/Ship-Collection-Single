import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import ModalContainer from './ModalContainer';

interface PdfViewerProps {
  pdfUrl: string;
  title?: string;
  onClose: () => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfUrl, onClose, title = 'PDF Document' }) => {
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
    <ModalContainer isOpen={true} onClose={onClose} maxWidth="lg" showCloseButton={true}>
      <div className="p-6">
        <div className="relative">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-t-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/50 shadow-md mr-4">
                <FontAwesomeIcon icon={faFilePdf} className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">Click the button below to download the PDF document.</p>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              onClick={downloadPdf}
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" /> Download PDF
            </button>
          </div>
          
          {/* PDF Preview (if possible) */}
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="aspect-w-16 aspect-h-9 bg-gray-100">
              <iframe 
                src={`${pdfUrl}#toolbar=0&navpanes=0`} 
                className="w-full h-full" 
                title={title}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>
    </ModalContainer>
  );
};

export default PdfViewer; 