# Starship Collection Manager

A web application for managing your collection of Star Trek starships. Built with Next.js, React, MongoDB/Mongoose, Bootstrap 5, and Font Awesome.

## Features

- Import starships from a CSV file
- Track which starships you own with a simple click
- Upload images for each starship
- Filter by faction, edition, and owned status
- Sort by any column
- View statistics about your collection

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
- Use the filters to narrow down the displayed starships by faction, edition, or owned status.
- Click on column headers to sort the table.
- Click the upload icon in the "Image" column to add an image for a starship.

### Viewing Statistics

The statistics section at the top of the page shows:
- Overall collection statistics (total ships, owned ships, percentage)
- Breakdown by edition
- Breakdown by faction

## Development

### Project Structure

- `/pages`: Next.js pages
- `/pages/api`: API routes
- `/components`: React components
- `/models`: Mongoose models
- `/lib`: Utility functions
- `/public`: Static assets
- `/styles`: CSS styles

### API Endpoints

- `GET /api/starships`: Get all starships
- `POST /api/starships`: Create a new starship
- `GET /api/starships/:id`: Get a specific starship
- `PUT /api/starships/:id`: Update a starship
- `DELETE /api/starships/:id`: Delete a starship
- `PUT /api/starships/toggle-owned/:id`: Toggle the owned status of a starship
- `POST /api/upload/csv`: Upload and process a CSV file
- `POST /api/upload/image`: Upload an image for a starship

## License

MIT 