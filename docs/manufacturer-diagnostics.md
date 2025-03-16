# Manufacturer Diagnostics & Fixes

This document explains how to use the Manufacturer Diagnostics & Fixes tools in the Ship Collection Manager.

## Overview

The Manufacturer Diagnostics & Fixes tools allow you to:

1. Check the current state of manufacturer assignments in your collection
2. Identify starships that are missing manufacturer information
3. Force update manufacturer assignments for specific franchises

## Accessing the Tools

There are several ways to access the manufacturer diagnostics and fixes:

1. From the **Setup** page, click on the **Diagnostics & Fixes** button in the Manufacturers card
2. From the **Manufacturer Setup** page, click on the **Diagnostics & Fixes** button
3. From the settings menu (gear icon), select **Manufacturer Diagnostics**

## Diagnostic Information

The diagnostics tool provides the following information:

### Starship Stats
- **Total Starships**: The total number of starships in your collection
- **With Manufacturer**: The number of starships that have a manufacturer assigned
- **Without Manufacturer**: The number of starships that do not have a manufacturer assigned

### Franchise Stats
- **With Franchise**: The number of starships that have a franchise assigned
- **Without Franchise**: The number of starships that do not have a franchise assigned
- **Franchise Has Manufacturer**: The number of starships whose franchise has an associated manufacturer
- **Franchise No Manufacturer**: The number of starships whose franchise does not have an associated manufacturer

### Manufacturer Stats
- **Total Manufacturers**: The number of manufacturers in your system
- **Franchise-Manufacturer Mappings**: The number of franchise-to-manufacturer mappings

### Sample Starships
The diagnostics tool also shows a sample of starships from your collection, including:
- ID
- Issue
- Edition
- Ship Name
- Franchise
- Manufacturer
- Edition Internal Name

### Manufacturer List
A list of all manufacturers in your system, including the franchises associated with each manufacturer.

### Franchise-Manufacturer Mappings
A list of all franchise-to-manufacturer mappings in your system.

## Force Update Manufacturers

The Force Update Manufacturers tool allows you to:

1. Set the manufacturer for all starships in a specific franchise
2. Choose whether to update all starships or only those without a manufacturer

### Using the Force Update Tool

1. Enter the **Franchise** name (e.g., "Star Trek")
2. Enter the **Manufacturer Name** (e.g., "Eaglemoss")
3. Check/uncheck the **Force update all starships** option
   - When checked, all starships in the franchise will be updated
   - When unchecked, only starships without a manufacturer will be updated
4. Click the **Force Update Manufacturers** button

### Results

After running the force update, you'll see:
- A success message with the number of starships updated
- Statistics showing how many starships were found and updated
- A list of the specific starships that were updated

## Command Line Usage

For developers, a command-line script is available to run diagnostics and updates:

```bash
# Run diagnostics only
node scripts/test-manufacturer-diagnostics.js diagnostics

# Force update manufacturers for a specific franchise
node scripts/test-manufacturer-diagnostics.js update "Star Trek" "Eaglemoss" true
```

Parameters:
- Command: `diagnostics` or `update`
- Franchise: The franchise to update (e.g., "Star Trek")
- Manufacturer Name: The manufacturer to assign (e.g., "Eaglemoss")
- Force Update: Whether to update all starships (`true`) or only those without a manufacturer (`false`)

## Troubleshooting

If you encounter issues with the manufacturer diagnostics or fixes:

- Ensure that manufacturers are properly set up with associated franchises
- Verify that starships have the correct franchise information
- Check that the manufacturer name you're using exists in the system
- If no starships are found, try adjusting the franchise name (case-sensitive) 