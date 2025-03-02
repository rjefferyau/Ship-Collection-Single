import React from 'react';
import { Table } from 'react-bootstrap';

interface DataTableProps {
  id: string;
  children: React.ReactNode;
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
  responsive?: boolean;
  className?: string;
  options?: any; // Kept for backward compatibility
}

/**
 * Simplified DataTable component that doesn't use the DataTables plugin
 * This is a drop-in replacement that maintains the same interface
 */
const DataTable: React.FC<DataTableProps> = ({ 
  id, 
  children, 
  striped = true, 
  bordered = false, 
  hover = true, 
  responsive = true,
  className = '',
  options = {} // Ignored but kept for backward compatibility
}) => {
  return (
    <Table 
      id={id}
      striped={striped} 
      bordered={bordered} 
      hover={hover} 
      responsive={responsive}
      className={`table-centered mb-0 ${className}`}
    >
      {children}
    </Table>
  );
};

export default DataTable; 