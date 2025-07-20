import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddStarshipForm from '../../components/AddStarshipForm';

// Mock fetch for API calls
global.fetch = jest.fn();

const mockApiData = {
  collectionTypes: {
    success: true,
    data: [
      { _id: 'ct1', name: 'Die Cast Models' },
      { _id: 'ct2', name: 'Books' }
    ]
  },
  franchises: {
    success: true,
    data: [
      { _id: 'f1', name: 'Star Trek' },
      { _id: 'f2', name: 'Battlestar Galactica' }
    ]
  },
  factions: {
    success: true,
    data: [
      { _id: 'fac1', name: 'Federation', franchise: 'Star Trek' },
      { _id: 'fac2', name: 'Klingon Empire', franchise: 'Star Trek' }
    ]
  },
  editions: {
    success: true,
    data: [
      { 
        _id: 'ed1', 
        name: 'Regular Collection', 
        internalName: 'regular-star-trek',
        franchise: 'Star Trek',
        retailPrice: 29.99
      },
      { 
        _id: 'ed2', 
        name: 'Discovery', 
        internalName: 'discovery',
        franchise: 'Star Trek',
        retailPrice: 34.99
      }
    ]
  },
  manufacturers: {
    success: true,
    data: [
      { _id: 'm1', name: 'Eaglemoss', franchises: ['Star Trek'] },
      { _id: 'm2', name: 'Modiphius', franchises: ['Star Trek'] }
    ]
  }
};

const defaultProps = {
  onStarshipAdded: jest.fn(),
  defaultCollectionType: 'Die Cast Models',
  defaultFranchise: 'Star Trek'
};

