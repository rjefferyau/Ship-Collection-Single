import React, { useState } from 'react';
import { Button, Modal, Form, Table } from 'react-bootstrap';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Starship } from '../pages/api/starships';

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
  const [reportTitle, setReportTitle] = useState('Starship Collection Insurance Valuation');
  
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
      <Button 
        variant="primary" 
        onClick={() => setShowModal(true)}
        className="mb-3"
      >
        Generate Insurance Valuation Report
      </Button>
      
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Insurance Valuation Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Report Title</Form.Label>
              <Form.Control 
                type="text" 
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox"
                label="Include condition photos"
                checked={includePhotos}
                onChange={(e) => setIncludePhotos(e.target.checked)}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox"
                label="Include condition notes"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
              />
            </Form.Group>
            
            <h5>Report Preview</h5>
            <div className="border p-3 mb-3">
              <h4>{reportTitle}</h4>
              <p>Generated on: {new Date().toLocaleDateString()}</p>
              
              <h5>Owner Information:</h5>
              <p>Name: {ownerInfo.name}<br />
              Address: {ownerInfo.address}<br />
              Email: {ownerInfo.email}<br />
              Phone: {ownerInfo.phone}</p>
              
              <h5>Collection Summary:</h5>
              <p>Total Items: {ownedStarships.length}<br />
              Total Insurance Value: {formatCurrency(totalInsuranceValue)}</p>
              
              <h5>Item List:</h5>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Condition</th>
                    <th>Purchase Price</th>
                    <th>Current Value</th>
                    <th>Market Value</th>
                    <th>Insurance Value</th>
                    {includeNotes && <th>Notes</th>}
                  </tr>
                </thead>
                <tbody>
                  {ownedStarships.slice(0, 3).map(ship => (
                    <tr key={ship._id}>
                      <td>{ship.shipName} ({ship.issue})</td>
                      <td>{ship.condition || 'Not specified'}</td>
                      <td>{formatCurrency(ship.purchasePrice || 0)}</td>
                      <td>{formatCurrency(ship.retailPrice || 0)}</td>
                      <td>{formatCurrency(ship.marketValue || 0)}</td>
                      <td>{formatCurrency(getInsuranceValue(ship))}</td>
                      {includeNotes && <td>{ship.conditionNotes || 'None'}</td>}
                    </tr>
                  ))}
                  {ownedStarships.length > 3 && (
                    <tr>
                      <td colSpan={includeNotes ? 7 : 6} className="text-center">
                        ... and {ownedStarships.length - 3} more items
                      </td>
                    </tr>
                  )}
                  <tr className="table-secondary fw-bold">
                    <td>Total ({ownedStarships.length} items)</td>
                    <td></td>
                    <td>{formatCurrency(ownedStarships.reduce((sum, ship) => sum + (ship.purchasePrice || 0), 0))}</td>
                    <td>{formatCurrency(ownedStarships.reduce((sum, ship) => sum + (ship.retailPrice || 0), 0))}</td>
                    <td>{formatCurrency(ownedStarships.reduce((sum, ship) => sum + (ship.marketValue || 0), 0))}</td>
                    <td>{formatCurrency(totalInsuranceValue)}</td>
                    {includeNotes && <td></td>}
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={includeNotes ? 7 : 6} className="text-muted fst-italic">
                      <small>Insurance Value is calculated as the highest of Purchase Price, Current Value, or Market Value</small>
                    </td>
                  </tr>
                </tfoot>
              </Table>
              
              {includePhotos && (
                <>
                  <h5>Item Photographs:</h5>
                  <p><i>Photos will be included in the PDF report</i></p>
                </>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={generateReport}>
            Generate PDF Report
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default InsuranceReport; 