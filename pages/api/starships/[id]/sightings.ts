import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/dbConnect';
import Starship from '../../../../models/Starship';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  
  try {
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected successfully');
    
    // GET - Retrieve all sightings for a starship
    if (req.method === 'GET') {
      const starship = await Starship.findById(id);
      
      if (!starship) {
        return res.status(404).json({ success: false, message: 'Starship not found' });
      }
      
      return res.status(200).json({ 
        success: true, 
        data: starship.sightings || [] 
      });
    }
    
    // POST - Add a new sighting
    if (req.method === 'POST') {
      console.log('POST request received for sightings');
      console.log('Request body:', req.body);
      console.log('Starship ID:', id);
      
      const { location, date, price, url, notes } = req.body;
      
      if (!location) {
        console.log('Location is required but not provided');
        return res.status(400).json({ success: false, message: 'Location is required' });
      }
      
      const starship = await Starship.findById(id);
      
      if (!starship) {
        console.log('Starship not found with ID:', id);
        return res.status(404).json({ success: false, message: 'Starship not found' });
      }
      
      console.log('Found starship:', starship.shipName);
      
      // Add new sighting
      const newSighting = {
        location,
        date: date || new Date(),
        price,
        url,
        notes
      };
      
      console.log('New sighting to add:', newSighting);
      
      // Initialize sightings array if it doesn't exist
      if (!starship.sightings) {
        console.log('Initializing sightings array');
        starship.sightings = [];
      }
      
      starship.sightings.push(newSighting);
      
      // Always update the market value with the most recent sighting price
      if (price) {
        console.log('Updating market value from', starship.marketValue, 'to', price);
        starship.marketValue = price;
      }
      
      try {
        console.log('Saving starship with new sighting');
        await starship.save();
        console.log('Starship saved successfully');
        console.log('Updated starship data:', {
          shipName: starship.shipName,
          marketValue: starship.marketValue,
          sightingsCount: starship.sightings.length
        });
        
        return res.status(201).json({ 
          success: true, 
          data: starship.sightings[starship.sightings.length - 1],
          message: 'Sighting added successfully' 
        });
      } catch (saveError) {
        console.error('Error saving starship:', saveError);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to save sighting',
          error: String(saveError)
        });
      }
    }
    
    // PUT - Update a sighting
    if (req.method === 'PUT') {
      const { sightingId, location, date, price, url, notes } = req.body;
      
      if (!sightingId) {
        return res.status(400).json({ success: false, message: 'Sighting ID is required' });
      }
      
      const starship = await Starship.findById(id);
      
      if (!starship) {
        return res.status(404).json({ success: false, message: 'Starship not found' });
      }
      
      // Find the sighting to update
      if (!starship.sightings || starship.sightings.length === 0) {
        return res.status(404).json({ success: false, message: 'No sightings found for this starship' });
      }
      
      const sightingIndex = starship.sightings.findIndex(
        (s: any) => s._id.toString() === sightingId
      );
      
      if (sightingIndex === -1) {
        return res.status(404).json({ success: false, message: 'Sighting not found' });
      }
      
      // Update the sighting
      if (location) starship.sightings[sightingIndex].location = location;
      if (date) starship.sightings[sightingIndex].date = new Date(date);
      if (price !== undefined) starship.sightings[sightingIndex].price = price;
      if (url !== undefined) starship.sightings[sightingIndex].url = url;
      if (notes !== undefined) starship.sightings[sightingIndex].notes = notes;
      
      await starship.save();
      
      return res.status(200).json({ 
        success: true, 
        data: starship.sightings[sightingIndex],
        message: 'Sighting updated successfully' 
      });
    }
    
    // DELETE - Remove a sighting
    if (req.method === 'DELETE') {
      const { sightingId } = req.body;
      
      if (!sightingId) {
        return res.status(400).json({ success: false, message: 'Sighting ID is required' });
      }
      
      const starship = await Starship.findById(id);
      
      if (!starship) {
        return res.status(404).json({ success: false, message: 'Starship not found' });
      }
      
      // Find the sighting to delete
      if (!starship.sightings || starship.sightings.length === 0) {
        return res.status(404).json({ success: false, message: 'No sightings found for this starship' });
      }
      
      const sightingIndex = starship.sightings.findIndex(
        (s: any) => s._id.toString() === sightingId
      );
      
      if (sightingIndex === -1) {
        return res.status(404).json({ success: false, message: 'Sighting not found' });
      }
      
      // Remove the sighting
      starship.sightings.splice(sightingIndex, 1);
      
      await starship.save();
      
      return res.status(200).json({ 
        success: true, 
        message: 'Sighting deleted successfully' 
      });
    }
    
    // Method not allowed
    return res.status(405).json({ success: false, message: 'Method not allowed' });
    
  } catch (error) {
    console.error('Error handling sightings:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return res.status(500).json({ success: false, message: 'Server error', error: String(error) });
  }
} 