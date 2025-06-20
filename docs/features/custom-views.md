# Custom Views

## Overview

The Custom Views feature allows users to create, save, and manage personalized views of their starship collection. Each view can have customized columns, sorting, filtering, and column ordering preferences.

## Features

### View Management

1. **Create Custom Views**
   - Save current view configuration
   - Name and organize views
   - Set default view

2. **Edit Views**
   - Modify existing views
   - Update column selection
   - Change filters and sorting

3. **Delete Views**
   - Remove unwanted views
   - Reset to default view

### Column Customization

1. **Column Selection**
   - Choose which columns to display
   - Hide unnecessary information
   - Add specialized columns

2. **Column Ordering**
   - Drag and drop columns to reorder
   - Prioritize important information
   - Create logical groupings

3. **Column Alignment**
   - Set text alignment (left, center, right)
   - Optimize for data types
   - Improve readability

## Usage

### Creating a Custom View

1. Configure your current view with desired:
   - Column selection
   - Column order
   - Filters
   - Sort order

2. Click "Save View" button
3. Enter a name for your view
4. Click "Save"

### Setting Default View

1. Click the star icon next to any saved view
2. The selected view will load automatically when you open the collection

### Editing Column Order and Alignment

1. Click the "Order" button in the Custom Views section
2. Drag columns to reorder them
3. Select alignment options for each column (left, center, right)
4. Click "Apply" to save changes

## Technical Details

### Database Schema

Custom views are stored in MongoDB with the following schema:

```javascript
{
  name: String,          // View name
  columns: [{            // Array of column configurations
    key: String,         // Column identifier
    order: Number,       // Display order
    alignment: String,   // Text alignment (left, center, right)
    width: String        // Optional width specification
  }],
  filters: Object,       // Filter settings
  sortConfig: {          // Sort configuration
    key: String,         // Field to sort by
    direction: String    // Sort direction (asc, desc)
  },
  isDefault: Boolean     // Whether this is the default view
}
```

### API Endpoints

- `GET /api/custom-views` - List all saved views
- `POST /api/custom-views` - Create a new view
- `GET /api/custom-views/:id` - Get a specific view
- `PUT /api/custom-views/:id` - Update a view
- `DELETE /api/custom-views/:id` - Delete a view
- `PUT /api/custom-views/set-default/:id` - Set a view as default

## Best Practices

1. **Create task-specific views**
   - Collection management view
   - Wishlist planning view
   - Inventory view

2. **Use meaningful names**
   - Name views based on their purpose
   - Include key characteristics in the name

3. **Optimize column order**
   - Place most important columns first
   - Group related columns together
   - Consider logical workflow 