import mongoose from 'mongoose';
import dbConnect from './mongodb';

/**
 * Centralized database service for direct MongoDB collection access
 * Provides consistent error handling and connection management
 */
export class DatabaseService {
  private static starshipCollection: any = null;

  /**
   * Get the starship collection with connection handling
   */
  static async getStarshipCollection() {
    try {
      if (!this.starshipCollection) {
        await dbConnect();
        this.starshipCollection = mongoose.connection.collection('starshipv5');
      }
      return this.starshipCollection;
    } catch (error) {
      console.error('Failed to get starship collection:', error);
      throw new Error('Database connection failed');
    }
  }

  /**
   * Find a starship by ID with proper error handling
   */
  static async findStarshipById(id: string) {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid ID format');
    }

    try {
      const collection = await this.getStarshipCollection();
      const starship = await collection.findOne({ _id: id });
      
      if (!starship) {
        throw new Error(`Starship not found with ID: ${id}`);
      }
      
      return starship;
    } catch (error) {
      console.error(`Error finding starship by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update a starship with proper validation and error handling
   */
  static async updateStarship(id: string, updateFields: any) {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid ID format');
    }

    if (!updateFields || Object.keys(updateFields).length === 0) {
      throw new Error('No update fields provided');
    }

    try {
      // Always add updatedAt timestamp
      const fieldsWithTimestamp = {
        ...updateFields,
        updatedAt: new Date()
      };

      const collection = await this.getStarshipCollection();
      const result = await collection.updateOne(
        { _id: id },
        { $set: fieldsWithTimestamp }
      );

      if (result.matchedCount === 0) {
        throw new Error(`Starship not found with ID: ${id}`);
      }

      if (result.modifiedCount === 0) {
        throw new Error('Update failed - no changes made');
      }

      return result;
    } catch (error) {
      console.error(`Error updating starship ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get the updated starship after an update operation
   */
  static async getUpdatedStarship(id: string) {
    try {
      const collection = await this.getStarshipCollection();
      const updatedStarship = await collection.findOne({ _id: id });
      
      if (!updatedStarship) {
        throw new Error(`Starship not found after update: ${id}`);
      }

      return {
        ...updatedStarship,
        _id: updatedStarship._id.toString()
      };
    } catch (error) {
      console.error(`Error getting updated starship ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find the highest wishlist priority for setting new priorities
   */
  static async getHighestWishlistPriority() {
    try {
      const collection = await this.getStarshipCollection();
      const highestPriorityDoc = await collection.findOne(
        { wishlist: true },
        { sort: { wishlistPriority: -1 }, limit: 1 }
      );
      
      return highestPriorityDoc?.wishlistPriority || 0;
    } catch (error) {
      console.error('Error getting highest wishlist priority:', error);
      throw error;
    }
  }

  /**
   * Get the next available wishlist priority
   */
  static async getNextWishlistPriority() {
    try {
      const highestPriority = await this.getHighestWishlistPriority();
      return highestPriority + 1;
    } catch (error) {
      console.error('Error getting next wishlist priority:', error);
      throw error;
    }
  }

  /**
   * Validate if an ID exists in the database
   */
  static async validateStarshipId(id: string) {
    if (!id || typeof id !== 'string') {
      return false;
    }

    try {
      const collection = await this.getStarshipCollection();
      const count = await collection.countDocuments({ _id: id });
      return count > 0;
    } catch (error) {
      console.error(`Error validating starship ID ${id}:`, error);
      return false;
    }
  }

  /**
   * Get collection statistics for debugging
   */
  static async getCollectionStats() {
    try {
      const collection = await this.getStarshipCollection();
      const totalDocs = await collection.countDocuments();
      const sampleDoc = await collection.findOne({});
      
      return {
        database: mongoose.connection.db.databaseName,
        collection: collection.collectionName,
        totalDocuments: totalDocs,
        sampleId: sampleDoc?._id?.toString()
      };
    } catch (error) {
      console.error('Error getting collection stats:', error);
      throw error;
    }
  }

  /**
   * Calculate status cycle transitions for a starship
   */
  static async calculateStatusCycle(starship: any, direction: 'forward' | 'backward') {
    let updateFields: any = {};
    let message = '';

    if (direction === 'forward') {
      // Forward cycle: not interested → wishlist → on order → owned → not interested
      if (starship.notInterested) {
        const nextPriority = await this.getNextWishlistPriority();
        updateFields = {
          notInterested: false,
          wishlist: true,
          wishlistPriority: nextPriority
        };
        message = 'Added to wishlist';
      }
      else if (starship.owned) {
        updateFields = {
          owned: false,
          notInterested: true
        };
        message = 'Marked as not interested';
      }
      else if (starship.onOrder) {
        updateFields = {
          onOrder: false,
          owned: true
        };
        message = 'Marked as owned';
      }
      else if (starship.wishlist) {
        updateFields = {
          wishlist: false,
          wishlistPriority: null,
          onOrder: true,
          orderDate: new Date()
        };
        
        // Use retail price as default price paid if available
        if (starship.retailPrice) {
          updateFields.pricePaid = starship.retailPrice;
        }
        
        message = 'Marked as on order';
      }
      else {
        // Neutral state → Mark as not interested
        updateFields = {
          notInterested: true
        };
        message = 'Marked as not interested';
      }
    } else {
      // Backward cycle: neutral → owned → on order → wishlist → not interested → neutral
      if (starship.notInterested) {
        updateFields = {
          notInterested: false
        };
        message = 'Removed from not interested';
      }
      else if (starship.owned) {
        updateFields = {
          owned: false
        };
        message = 'Unmarked as owned';
      }
      else if (starship.onOrder) {
        const nextPriority = await this.getNextWishlistPriority();
        updateFields = {
          onOrder: false,
          orderDate: null,
          wishlist: true,
          wishlistPriority: nextPriority
        };
        message = 'Moved back to wishlist';
      }
      else if (starship.wishlist) {
        updateFields = {
          wishlist: false,
          wishlistPriority: null,
          notInterested: true
        };
        message = 'Marked as not interested';
      }
      else {
        // Neutral state → Mark as owned
        updateFields = {
          owned: true
        };
        message = 'Marked as owned';
      }
    }

    return { updateFields, message };
  }
}