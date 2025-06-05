# Starship Collection Manager

A web application for managing your collection of Star Trek starships. Built with Next.js, React, MongoDB/Mongoose, Tailwind CSS, and Font Awesome.

## Features

- Import starships from a CSV file
- Track which starships you own with a simple click
- Add starships to your wishlist and track ordering status
- Upload images for each starship
- Upload PDF magazines for each starship
- Filter by faction, edition, owned status, and wishlist status
- Sort by any column
- View statistics about your collection
- Modern UI with responsive design
- Multiple view modes (table view and gallery view)
- Database maintenance tools
- Manufacturer management and assignment

## Prerequisites

- Node.js (v14 or later)
- MongoDB (local or Atlas)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd ship-collection
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory with your MongoDB connection string:
   ```
   MONGODB_URI=mongodb://localhost:27017/ship-collection
   ```

   If you're using MongoDB Atlas, your connection string will look like:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ship-collection?retryWrites=true&w=majority
   ```

## Running the Application

1. Start the development server:
   ```
   npm run dev
   ```
   
   Or use the auto-restart script for development:
   ```
   ./start-auto-server.bat
   ```

2. Open your browser and navigate to `http://localhost:3000`

## Usage

### Importing CSV Data

1. Prepare a CSV file with the following columns:
   - Issue
   - Edition
   - Ship Name
   - Race/Faction
   - Release Date

2. Click the "Upload" button in the "Import CSV" section and select your CSV file.

### Managing Your Collection

- Click the checkmark/X button in the "Owned" column to toggle whether you own a starship.
- Click the heart icon to add a starship to your wishlist.
- Use the status cycle button to change a starship's status (not on wishlist → on wishlist → on order → not on wishlist).
- Use the filters to narrow down the displayed starships by faction, edition, owned status, or wishlist status.
- Click on column headers to sort the table.
- Click the upload icon in the "Image" column to add an image for a starship.
- Click the upload icon in the "Magazine" column to add a PDF magazine for a starship.

### Gallery View

- Click on "Gallery" in the navigation menu to view your collection in a card-based layout.
- Each card shows the starship image, name, and key details.
- Filter and sort options are available in this view as well.

### Wishlist Management

- The wishlist page shows all starships you've added to your wishlist.
- You can prioritize items in your wishlist by dragging and dropping.
- Track which items are on order with estimated arrival dates.

### Price Vault

- Track retail prices and what you paid for each starship.
- View price trends and statistics.

### Manufacturer Management

- Create and manage manufacturers for your starships
- Associate manufacturers with specific franchises
- Automatically assign manufacturers to starships based on their franchise
- View manufacturer information in starship details
- For more information, see [Manufacturer Assignment Documentation](docs/manufacturer-assignment.md)

### Viewing Statistics

The statistics section shows:
- Overall collection statistics (total ships, owned ships, percentage)
- Breakdown by edition
- Breakdown by faction
- Wishlist and on-order statistics

### Database Maintenance

The application includes tools for database maintenance:
1. **Database Check**: View detailed information about your database, including connection status, collection statistics, and storage usage.
2. **Database Fix**: Fix database issues by migrating to new collections with proper ID references.
3. **Delete Old Collections**: After successful migration, you can delete old collections to free up space.
4. **Fix Edition Names**: Correct issues with edition internal names that may cause starships to not appear in the correct franchise.

To access these tools:
1. Go to the settings menu (gear icon)
2. Select "Database Check & Maintenance" or "Fix Edition Names"

## Development

### Project Structure

- `/pages`: Next.js pages
- `/pages/api`: API routes
- `/components`: React components
- `/models`: Mongoose models
- `/lib`: Utility functions
- `/public`: Static assets
- `/styles`: CSS styles

### Future Migration

A plan for migrating to Supabase for improved multi-tenancy and maintainability is available in [SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md).

### API Endpoints

#### Starships
- `GET /api/starships`: Get all starships
- `POST /api/starships`: Create a new starship
- `GET /api/starships/:id`: Get a specific starship
- `PUT /api/starships/:id`: Update a starship
- `DELETE /api/starships/:id`: Delete a starship
- `PUT /api/starships/toggle-owned/:id`: Toggle the owned status of a starship
- `PUT /api/starships/toggle-wishlist/:id`: Toggle the wishlist status of a starship
- `PUT /api/starships/:id/cycle-status`: Cycle through starship status states

#### Uploads
- `POST /api/upload/csv`: Upload and process a CSV file
- `POST /api/upload/image`: Upload an image for a starship
- `POST /api/upload/pdf`: Upload a PDF magazine for a starship

#### Database Management
- `GET /api/database-info`: Get database information
- `POST /api/database-fix`: Fix database issues by migrating to new collections
- `POST /api/update-starship-model`: Update the Starship model to use the new collection
- `POST /api/delete-old-collections`: Delete old starship collections

#### Other
- `GET /api/editions`: Get all editions
- `GET /api/factions`: Get all factions

### Database Collections

The application uses the following MongoDB collections:
- `starshipv5`: The main collection for starship data
- `starshipIdMapping`: Maps old IDs to new IDs for backward compatibility
- `editions`: Stores edition information
- `factions`: Stores faction information

## License

MIT 