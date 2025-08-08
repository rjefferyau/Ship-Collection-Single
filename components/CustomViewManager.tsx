import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faPlus, faTrash, faEdit, faColumns, faStar as faStarSolid, faStar as faStarRegular, faArrowsAlt } from '@fortawesome/free-solid-svg-icons';
import dynamic from 'next/dynamic';
// Client-only DnD components to avoid SSR issues
const DragDropContext = dynamic(() => import('react-beautiful-dnd').then(m => m.DragDropContext), { ssr: false });
const Droppable = dynamic(() => import('react-beautiful-dnd').then(m => m.Droppable), { ssr: false });
const Draggable = dynamic(() => import('react-beautiful-dnd').then(m => m.Draggable), { ssr: false });
import Alert from './Alert';

interface ColumnConfig {
  key: string;
  order: number;
  alignment?: 'left' | 'center' | 'right';
  width?: string;
}

interface CustomView {
  _id?: string;
  name: string;
  columns: ColumnConfig[];
  filters: any;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  isDefault: boolean;
}

interface CustomViewManagerProps {
  availableColumns: { key: string; label: string }[];
  onViewSelect: (view: CustomView) => void;
  currentColumns: string[];
  currentFilters: any;
  currentSortConfig: { key: string; direction: 'asc' | 'desc' };
}

