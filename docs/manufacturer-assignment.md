# Manufacturer Assignment

This document explains how to use the manufacturer assignment feature in the Ship Collection Manager.

## Overview

The manufacturer assignment feature allows you to:

1. Assign manufacturers to starships based on their franchise
2. View and edit manufacturer information
3. Bulk update existing starships with manufacturer information

## Manufacturer Setup

Before assigning manufacturers to starships, you need to set up manufacturers and associate them with franchises:

1. Navigate to the **Manufacturer Setup** page
2. Create manufacturers with their details (name, description, website, country)
3. Associate each manufacturer with one or more franchises

## Auto-Assigning Manufacturers

Once manufacturers are set up with their associated franchises, you can automatically assign manufacturers to starships:

1. Go to the **Manufacturer Setup** page
2. Click the **Auto-Assign by Franchise** button
3. Choose whether to overwrite existing manufacturer assignments by checking/unchecking the option
4. The system will assign manufacturers to starships based on their franchise

### How Auto-Assignment Works

The auto-assignment process:

1. Retrieves all manufacturers and their associated franchises
2. Creates a mapping between franchises and manufacturers
3. Finds starships that need manufacturer assignment (or all starships if overwriting)
4. Assigns the appropriate manufacturer to each starship based on its franchise
5. Displays statistics about the assignment process

### Assignment Statistics

After running the auto-assignment, you'll see statistics including:

- Total starships processed
- Number of starships updated with new manufacturer information
- Number of starships skipped (no matching manufacturer for their franchise)
- Number of starships that already had manufacturers assigned
- Number of errors encountered during the process

## Manual Assignment

For more granular control, you can also manually assign manufacturers:

1. Edit an individual starship
2. Select the manufacturer from the dropdown menu
3. Save the changes

## Testing the Assignment Script

For developers, a test script is available to test the manufacturer assignment API:

```bash
# Only assign to ships without manufacturers
node scripts/test-assign-manufacturers.js

# Overwrite existing manufacturers
node scripts/test-assign-manufacturers.js --overwrite
```

## Troubleshooting

If you encounter issues with manufacturer assignment:

- Ensure manufacturers are properly set up with associated franchises
- Check that starships have franchise information
- Verify that the franchise names in starships exactly match those associated with manufacturers
- Review the assignment statistics for any errors 