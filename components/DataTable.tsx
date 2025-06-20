import React from 'react';

interface Column<T> {
  key: keyof T | string;
  header: string | React.ReactNode;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  wrapText?: boolean;
  alignment?: 'left' | 'center' | 'right';
  width?: string;
  order?: number;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  onRowClick?: (item: T) => void;
  onSort?: (key: keyof T) => void;
  sortConfig?: {
    key: keyof T | '';
    direction: 'asc' | 'desc';
  };
  emptyMessage?: string;
}

function DataTable<T>({
  data,
  columns,
  keyField,
  onRowClick,
  onSort,
  sortConfig,
  emptyMessage = 'No data available'
}: DataTableProps<T>) {
  // Sort columns by order if available
  const orderedColumns = [...columns].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return 0;
  });

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
        </svg>
      );
    }
    
    if (sortConfig.direction === 'asc') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    );
  };

  const getColumnAlignment = (column: Column<T>) => {
    switch (column.alignment) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      case 'left':
      default:
        return 'text-left';
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200/50 bg-white backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          {/* Modern Table Header */}
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <tr>
              {orderedColumns.map((column, index) => (
                <th
                  key={column.key.toString()}
                  scope="col"
                  className={`group px-6 py-4 ${getColumnAlignment(column)} text-xs font-bold text-gray-700 uppercase tracking-wider transition-all duration-200 ${
                    column.sortable 
                      ? 'hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 cursor-pointer' 
                      : ''
                  } ${index === 0 ? 'rounded-tl-2xl' : ''} ${index === orderedColumns.length - 1 ? 'rounded-tr-2xl' : ''} ${column.className || ''}`}
                  onClick={() => {
                    if (column.sortable && onSort) {
                      onSort(column.key as keyof T);
                    }
                  }}
                  style={column.width ? { width: column.width } : {}}
                >
                  <div className={`flex items-center ${column.alignment === 'center' ? 'justify-center' : column.alignment === 'right' ? 'justify-end' : 'justify-start'} space-x-2`}>
                    <span className="group-hover:text-indigo-700 transition-colors duration-200">{column.header}</span>
                    {column.sortable && (
                      <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/50 group-hover:bg-white/80 transition-all duration-200">
                        {getSortIcon(column.key.toString())}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Enhanced Table Body */}
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.length > 0 ? (
              data.map((item, rowIndex) => (
                <tr
                  key={String(item[keyField])}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`group transition-all duration-300 ${
                    onRowClick 
                      ? 'hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 cursor-pointer hover:shadow-lg hover:scale-[1.01] hover:z-10' 
                      : ''
                  } ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                >
                  {orderedColumns.map((column, colIndex) => (
                    <td
                      key={`${String(item[keyField])}-${column.key.toString()}`}
                      className={`px-6 py-4 text-sm transition-all duration-200 ${
                        column.wrapText ? 'break-words' : 'whitespace-nowrap'
                      } ${getColumnAlignment(column)} ${colIndex === 0 ? 'font-medium text-gray-900' : 'text-gray-700'} ${
                        onRowClick ? 'group-hover:text-gray-900' : ''
                      } ${column.className || ''}`}
                    >
                      {column.render ? column.render(item) : String(item[column.key as keyof T] || '')}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={orderedColumns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">No Data Found</h3>
                      <p className="text-gray-500 max-w-sm">{emptyMessage}</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable; 