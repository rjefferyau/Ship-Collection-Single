import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import csv from 'csv-parser';
import dbConnect from '../../../lib/mongodb';
import Starship from '../../../models/Starship';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const form = new IncomingForm();
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parsing error:', err);
        return res.status(500).json({ success: false, error: 'Error parsing form' });
      }
      
      const file = files.file;
      if (!file || Array.isArray(file)) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }
      
      const filePath = file.filepath;
      const results: any[] = [];
      
      // Parse CSV file with trimmed headers
      fs.createReadStream(filePath)
        .pipe(csv({
          mapHeaders: ({ header }) => header.trim() // Trim whitespace from headers
        }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          try {
            console.log('CSV Headers:', Object.keys(results[0] || {}));
            
            // Process each row
            const starships = results.map((row) => {
              // Parse date safely
              let releaseDate = null; // Use null instead of undefined for invalid dates
              
              try {
                if (row['Release Date'] && row['Release Date'].trim() !== '') {
                  // Try different date formats (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
                  const dateStr = row['Release Date'].trim();
                  
                  // Check if it's in DD/MM/YYYY format
                  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
                    const [day, month, year] = dateStr.split('/');
                    const dateObj = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
                    if (!isNaN(dateObj.getTime())) {
                      releaseDate = dateObj;
                    }
                  } 
                  // Check if it's in MM/DD/YYYY format
                  else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
                    const dateObj = new Date(dateStr);
                    if (!isNaN(dateObj.getTime())) {
                      releaseDate = dateObj;
                    }
                  }
                  // Check if it's in YYYY-MM-DD format
                  else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
                    const dateObj = new Date(dateStr);
                    if (!isNaN(dateObj.getTime())) {
                      releaseDate = dateObj;
                    }
                  }
                  
                  if (releaseDate && isNaN(releaseDate.getTime())) {
                    console.log(`Invalid date format: ${dateStr}`);
                    releaseDate = null;
                  }
                }
              } catch (e) {
                console.error('Error parsing date:', e);
                releaseDate = null;
              }
              
              // Map CSV columns to starship properties
              return {
                issue: row.Issue?.trim() || '',
                edition: row.Edition?.trim() || '',
                shipName: row['Ship Name']?.trim() || '',
                faction: row['Race/Faction']?.trim() || '',
                releaseDate: releaseDate,
                imageUrl: row.Image?.trim() || '',
                owned: row.owned === 'true' || row.owned === true,
              };
            }).filter(starship => 
              // Filter out entries with missing required fields
              starship.issue && starship.issue.trim() !== '' &&
              starship.edition && starship.edition.trim() !== '' &&
              starship.shipName && starship.shipName.trim() !== '' &&
              starship.faction && starship.faction.trim() !== ''
            );
            
            if (starships.length === 0) {
              return res.status(400).json({ 
                success: false, 
                error: 'No valid starships found in CSV',
                headers: Object.keys(results[0] || {})
              });
            }
            
            // Insert starships into database one by one to better handle errors
            let successCount = 0;
            let errorCount = 0;
            
            for (const starship of starships) {
              try {
                // Create a clean object without null releaseDate
                const starshipToSave: any = {
                  issue: starship.issue,
                  edition: starship.edition,
                  shipName: starship.shipName,
                  faction: starship.faction,
                  imageUrl: starship.imageUrl,
                  owned: starship.owned
                };
                
                // Only add releaseDate if it's valid
                if (starship.releaseDate !== null) {
                  starshipToSave.releaseDate = starship.releaseDate;
                }
                
                await Starship.findOneAndUpdate(
                  { issue: starship.issue, edition: starship.edition },
                  starshipToSave,
                  { upsert: true, new: true }
                );
                successCount++;
              } catch (error) {
                console.error('Error inserting starship:', error);
                errorCount++;
              }
            }
            
            res.status(200).json({ 
              success: true, 
              message: `Imported ${successCount} starships (${errorCount} errors)`,
              headers: Object.keys(results[0] || {})
            });
          } catch (error) {
            console.error('Error processing CSV:', error);
            res.status(500).json({ success: false, error: 'Error processing CSV' });
          }
        })
        .on('error', (error) => {
          console.error('CSV parsing error:', error);
          res.status(500).json({ success: false, error: 'Error parsing CSV file' });
        });
    });
  } catch (error) {
    console.error('Error handling upload:', error);
    res.status(500).json({ success: false, error: 'Error handling upload' });
  }
} 