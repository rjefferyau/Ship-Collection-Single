import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faPlus, faTrash, faEdit, faColumns } from '@fortawesome/free-solid-svg-icons';

interface CustomView {
  id: string;
  name: string;
  columns: string[];
  filters: any;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
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
  const [selectedColumns, setSelectedColumns] = useState<string[]>(currentColumns);

  // Load saved views from localStorage on component mount
  useEffect(() => {
    const savedViewsData = localStorage.getItem('starship-collection-views');
    if (savedViewsData) {
      try {
        setSavedViews(JSON.parse(savedViewsData));
      } catch (e) {
        console.error('Error loading saved views:', e);
      }
    }
  }, []);

  // Save views to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('starship-collection-views', JSON.stringify(savedViews));
  }, [savedViews]);

  const handleSaveView = () => {
    if (!viewName.trim()) return;
    
    const newView: CustomView = {
      id: editingViewId || `view-${Date.now()}`,
      name: viewName,
      columns: selectedColumns,
      filters: currentFilters,
      sortConfig: currentSortConfig
    };
    
    if (editingViewId) {
      // Update existing view
      setSavedViews(views => views.map(view => 
        view.id === editingViewId ? newView : view
      ));
    } else {
      // Add new view
      setSavedViews(views => [...views, newView]);
    }
    
    setViewName('');
    setEditingViewId(null);
    setShowSaveModal(false);
  };

  const handleEditView = (view: CustomView) => {
    setViewName(view.name);
    setSelectedColumns(view.columns);
    setEditingViewId(view.id);
    setShowSaveModal(true);
  };

  const handleDeleteView = (id: string) => {
    setSavedViews(views => views.filter(view => view.id !== id));
  };

  const handleColumnToggle = (column: string) => {
    setSelectedColumns(cols => 
      cols.includes(column)
        ? cols.filter(c => c !== column)
        : [...cols, column]
    );
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Custom Views</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowColumnSelector(true)}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center text-sm"
          >
            <FontAwesomeIcon icon={faColumns} className="mr-1" />
            Columns
          </button>
          <button
            onClick={() => {
              setViewName('');
              setEditingViewId(null);
              setSelectedColumns(currentColumns);
              setShowSaveModal(true);
            }}
            className="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-md flex items-center text-sm"
          >
            <FontAwesomeIcon icon={faSave} className="mr-1" />
            Save Current View
          </button>
        </div>
      </div>
      
      {/* Saved Views List */}
      <div className="flex flex-wrap gap-2">
        {savedViews.map(view => (
          <div key={view.id} className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-1">
            <button 
              onClick={() => onViewSelect(view)}
              className="text-sm text-gray-700 hover:text-indigo-600"
            >
              {view.name}
            </button>
            <div className="flex ml-2">
              <button 
                onClick={() => handleEditView(view)}
                className="text-gray-400 hover:text-indigo-600 p-1"
                title="Edit view"
              >
                <FontAwesomeIcon icon={faEdit} size="xs" />
              </button>
              <button 
                onClick={() => handleDeleteView(view.id)}
                className="text-gray-400 hover:text-red-600 p-1"
                title="Delete view"
              >
                <FontAwesomeIcon icon={faTrash} size="xs" />
              </button>
            </div>
          </div>
        ))}
        {savedViews.length === 0 && (
          <div className="text-sm text-gray-500">No saved views. Create one by clicking "Save Current View".</div>
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
                disabled={!viewName.trim()}
              >
                Save View
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
              {availableColumns.map(column => (
                <div key={column.key} className="mb-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column.key)}
                      onChange={() => handleColumnToggle(column.key)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{column.label}</span>
                  </label>
                </div>
              ))}
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
                    id: 'temp',
                    name: 'Custom',
                    columns: selectedColumns,
                    filters: currentFilters,
                    sortConfig: currentSortConfig
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
    </div>
  );
};

export default CustomViewManager; 