describe('AddStarshipForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default fetch mocks
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/collection-types')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiData.collectionTypes)
        });
      }
      if (url.includes('/api/franchises')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiData.franchises)
        });
      }
      if (url.includes('/api/factions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiData.factions)
        });
      }
      if (url.includes('/api/editions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiData.editions)
        });
      }
      if (url.includes('/api/manufacturers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiData.manufacturers)
        });
      }
      if (url.includes('/api/starships') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: {} })
        });
      }
      // Return a default mock for any other API calls
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      });
    });
  });

  describe('Component Rendering', () => {
    test('renders without crashing', () => {
      render(<AddStarshipForm {...defaultProps} />);
      expect(screen.getByText('Collection Type')).toBeInTheDocument();
    });

    test('renders all required form fields for Die Cast Models', async () => {
      render(<AddStarshipForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Collection Type/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Franchise/)).toBeInTheDocument();
      });
    });

    test('shows loading states for dropdowns', async () => {
      render(<AddStarshipForm {...defaultProps} />);
      
      // Should show loading indicators initially
      expect(screen.getByText(/Loading collection types/)).toBeInTheDocument();
      expect(screen.getByText(/Loading franchises/)).toBeInTheDocument();
    });
  });

  describe('API Data Loading', () => {
    test('fetches all required data on mount', async () => {
      render(<AddStarshipForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/collection-types');
        expect(global.fetch).toHaveBeenCalledWith('/api/franchises');
        expect(global.fetch).toHaveBeenCalledWith('/api/factions');
        expect(global.fetch).toHaveBeenCalledWith('/api/editions');
        expect(global.fetch).toHaveBeenCalledWith('/api/manufacturers');
      });
    });

    test('populates dropdowns with fetched data', async () => {
      render(<AddStarshipForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Die Cast Models')).toBeInTheDocument();
        expect(screen.getByText('Star Trek')).toBeInTheDocument();
      });
    });

    test('handles API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
      
      render(<AddStarshipForm {...defaultProps} />);
      
      // Form should still render despite API errors
      expect(screen.getByLabelText(/Collection Type/)).toBeInTheDocument();
    });
  });

  describe('Form Field Interactions', () => {
    test('enables franchise dropdown after collection type selection', async () => {
      const user = userEvent.setup();
      render(<AddStarshipForm {...defaultProps} />);
      
      // Wait for data to load first
      await waitFor(() => {
        expect(screen.getByText('Die Cast Models')).toBeInTheDocument();
      });
      
      const collectionTypeSelect = screen.getByLabelText(/Collection Type/);
      await user.selectOptions(collectionTypeSelect, 'Die Cast Models');
      
      await waitFor(() => {
        const franchiseSelect = screen.getByLabelText(/Franchise/);
        expect(franchiseSelect).not.toBeDisabled();
      });
    });

    test('shows starship-specific fields for Die Cast Models', async () => {
      const user = userEvent.setup();
      render(<AddStarshipForm {...defaultProps} />);
      
      // Wait for data to load first
      await waitFor(() => {
        expect(screen.getByText('Die Cast Models')).toBeInTheDocument();
      });
      
      // Select collection type and franchise
      const collectionTypeSelect = screen.getByLabelText(/Collection Type/);
      await user.selectOptions(collectionTypeSelect, 'Die Cast Models');
      
      await waitFor(() => {
        const franchiseSelect = screen.getByLabelText(/Franchise/);
        expect(franchiseSelect).not.toBeDisabled();
      });
      
      const franchiseSelect = screen.getByLabelText(/Franchise/);
      await user.selectOptions(franchiseSelect, 'Star Trek');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Issue/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Edition/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Race\/Faction/)).toBeInTheDocument();
      });
    });

    test('filters factions and editions based on franchise selection', async () => {
      const user = userEvent.setup();
      render(<AddStarshipForm {...defaultProps} />);
      
      // Wait for data to load first
      await waitFor(() => {
        expect(screen.getByText('Die Cast Models')).toBeInTheDocument();
      });
      
      // Select collection type and franchise
      const collectionTypeSelect = screen.getByLabelText(/Collection Type/);
      await user.selectOptions(collectionTypeSelect, 'Die Cast Models');
      
      const franchiseSelect = screen.getByLabelText(/Franchise/);
      await user.selectOptions(franchiseSelect, 'Star Trek');
      
      await waitFor(() => {
        expect(screen.getByText('Federation')).toBeInTheDocument();
        expect(screen.getByText('Regular Collection')).toBeInTheDocument();
      });
    });

    test('sets retail price when edition is selected', async () => {
      const user = userEvent.setup();
      render(<AddStarshipForm {...defaultProps} />);
      
      // Wait for data to load first
      await waitFor(() => {
        expect(screen.getByText('Die Cast Models')).toBeInTheDocument();
      });
      
      // Navigate through the form to edition selection
      const collectionTypeSelect = screen.getByLabelText(/Collection Type/);
      await user.selectOptions(collectionTypeSelect, 'Die Cast Models');
      
      const franchiseSelect = screen.getByLabelText(/Franchise/);
      await user.selectOptions(franchiseSelect, 'Star Trek');
      
      await waitFor(() => {
        const editionSelect = screen.getByLabelText(/Edition/);
        expect(editionSelect).not.toBeDisabled();
      });
      
      const editionSelect = screen.getByLabelText(/Edition/);
      await user.selectOptions(editionSelect, 'regular-star-trek');
      
      await waitFor(() => {
        const retailPriceInput = screen.getByLabelText(/Retail Price/);
        expect(retailPriceInput).toHaveValue(29.99);
      });
    });
  });

  describe('Form Validation', () => {
    test('shows validation errors for required fields', async () => {
      const user = userEvent.setup();
      render(<AddStarshipForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Item/ })).toBeInTheDocument();
      });
      
      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /Add Item/ });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Please fill in all required fields/)).toBeInTheDocument();
      });
    });

    test('validates required fields for Die Cast Models', async () => {
      const user = userEvent.setup();
      render(<AddStarshipForm {...defaultProps} />);
      
      // Wait for data to load first
      await waitFor(() => {
        expect(screen.getByText('Die Cast Models')).toBeInTheDocument();
      });
      
      // Select collection type and franchise but leave required fields empty
      const collectionTypeSelect = screen.getByLabelText(/Collection Type/);
      await user.selectOptions(collectionTypeSelect, 'Die Cast Models');
      
      const franchiseSelect = screen.getByLabelText(/Franchise/);
      await user.selectOptions(franchiseSelect, 'Star Trek');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Item Name/)).toBeInTheDocument();
      });
      
      // Try to submit with missing required fields
      const submitButton = screen.getByRole('button', { name: /Add Item/ });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Please fill in all required fields/)).toBeInTheDocument();
      });
    });

    test('accepts valid form submission', async () => {
      const user = userEvent.setup();
      
      // Mock successful form submission
      (global.fetch as jest.Mock).mockImplementationOnce((url: string) => {
        if (url.includes('/api/starships') && url.includes('POST')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: {} })
          });
        }
        return Promise.reject(new Error('Unexpected request'));
      });
      
      render(<AddStarshipForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Collection Type/)).toBeInTheDocument();
      });
      
      // Fill out the form completely
      const collectionTypeSelect = screen.getByLabelText(/Collection Type/);
      await user.selectOptions(collectionTypeSelect, 'Die Cast Models');
      
      const franchiseSelect = screen.getByLabelText(/Franchise/);
      await user.selectOptions(franchiseSelect, 'Star Trek');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Item Name/)).toBeInTheDocument();
      });
      
      const itemNameInput = screen.getByLabelText(/Item Name/);
      await user.type(itemNameInput, 'USS Enterprise NCC-1701-D');
      
      const issueInput = screen.getByLabelText(/Issue/);
      await user.type(issueInput, '1');
      
      const editionSelect = screen.getByLabelText(/Edition/);
      await user.selectOptions(editionSelect, 'regular-star-trek');
      
      const factionSelect = screen.getByLabelText(/Race\/Faction/);
      await user.selectOptions(factionSelect, 'Federation');
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Add Item/ });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Item added successfully!/)).toBeInTheDocument();
        expect(defaultProps.onStarshipAdded).toHaveBeenCalled();
      });
    });
  });

  describe('Form Reset Functionality', () => {
    test('resets form when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<AddStarshipForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Collection Type/)).toBeInTheDocument();
      });
      
      // Fill out some form fields
      const collectionTypeSelect = screen.getByLabelText(/Collection Type/);
      await user.selectOptions(collectionTypeSelect, 'Die Cast Models');
      
      const franchiseSelect = screen.getByLabelText(/Franchise/);
      await user.selectOptions(franchiseSelect, 'Star Trek');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Item Name/)).toBeInTheDocument();
      });
      
      const itemNameInput = screen.getByLabelText(/Item Name/);
      await user.type(itemNameInput, 'Test Ship');
      
      // Reset the form
      const resetButton = screen.getByRole('button', { name: /Reset Form/ });
      await user.click(resetButton);
      
      // Check that fields are cleared
      expect(itemNameInput).toHaveValue('');
      expect(collectionTypeSelect).toHaveValue('');
    });
  });

  describe('Default Values', () => {
    test('sets default collection type and franchise from props', async () => {
      render(<AddStarshipForm {...defaultProps} />);
      
      await waitFor(() => {
        const collectionTypeSelect = screen.getByLabelText(/Collection Type/);
        expect(collectionTypeSelect).toHaveValue('Die Cast Models');
      });
      
      await waitFor(() => {
        const franchiseSelect = screen.getByLabelText(/Franchise/);
        expect(franchiseSelect).toHaveValue('Star Trek');
      });
    });

    test('works without default values', async () => {
      const propsWithoutDefaults = {
        onStarshipAdded: jest.fn()
      };
      
      render(<AddStarshipForm {...propsWithoutDefaults} />);
      
      await waitFor(() => {
        const collectionTypeSelect = screen.getByLabelText(/Collection Type/);
        expect(collectionTypeSelect).toHaveValue('');
      });
    });
  });

  describe('Error Handling', () => {
    test('displays API error messages', async () => {
      const user = userEvent.setup();
      
      // Mock failed form submission
      (global.fetch as jest.Mock).mockImplementationOnce((url: string) => {
        if (url.includes('/api/starships')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ 
              success: false, 
              message: 'Duplicate entry found' 
            })
          });
        }
        return Promise.reject(new Error('Unexpected request'));
      });
      
      render(<AddStarshipForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Collection Type/)).toBeInTheDocument();
      });
      
      // Fill out and submit form
      const collectionTypeSelect = screen.getByLabelText(/Collection Type/);
      await user.selectOptions(collectionTypeSelect, 'Die Cast Models');
      
      const franchiseSelect = screen.getByLabelText(/Franchise/);
      await user.selectOptions(franchiseSelect, 'Star Trek');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Item Name/)).toBeInTheDocument();
      });
      
      const itemNameInput = screen.getByLabelText(/Item Name/);
      await user.type(itemNameInput, 'USS Enterprise NCC-1701-D');
      
      const issueInput = screen.getByLabelText(/Issue/);
      await user.type(issueInput, '1');
      
      const editionSelect = screen.getByLabelText(/Edition/);
      await user.selectOptions(editionSelect, 'regular-star-trek');
      
      const factionSelect = screen.getByLabelText(/Race\/Faction/);
      await user.selectOptions(factionSelect, 'Federation');
      
      const submitButton = screen.getByRole('button', { name: /Add Item/ });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Duplicate entry found/)).toBeInTheDocument();
      });
    });

    test('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      (global.fetch as jest.Mock).mockImplementationOnce((url: string) => {
        if (url.includes('/api/starships')) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.reject(new Error('Unexpected request'));
      });
      
      render(<AddStarshipForm {...defaultProps} />);
      
      // ... (form filling code similar to above)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Collection Type/)).toBeInTheDocument();
      });
      
      const collectionTypeSelect = screen.getByLabelText(/Collection Type/);
      await user.selectOptions(collectionTypeSelect, 'Die Cast Models');
      
      const franchiseSelect = screen.getByLabelText(/Franchise/);
      await user.selectOptions(franchiseSelect, 'Star Trek');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Item Name/)).toBeInTheDocument();
      });
      
      const itemNameInput = screen.getByLabelText(/Item Name/);
      await user.type(itemNameInput, 'Test Ship');
      
      const issueInput = screen.getByLabelText(/Issue/);
      await user.type(issueInput, '1');
      
      const editionSelect = screen.getByLabelText(/Edition/);
      await user.selectOptions(editionSelect, 'regular-star-trek');
      
      const factionSelect = screen.getByLabelText(/Race\/Faction/);
      await user.selectOptions(factionSelect, 'Federation');
      
      const submitButton = screen.getByRole('button', { name: /Add Item/ });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });
  });

  describe('Pricing Fields', () => {
    test('accepts numeric input for pricing fields', async () => {
      const user = userEvent.setup();
      render(<AddStarshipForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Collection Type/)).toBeInTheDocument();
      });
      
      // Navigate to pricing section
      const collectionTypeSelect = screen.getByLabelText(/Collection Type/);
      await user.selectOptions(collectionTypeSelect, 'Die Cast Models');
      
      const franchiseSelect = screen.getByLabelText(/Franchise/);
      await user.selectOptions(franchiseSelect, 'Star Trek');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Purchase Price/)).toBeInTheDocument();
      });
      
      const purchasePriceInput = screen.getByLabelText(/Purchase Price/);
      await user.type(purchasePriceInput, '25.99');
      
      expect(purchasePriceInput).toHaveValue(25.99);
    });
  });

  describe('Conditional Field Display', () => {
    test('hides starship-specific fields for non-Die Cast Models', async () => {
      const user = userEvent.setup();
      render(<AddStarshipForm {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Collection Type/)).toBeInTheDocument();
      });
      
      const collectionTypeSelect = screen.getByLabelText(/Collection Type/);
      await user.selectOptions(collectionTypeSelect, 'Books');
      
      // Should not show starship-specific fields
      expect(screen.queryByLabelText(/Issue/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Edition/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Race\/Faction/)).not.toBeInTheDocument();
    });
  });
});