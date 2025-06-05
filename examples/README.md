# Importing New Editions and Ships

This directory contains example files showing how to import new editions and their associated ships into the Ship Collection database.

## Example Files

- `new-edition-import.json`: Example JSON file showing the structure for importing a new edition and its ships
- `new-edition-import.csv`: Example CSV file showing the same data in CSV format

## Import Process

### 1. Create the Edition

First, you need to create the new edition in the database. You can do this in two ways:

#### Option A: Using the Web Interface
1. Go to the Editions page
2. Click "Add New Edition"
3. Fill in the edition details:
   - Name (e.g., "Star Trek: The Next Generation - Season 2")
   - Internal Name (e.g., "star-trek-tng-s2")
   - Franchise (e.g., "Star Trek")
   - Description
   - Retail Price
   - Other optional fields

#### Option B: Using the API
Send a POST request to `/api/editions` with the edition data:
```json
{
  "name": "Star Trek: The Next Generation - Season 2",
  "internalName": "star-trek-tng-s2",
  "franchise": "Star Trek",
  "description": "Star Trek: The Next Generation Season 2 Collection",
  "retailPrice": 19.99,
  "isDefault": false
}
```

### 2. Import the Ships

Once the edition is created, you can import the ships using either JSON or CSV format.

#### Using JSON
1. Prepare a JSON file following the structure in `new-edition-import.json`
2. Go to the Import page
3. Select "JSON" as the import format
4. Upload your JSON file
5. Review the preview
6. Click "Import"

#### Using CSV
1. Prepare a CSV file with the following columns:
   - issue
   - edition
   - shipName
   - faction
   - releaseDate
   - owned
   - wishlist
   - wishlistPriority
   - retailPrice
   - description
2. Go to the Import page
3. Select "CSV" as the import format
4. Upload your CSV file
5. Review the preview
6. Click "Import"

## Important Notes

1. The `edition` field in the ship data must exactly match the edition name you created
2. Make sure the `internalName` follows the naming convention: lowercase, hyphenated
3. All dates should be in ISO format (YYYY-MM-DD)
4. Boolean fields (owned, wishlist) should be true/false
5. Numeric fields (retailPrice, wishlistPriority) should be numbers

## Troubleshooting

If you encounter issues during import:

1. Check that the edition name matches exactly
2. Verify all required fields are present
3. Ensure date formats are correct
4. Check that numeric fields contain valid numbers
5. Make sure the franchise exists in the database

## Example Commands

### Using curl to create an edition:
```bash
curl -X POST http://localhost:3000/api/editions \
  -H "Content-Type: application/json" \
  -d @new-edition-import.json
```

### Using curl to import ships:
```bash
curl -X POST http://localhost:3000/api/import \
  -F "file=@new-edition-import.json" \
  -F "format=json"
``` 