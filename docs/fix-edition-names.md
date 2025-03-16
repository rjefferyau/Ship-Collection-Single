# Fixing Edition Internal Names

This document explains how to use the Edition Internal Name Fix tool in the Ship Collection Manager.

## Overview

The Edition Internal Name Fix tool allows you to correct issues where starships have incorrect `editionInternalName` values, which can cause them to not appear in the correct franchise or edition views.

## Common Issues

### Incorrect Edition Internal Names

When a starship has an incorrect `editionInternalName`, it may:

1. Not appear in the correct franchise view
2. Not appear in the correct edition filter
3. Show up with incorrect grouping in reports and statistics

This typically happens when:
- A starship was imported with incorrect data
- A manual edit changed the internal name incorrectly
- A bulk update operation assigned the wrong internal name

## Using the Fix Tool

To fix incorrect edition internal names:

1. Navigate to the **Setup** page
2. Click on the **Fix Edition Names** card
3. On the Fix Edition Names page, you'll see three input fields:
   - **Franchise**: The franchise of the starships to fix (e.g., "Star Trek")
   - **Incorrect Edition Internal Name**: The current incorrect value (e.g., "regular-battlestar-galactica")
   - **Correct Edition Internal Name**: The value it should be changed to (e.g., "regular-star-trek")
4. Click the **Fix Edition Names** button to run the fix

### Results

After running the fix, you'll see:
- A success message with the number of starships updated
- Statistics showing how many starships were found and updated
- A list of the specific starships that were updated

## Command Line Usage

For developers, a command-line script is available to run the fix:

```bash
node scripts/fix-edition-names.js [franchise] [incorrectName] [correctName]
```

Example:
```bash
node scripts/fix-edition-names.js "Star Trek" "regular-battlestar-galactica" "regular-star-trek"
```

## Troubleshooting

If you encounter issues with the fix tool:

- Ensure you have the correct franchise name (case-sensitive)
- Verify the exact incorrect and correct edition internal names
- Check that the starships you want to fix actually have the incorrect value
- If no starships are found, try adjusting the search parameters

## Prevention

To prevent edition internal name issues in the future:

1. Use the built-in edition management tools to create and edit editions
2. When importing data, ensure the edition internal names are correctly formatted
3. Be cautious when performing bulk updates that modify edition information 