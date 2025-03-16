import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faEdit, faTrash, faExternalLinkAlt, faStore, faCalendarAlt, faTag, faLink, faStickyNote } from '@fortawesome/free-solid-svg-icons';
import { useCurrency } from '../../contexts/CurrencyContext';

interface Sighting {
  _id?: string;
  location: string;
  date: Date | string;
  price: number;
  url?: string;
  notes?: string;
}

interface Starship {
  _id: string;
  shipName: string;
  sightings?: Sighting[];
}

interface SightingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  starship: Starship;
  onSightingsUpdated: () => void;
}

const SightingsModal: React.FC<SightingsModalProps> = ({ isOpen, onClose, starship, onSightingsUpdated }) => {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { formatCurrency } = useCurrency();
  
  // Form state for adding/editing sightings
  const [isEditing, setIsEditing] = useState(false);
  const [currentSightingId, setCurrentSightingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Sighting, '_id'>>({
    location: '',
    date: new Date().toISOString().split('T')[0],
    price: 0,
    url: '',
    notes: ''
  });
  
  // Fetch sightings when the modal opens
  useEffect(() => {
    if (isOpen && starship._id) {
      fetchSightings();
    }
  }, [isOpen, starship._id]);
  
  const fetchSightings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/starships/${starship._id}/sightings`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch sightings');
      }
      
      const data = await response.json();
      setSightings(data.data || []);
    } catch (error) {
      console.error('Error fetching sightings:', error);
      setError('Failed to load sightings. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }));
  };
  
  const resetForm = () => {
    setFormData({
      location: '',
      date: new Date().toISOString().split('T')[0],
      price: 0,
      url: '',
      notes: ''
    });
    setIsEditing(false);
    setCurrentSightingId(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    console.log('Starship ID:', starship._id);
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const url = `/api/starships/${starship._id}/sightings`;
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing 
        ? JSON.stringify({ ...formData, sightingId: currentSightingId })
        : JSON.stringify(formData);
      
      console.log('Sending request to:', url);
      console.log('Method:', method);
      console.log('Request body:', body);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to save sighting');
      }
      
      const data = await response.json();
      console.log('Success response:', data);
      
      // Update the UI
      await fetchSightings();
      resetForm();
      setSuccess(isEditing ? 'Sighting updated successfully' : 'Sighting added successfully');
      onSightingsUpdated();
      
      // Log the updated starship data
      console.log('Sighting saved successfully. Starship data:', data);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error saving sighting:', error);
      setError(String(error) || 'Failed to save sighting. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (sighting: Sighting) => {
    setIsEditing(true);
    setCurrentSightingId(sighting._id || null);
    
    // Format date for input field
    let formattedDate = '';
    if (sighting.date) {
      const date = new Date(sighting.date);
      formattedDate = date.toISOString().split('T')[0];
    }
    
    setFormData({
      location: sighting.location || '',
      date: formattedDate,
      price: sighting.price || 0,
      url: sighting.url || '',
      notes: sighting.notes || ''
    });
  };
  
  const handleDelete = async (sightingId: string) => {
    if (!confirm('Are you sure you want to delete this sighting?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/starships/${starship._id}/sightings`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sightingId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete sighting');
      }
      
      // Update the UI
      await fetchSightings();
      setSuccess('Sighting deleted successfully');
      onSightingsUpdated();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error deleting sighting:', error);
      setError(String(error) || 'Failed to delete sighting. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={onClose}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black opacity-30" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Sightings for {starship.shipName}
                </h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={onClose}
                >
                  <span className="sr-only">Close</span>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              
              {/* Error and success messages */}
              {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
                  {success}
                </div>
              )}
              
              {/* Add/Edit Sighting Form */}
              <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-medium mb-3">
                  {isEditing ? 'Edit Sighting' : 'Add New Sighting'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FontAwesomeIcon icon={faStore} className="mr-2" />
                      Location*
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Store or website name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date.toString()}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FontAwesomeIcon icon={faTag} className="mr-2" />
                      Price
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FontAwesomeIcon icon={faLink} className="mr-2" />
                      URL
                    </label>
                    <input
                      type="url"
                      name="url"
                      value={formData.url || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://example.com/item"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FontAwesomeIcon icon={faStickyNote} className="mr-2" />
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Any additional details about this listing"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {loading ? 'Saving...' : isEditing ? 'Update Sighting' : 'Add Sighting'}
                  </button>
                </div>
              </form>
              
              {/* Sightings List */}
              <div className="mt-4">
                <h4 className="text-md font-medium mb-3">Recorded Sightings</h4>
                
                {loading && !sightings.length ? (
                  <p className="text-gray-500 italic">Loading sightings...</p>
                ) : !sightings.length ? (
                  <p className="text-gray-500 italic">No sightings recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sightings.map((sighting) => (
                          <tr key={sighting._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {sighting.location}
                              {sighting.url && (
                                <a 
                                  href={sighting.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="ml-2 text-indigo-600 hover:text-indigo-900"
                                >
                                  <FontAwesomeIcon icon={faExternalLinkAlt} />
                                </a>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(sighting.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(sighting.price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                              <button
                                onClick={() => handleEdit(sighting)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Edit"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button
                                onClick={() => sighting._id && handleDelete(sighting._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default SightingsModal; 