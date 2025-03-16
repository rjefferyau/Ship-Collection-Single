import React, { useState, useRef, Fragment } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Starship } from '../pages/api/starships';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoiceDollar, faTimes } from '@fortawesome/free-solid-svg-icons';

// Add the missing type for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface OwnerInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
}

interface InsuranceReportProps {
  starships: Starship[];
  ownerInfo: OwnerInfo;
}

const InsuranceReport: React.FC<InsuranceReportProps> = ({ starships, ownerInfo }) => {
  const [showModal, setShowModal] = useState(false);
  const [includePhotos, setIncludePhotos] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [reportTitle, setReportTitle] = useState('CollectHub Insurance Valuation');
  
  // Close modal when clicking outside
  const modalRef = useRef<HTMLDivElement>(null);
  
  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
  
  // Get the highest value for insurance claim
  const getInsuranceValue = (ship: Starship): number => {
    const purchasePrice = ship.purchasePrice || 0;
    const currentValue = ship.retailPrice || 0;
    const marketValue = ship.marketValue || 0;
    
    return Math.max(purchasePrice, currentValue, marketValue);
  };
  
  const generateReport = () => {
    // Filter only owned starships
    const ownedStarships = starships.filter(ship => ship.owned);
    
    // Calculate total insurance value
    const totalInsuranceValue = ownedStarships.reduce((sum, ship) => {
      return sum + getInsuranceValue(ship);
    }, 0);
    
    // Create PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(reportTitle, 14, 22);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Add owner info
    doc.setFontSize(12);
    doc.text('Owner Information:', 14, 40);
    doc.setFontSize(10);
    doc.text(`Name: ${ownerInfo.name}`, 20, 48);
    doc.text(`Address: ${ownerInfo.address}`, 20, 54);
    doc.text(`Email: ${ownerInfo.email}`, 20, 60);
    doc.text(`Phone: ${ownerInfo.phone}`, 20, 66);
    
    // Add collection summary
    doc.setFontSize(12);
    doc.text('Collection Summary:', 14, 76);
    doc.setFontSize(10);
    doc.text(`Total Items: ${ownedStarships.length}`, 20, 84);
    doc.text(`Total Insurance Value: ${formatCurrency(totalInsuranceValue)}`, 20, 90);
    
    // Create table of items
    const tableColumn = ["Item", "Condition", "Purchase Price", "Current Value", "Market Value", "Insurance Value", "Notes"];
    const tableRows = ownedStarships.map(ship => [
      `${ship.shipName} (${ship.issue})`,
      ship.condition || 'Not specified',
      formatCurrency(ship.purchasePrice || 0),
      formatCurrency(ship.retailPrice || 0),
      formatCurrency(ship.marketValue || 0),
      formatCurrency(getInsuranceValue(ship)),
      includeNotes ? (ship.conditionNotes || 'None') : ''
    ]);
    
    // Add a summary row at the bottom
    tableRows.push([
      `Total (${ownedStarships.length} items)`,
      '',
      formatCurrency(ownedStarships.reduce((sum, ship) => sum + (ship.purchasePrice || 0), 0)),
      formatCurrency(ownedStarships.reduce((sum, ship) => sum + (ship.retailPrice || 0), 0)),
      formatCurrency(ownedStarships.reduce((sum, ship) => sum + (ship.marketValue || 0), 0)),
      formatCurrency(totalInsuranceValue),
      ''
    ]);
    
    // Use the imported autoTable function
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 100,
      styles: { fontSize: 8 },
      columnStyles: { 6: { cellWidth: 50 } },
      foot: [
        [
          { content: 'Insurance Value is calculated as the highest of Purchase Price, Current Value, or Market Value', colSpan: 7, styles: { halign: 'left', fontStyle: 'italic' } }
        ]
      ]
    });
    
    // Add photos if requested
    if (includePhotos) {
      let yPosition = doc.lastAutoTable.finalY + 20;
      
      doc.setFontSize(12);
      doc.text('Item Photographs:', 14, yPosition);
      yPosition += 10;
      
      // For each ship with photos
      ownedStarships.forEach(ship => {
        if (ship.conditionPhotos && ship.conditionPhotos.length > 0) {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(10);
          doc.text(`${ship.shipName} (${ship.issue})`, 14, yPosition);
          yPosition += 5;
          
          // Add photos (this is simplified - actual implementation would need to load images)
          // In a real implementation, you'd need to handle async image loading
          ship.conditionPhotos.forEach((photoUrl, index) => {
            // Placeholder for actual image insertion
            doc.rect(14, yPosition, 40, 40);
            doc.text(`Photo ${index + 1}`, 34, yPosition + 20);
            
            // Move position for next photo or ship
            if (index % 4 === 3) {
              yPosition += 50; // Move down after 4 photos in a row
            } else {
              // Move right for the next photo
            }
          });
          
          yPosition += 50; // Space for the next ship
        }
      });
    }
    
    // Save the PDF
    doc.save('starship-collection-insurance-report.pdf');
    
    setShowModal(false);
  };
  
  // Filter only owned starships for preview
  const ownedStarships = starships.filter(ship => ship.owned);
  
  // Calculate total insurance value for preview
  const totalInsuranceValue = ownedStarships.reduce((sum, ship) => {
    return sum + getInsuranceValue(ship);
  }, 0);
  
  return (
    <>
      {/* Tailwind Button */}
      <button 
        onClick={() => setShowModal(true)}
        className="px-4 py-2 rounded-md border border-indigo-500 bg-white text-indigo-600 hover:bg-indigo-50 flex items-center"
        title="Generate an insurance valuation report for your collection"
      >
        <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-2" />
        <span>Insurance Report</span>
      </button>
      
      {/* Tailwind Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => setShowModal(false)}
            ></div>

            {/* Modal panel */}
            <div 
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
              ref={modalRef}
            >
              {/* Modal header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Insurance Valuation Report
                </h3>
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={() => setShowModal(false)}
                >
                  <span className="sr-only">Close</span>
                  <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                </button>
              </div>
              
              {/* Modal body */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="space-y-6">
                  {/* Report Title */}
                  <div>
                    <label htmlFor="report-title" className="block text-sm font-medium text-gray-700">
                      Report Title
                    </label>
                    <input
                      type="text"
                      id="report-title"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                    />
                  </div>
                  
                  {/* Options */}
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="include-photos"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={includePhotos}
                        onChange={(e) => setIncludePhotos(e.target.checked)}
                      />
                      <label htmlFor="include-photos" className="ml-2 block text-sm text-gray-700">
                        Include condition photos
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="include-notes"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={includeNotes}
                        onChange={(e) => setIncludeNotes(e.target.checked)}
                      />
                      <label htmlFor="include-notes" className="ml-2 block text-sm text-gray-700">
                        Include condition notes
                      </label>
                    </div>
                  </div>
                  
                  {/* Report Preview */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Report Preview</h4>
                    <div className="border border-gray-200 rounded-md p-4 bg-gray-50 overflow-auto max-h-96">
                      <h3 className="text-xl font-bold mb-2">{reportTitle}</h3>
                      <p className="text-sm text-gray-600 mb-4">Generated on: {new Date().toLocaleDateString()}</p>
                      
                      <h5 className="font-medium text-gray-800 mb-2">Owner Information:</h5>
                      <p className="text-sm mb-4">
                        Name: {ownerInfo.name}<br />
                        Address: {ownerInfo.address}<br />
                        Email: {ownerInfo.email}<br />
                        Phone: {ownerInfo.phone}
                      </p>
                      
                      <h5 className="font-medium text-gray-800 mb-2">Collection Summary:</h5>
                      <p className="text-sm mb-4">
                        Total Items: {ownedStarships.length}<br />
                        Total Insurance Value: {formatCurrency(totalInsuranceValue)}
                      </p>
                      
                      <h5 className="font-medium text-gray-800 mb-2">Item List:</h5>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Market Value</th>
                              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Insurance Value</th>
                              {includeNotes && <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {ownedStarships.slice(0, 3).map(ship => (
                              <tr key={ship._id}>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">{ship.shipName} ({ship.issue})</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">{ship.condition || 'Not specified'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-right">{formatCurrency(ship.purchasePrice || 0)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-right">{formatCurrency(ship.retailPrice || 0)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-right">{formatCurrency(ship.marketValue || 0)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-right">{formatCurrency(getInsuranceValue(ship))}</td>
                                {includeNotes && <td className="px-3 py-2 whitespace-nowrap text-xs">{ship.conditionNotes || 'None'}</td>}
                              </tr>
                            ))}
                            {ownedStarships.length > 3 && (
                              <tr>
                                <td colSpan={includeNotes ? 7 : 6} className="px-3 py-2 text-xs text-center text-gray-500">
                                  ... and {ownedStarships.length - 3} more items
                                </td>
                              </tr>
                            )}
                            <tr className="bg-gray-50 font-medium">
                              <td className="px-3 py-2 whitespace-nowrap text-xs">Total ({ownedStarships.length} items)</td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs"></td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-right">{formatCurrency(ownedStarships.reduce((sum, ship) => sum + (ship.purchasePrice || 0), 0))}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-right">{formatCurrency(ownedStarships.reduce((sum, ship) => sum + (ship.retailPrice || 0), 0))}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-right">{formatCurrency(ownedStarships.reduce((sum, ship) => sum + (ship.marketValue || 0), 0))}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-right">{formatCurrency(totalInsuranceValue)}</td>
                              {includeNotes && <td className="px-3 py-2 whitespace-nowrap text-xs"></td>}
                            </tr>
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan={includeNotes ? 7 : 6} className="px-3 py-2 text-xs text-gray-500 italic">
                                Insurance Value is calculated as the highest of Purchase Price, Current Value, or Market Value
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      
                      {includePhotos && (
                        <div className="mt-4">
                          <h5 className="font-medium text-gray-800 mb-2">Item Photographs:</h5>
                          <p className="text-sm text-gray-600 italic">Photos will be included in the PDF report</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Modal footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={generateReport}
                >
                  Generate PDF Report
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InsuranceReport; 