const CustomViewManager: React.FC<CustomViewManagerProps> = ({
  availableColumns,
  onViewSelect,
  currentColumns,
  currentFilters,
  currentSortConfig
}) => {
  const [savedViews, setSavedViews] = useState<CustomView[]>([]);
  const [viewName, setViewName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<ColumnConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showColumnOrderModal, setShowColumnOrderModal] = useState(false);

  // Fetch saved views from the database
  const fetchViews = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/custom-views');
      if (response.ok) {
        const data = await response.json();
        setSavedViews(data.data || []);
      } else {
        setError('Failed to load saved views');
      }
    } catch (e) {
      console.error('Error loading saved views:', e);
      setError('Error loading saved views');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load saved views on component mount
  useEffect(() => {
    fetchViews();
  }, [fetchViews]);

  // Convert current columns to column configs when initializing
  useEffect(() => {
    const initialColumnConfigs = currentColumns.map((col, index) => ({
      key: col,
      order: index,
      alignment: 'left' as const
    }));
    setSelectedColumns(initialColumnConfigs);
  }, [currentColumns]);

  const handleSaveView = async () => {
    if (!viewName.trim()) return;
    
    setIsLoading(true);
    
    const newView: CustomView = {
      name: viewName,
      columns: selectedColumns,
      filters: currentFilters,
      sortConfig: currentSortConfig,
      isDefault: false
    };
    
    try {
      if (editingViewId) {
        // Update existing view
        const response = await fetch(`/api/custom-views/${editingViewId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newView)
        });
        
        if (response.ok) {
          const result = await response.json();
          setSavedViews(views => views.map(view => 
            view._id === editingViewId ? result.data : view
          ));
          setSuccess('View updated successfully');
        } else {
          setError('Failed to update view');
        }
      } else {
        // Add new view
        const response = await fetch('/api/custom-views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newView)
        });
        
        if (response.ok) {
          const result = await response.json();
          setSavedViews(views => [...views, result.data]);
          setSuccess('View created successfully');
        } else {
          setError('Failed to create view');
        }
      }
    } catch (e) {
      console.error('Error saving view:', e);
      setError('Error saving view');
    } finally {
      setIsLoading(false);
      setViewName('');
      setEditingViewId(null);
      setShowSaveModal(false);
    }
  };

  const handleEditView = (view: CustomView) => {
    setViewName(view.name);
    setSelectedColumns(view.columns);
    setEditingViewId(view._id || null);
    setShowSaveModal(true);
  };

  const handleDeleteView = async (id: string) => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/custom-views/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSavedViews(views => views.filter(view => view._id !== id));
        setSuccess('View deleted successfully');
      } else {
        setError('Failed to delete view');
      }
    } catch (e) {
      console.error('Error deleting view:', e);
      setError('Error deleting view');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefaultView = async (id: string) => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/custom-views/set-default/${id}`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        const result = await response.json();
        setSavedViews(views => views.map(view => ({
          ...view,
          isDefault: view._id === id
        })));
        setSuccess('Default view set successfully');
      } else {
        setError('Failed to set default view');
      }
    } catch (e) {
      console.error('Error setting default view:', e);
      setError('Error setting default view');
    } finally {
      setIsLoading(false);
    }
  };

  const handleColumnToggle = (column: string) => {
    setSelectedColumns(cols => {
      const existingColumn = cols.find(c => c.key === column);
      
      if (existingColumn) {
        // Remove column
        return cols.filter(c => c.key !== column);
      } else {
        // Add column with next available order
        const maxOrder = cols.length > 0 ? Math.max(...cols.map(c => c.order)) : -1;
        return [...cols, { key: column, order: maxOrder + 1, alignment: 'left' }];
      }
    });
  };

  const handleColumnReorder = (result: any) => {
    if (!result.destination) return;
    
    const reorderedColumns = Array.from(selectedColumns);
    const [movedItem] = reorderedColumns.splice(result.source.index, 1);
    reorderedColumns.splice(result.destination.index, 0, movedItem);
    
    // Update order values
    const updatedColumns = reorderedColumns.map((col, index) => ({
      ...col,
      order: index
    }));
    
    setSelectedColumns(updatedColumns);
  };

  const handleColumnAlignmentChange = (columnKey: string, alignment: 'left' | 'center' | 'right') => {
    setSelectedColumns(cols => cols.map(col => 
      col.key === columnKey ? { ...col, alignment } : col
    ));
  };

  return (
    <div className="mb-4">
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Custom Views</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowColumnSelector(true)}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center text-sm"
            title="Select columns to display"
          >
            <FontAwesomeIcon icon={faColumns} className="mr-1" />
            Columns
          </button>
          <button
            onClick={() => setShowColumnOrderModal(true)}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center text-sm"
            title="Reorder columns"
          >
            <FontAwesomeIcon icon={faArrowsAlt} className="mr-1" />
            Order
          </button>
          <button
            onClick={() => {
              setViewName('');
              setEditingViewId(null);
              setShowSaveModal(true);
            }}
            className="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-md flex items-center text-sm"
            title="Save current view"
          >
            <FontAwesomeIcon icon={faSave} className="mr-1" />
            Save View
          </button>
        </div>
      </div>
      
      {/* Saved Views List */}
      <div className="grid grid-cols-1 gap-2 mt-2">
        {isLoading && <p className="text-sm text-gray-500">Loading views...</p>}
        
        {!isLoading && savedViews.map(view => (
          <div key={view._id} className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-3 py-2">
            <div className="flex items-center">
              <button 
                onClick={() => handleSetDefaultView(view._id || '')}
                className={`mr-2 ${view.isDefault ? 'text-yellow-500' : 'text-gray-300 hover:text-gray-400'}`}
                title={view.isDefault ? "Default view" : "Set as default view"}
              >
                <FontAwesomeIcon icon={faStarSolid} />
              </button>
              <button 
                onClick={() => onViewSelect(view)}
                className="text-sm text-gray-700 hover:text-indigo-600"
              >
                {view.name}
              </button>
            </div>
            <div className="flex">
              <button 
                onClick={() => handleEditView(view)}
                className="text-gray-400 hover:text-indigo-600 p-1"
                title="Edit view"
              >
                <FontAwesomeIcon icon={faEdit} size="sm" />
              </button>
              <button 
                onClick={() => handleDeleteView(view._id || '')}
                className="text-gray-400 hover:text-red-600 p-1"
                title="Delete view"
              >
                <FontAwesomeIcon icon={faTrash} size="sm" />
              </button>
            </div>
          </div>
        ))}
        
        {!isLoading && savedViews.length === 0 && (
          <div className="text-sm text-gray-500 p-2">No saved views. Create one by clicking "Save View".</div>
        )}
      </div>
      
      {/* Save View Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">
              {editingViewId ? 'Edit View' : 'Save Current View'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                View Name
              </label>
              <input
                type="text"
                value={viewName}
                onChange={e => setViewName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="My Custom View"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveView}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                disabled={!viewName.trim() || isLoading}
              >
                {isLoading ? 'Saving...' : 'Save View'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Column Selector Modal */}
      {showColumnSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Select Columns</h3>
            <div className="mb-4 max-h-60 overflow-y-auto">
              {availableColumns.map(column => {
                const isSelected = selectedColumns.some(col => col.key === column.key);
                return (
                  <div key={column.key} className="mb-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleColumnToggle(column.key)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{column.label}</span>
                    </label>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowColumnSelector(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onViewSelect({
                    name: 'Temporary',
                    columns: selectedColumns,
                    filters: currentFilters,
                    sortConfig: currentSortConfig,
                    isDefault: false
                  });
                  setShowColumnSelector(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Column Order Modal */}
      {showColumnOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Column Order and Alignment</h3>
            <div className="mb-4 max-h-60 overflow-y-auto">
              <DragDropContext onDragEnd={handleColumnReorder}>
                <Droppable droppableId="column-list">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {selectedColumns
                        .sort((a, b) => a.order - b.order)
                        .map((column, index) => {
                          const columnDef = availableColumns.find(c => c.key === column.key);
                          return (
                            <Draggable key={column.key} draggableId={column.key} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-2"
                                >
                                  <div className="flex items-center">
                                    <span className="text-gray-400 mr-2">
                                      <FontAwesomeIcon icon={faArrowsAlt} />
                                    </span>
                                    <span className="text-sm">{columnDef?.label || column.key}</span>
                                  </div>
                                  <div className="flex space-x-1">
                                    <button 
                                      onClick={() => handleColumnAlignmentChange(column.key, 'left')}
                                      className={`px-2 py-1 text-xs rounded ${column.alignment === 'left' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                      Left
                                    </button>
                                    <button 
                                      onClick={() => handleColumnAlignmentChange(column.key, 'center')}
                                      className={`px-2 py-1 text-xs rounded ${column.alignment === 'center' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                      Center
                                    </button>
                                    <button 
                                      onClick={() => handleColumnAlignmentChange(column.key, 'right')}
                                      className={`px-2 py-1 text-xs rounded ${column.alignment === 'right' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                      Right
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowColumnOrderModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onViewSelect({
                    name: 'Temporary',
                    columns: selectedColumns,
                    filters: currentFilters,
                    sortConfig: currentSortConfig,
                    isDefault: false
                  });
                  setShowColumnOrderModal(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomViewManager; 