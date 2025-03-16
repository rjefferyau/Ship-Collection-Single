import React, { useState, useEffect, Fragment } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSave, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';

interface Manufacturer {
  _id: string;
  name: string;
  description?: string;
  website?: string;
  country?: string;
  franchises?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Franchise {
  _id: string;
  name: string;
}

const ManufacturerManager: React.FC = () => {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Partial<Manufacturer> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  // Fetch manufacturers and franchises on component mount
  useEffect(() => {
    fetchManufacturers();
    fetchFranchises();
  }, []);

  const fetchManufacturers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/manufacturers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch manufacturers');
      }
      
      const data = await response.json();
      setManufacturers(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchFranchises = async () => {
    try {
      const response = await fetch('/api/franchises');
      
      if (!response.ok) {
        throw new Error('Failed to fetch franchises');
      }
      
      const data = await response.json();
      setFranchises(data.data || []);
    } catch (err) {
      console.error('Error fetching franchises:', err);
    }
  };

  const handleOpenModal = (manufacturer?: Manufacturer) => {
    if (manufacturer) {
      setEditingManufacturer({
        _id: manufacturer._id,
        name: manufacturer.name,
        description: manufacturer.description,
        website: manufacturer.website,
        country: manufacturer.country,
        franchises: manufacturer.franchises || []
      });
    } else {
      setEditingManufacturer({ name: '', description: '', website: '', country: '', franchises: [] });
    }
    setShowModal(true);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingManufacturer(null);
    setFormError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditingManufacturer(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleFranchiseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setEditingManufacturer(prev => prev ? { ...prev, franchises: selectedOptions } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingManufacturer || !editingManufacturer.name) {
      setFormError('Name is required');
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      const isEditing = Boolean(editingManufacturer._id);
      const url = isEditing 
        ? `/api/manufacturers/${editingManufacturer._id}` 
        : '/api/manufacturers';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingManufacturer),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save manufacturer');
      }
      
      // Refresh the list
      fetchManufacturers();
      
      // Close the modal
      handleCloseModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = (id: string) => {
    setDeleteConfirmation(id);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/manufacturers/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete manufacturer');
      }
      
      // Refresh the list
      fetchManufacturers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setDeleteConfirmation(null);
    }
  };

  return (
    <div className="manufacturer-manager">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Manufacturers</h2>
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => handleOpenModal()}
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Add Manufacturer
        </button>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading manufacturers...</p>
          </div>
        ) : manufacturers.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-gray-600">No manufacturers found. Add your first one!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Website
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {manufacturers.map(manufacturer => (
                  <tr key={manufacturer._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {manufacturer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {manufacturer.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {manufacturer.website ? (
                        <a href={manufacturer.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                          {manufacturer.website}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {manufacturer.country || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => handleOpenModal(manufacturer)}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        {deleteConfirmation === manufacturer._id ? (
                          <>
                            <button
                              className="text-green-600 hover:text-green-900"
                              onClick={() => handleDelete(manufacturer._id)}
                            >
                              <FontAwesomeIcon icon={faCheck} />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => setDeleteConfirmation(null)}
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          </>
                        ) : (
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteConfirm(manufacturer._id)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Modal for adding/editing manufacturers */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {editingManufacturer?._id ? 'Edit Manufacturer' : 'Add Manufacturer'}
              </h3>
              
              {formError && (
                <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{formError}</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="mt-4">
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={editingManufacturer?.name || ''}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={editingManufacturer?.description || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={editingManufacturer?.website || ''}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="https://example.com"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={editingManufacturer?.country || ''}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="franchises" className="block text-sm font-medium text-gray-700 mb-1">
                    Associated Franchises
                  </label>
                  <select
                    id="franchises"
                    name="franchises"
                    multiple
                    value={editingManufacturer?.franchises || []}
                    onChange={handleFranchiseChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    size={4}
                  >
                    {franchises.map(franchise => (
                      <option key={franchise._id} value={franchise.name}>
                        {franchise.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple franchises</p>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin -ml-1 mr-2 h-4 w-4 border-t-2 border-white"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} className="mr-2" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManufacturerManager; 