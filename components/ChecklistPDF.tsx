import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Starship } from '../types';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface EditionGroup {
  editionName: string;
  editionInternalName: string;
  ships: Starship[];
}

interface ChecklistPDFProps {
  editionGroups: EditionGroup[];
  franchise: string;
  onGenerate?: () => void;
  onComplete?: () => void;
}

const ChecklistPDF: React.FC<ChecklistPDFProps> = ({ 
  editionGroups, 
  franchise,
  onGenerate,
  onComplete 
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  
  const getStatusDisplay = (ship: Starship): string => {
    if (ship.owned) return 'Owned';
    if (ship.onOrder) return 'On Order';
    if (ship.wishlist) return 'Wishlist';
    return 'Not Owned';
  };

  const getCheckboxSymbol = (ship: Starship): string => {
    // Use red cross for on-order and not-owned items
    if (ship.onOrder || (!ship.owned && !ship.wishlist)) {
      return 'X';
    }
    // Use empty checkbox for owned and wishlist items
    return '[ ]';
  };

  // Helper function to convert image to base64
  const loadImageAsBase64 = (imageUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        const fullImageUrl = imageUrl.startsWith('http') 
          ? imageUrl 
          : `${window.location.origin}${imageUrl}`;
          
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size for thumbnail
            canvas.width = 60;
            canvas.height = 60;
            
            if (ctx) {
              // Draw image scaled to canvas
              ctx.drawImage(img, 0, 0, 60, 60);
              const base64 = canvas.toDataURL('image/jpeg', 0.8);
              resolve(base64);
            } else {
              resolve(null);
            }
          } catch (error) {
            console.log('Error converting image:', error);
            resolve(null);
          }
        };
        
        img.onerror = () => {
          console.log('Failed to load image:', fullImageUrl);
          resolve(null);
        };
        
        img.src = fullImageUrl;
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(null), 5000);
      } catch (error) {
        console.log('Error loading image:', error);
        resolve(null);
      }
    });
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    if (onGenerate) onGenerate();
    
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // Add header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Starship Collection Checklist', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Franchise: ${franchise || 'All'}`, pageWidth / 2, 28, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 35, { align: 'center' });
    
    let currentY = 45;
    
    // Process each edition group
    for (const group of editionGroups) {
      // Check if we need a new page
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 20;
      }
      
      // Edition header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, currentY - 5, contentWidth, 10, 'F');
      doc.text(group.editionName, margin + 5, currentY);
      currentY += 10;
      
      // Pre-load images for this group
      const shipDataWithImages = await Promise.all(
        group.ships.map(async (ship) => {
          let imageBase64 = null;
          
          if (ship.imageUrl) {
            imageBase64 = await loadImageAsBase64(ship.imageUrl);
          }
          
          return {
            ship,
            imageBase64,
            issue: ship.issue || '-',
            shipName: ship.shipName || 'Unknown',
            checkbox: getCheckboxSymbol(ship),
            status: getStatusDisplay(ship)
          };
        })
      );
      
      // Prepare table data
      const tableData = shipDataWithImages.map(data => [
        '', // Empty for image column - we'll draw it manually
        data.issue,
        data.shipName,
        data.checkbox,
        data.status
      ]);
      
      // Create table with images
      autoTable(doc, {
        startY: currentY,
        head: [['Image', 'Issue', 'Ship Name', 'Confirm', 'Status']],
        body: tableData,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          minCellHeight: 12 // Increased row height for images
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          minCellHeight: 8
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' }, // Image
          1: { cellWidth: 15, halign: 'center' }, // Issue
          2: { cellWidth: 'auto' }, // Ship Name
          3: { cellWidth: 20, halign: 'center', fontStyle: 'bold', fontSize: 12 }, // Confirm
          4: { cellWidth: 25, halign: 'center' } // Status
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        didDrawCell: (data: any) => {
          // Handle image column - but only for body rows, not header
          if (data.column.index === 0 && data.section === 'body') {
            const rowIndex = data.row.index;
            const imageData = shipDataWithImages[rowIndex]?.imageBase64;
            
            if (imageData) {
              try {
                const cellCenterX = data.cell.x + data.cell.width / 2;
                const cellCenterY = data.cell.y + data.cell.height / 2;
                const imageSize = Math.min(data.cell.width - 2, data.cell.height - 2); // Fit within cell
                
                doc.addImage(
                  imageData,
                  'JPEG',
                  cellCenterX - imageSize / 2,
                  cellCenterY - imageSize / 2,
                  imageSize,
                  imageSize
                );
              } catch (error) {
                console.log('Error adding image to PDF:', error);
                // Fallback to text
                const cellCenterX = data.cell.x + data.cell.width / 2;
                const cellCenterY = data.cell.y + data.cell.height / 2;
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text('IMG', cellCenterX, cellCenterY, { align: 'center' });
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(9);
              }
            }
          }
          
          // Style the checkbox column with red color for X symbols
          if (data.column.index === 3 && data.cell.text[0] === 'X') {
            doc.setTextColor(220, 53, 69);
          }
        },
        didDrawPage: () => {
          // Reset text color after drawing
          doc.setTextColor(0, 0, 0);
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Add footer with page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
      // Save the PDF
      const fileName = `starship-checklist-${franchise || 'all'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate PDF Checklist</h3>
      
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          The PDF will include:
        </p>
        <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
          <li>{editionGroups.length} edition{editionGroups.length !== 1 ? 's' : ''}</li>
          <li>{editionGroups.reduce((acc, g) => acc + g.ships.length, 0)} total starships</li>
          <li>Ship images (when available)</li>
          <li>Sorted by issue number</li>
          <li>Checkboxes for ownership confirmation</li>
          <li>Current status for each item</li>
        </ul>
      </div>
      
      <button
        onClick={() => generatePDF()}
        disabled={isGenerating}
        className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 ${
          isGenerating 
            ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {isGenerating ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Generating PDF...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download PDF Checklist</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ChecklistPDF;