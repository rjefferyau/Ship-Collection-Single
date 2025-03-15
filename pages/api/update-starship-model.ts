import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Path to the Starship model file
    const modelPath = path.join(process.cwd(), 'models', 'Starship.ts');
    
    // Check if the file exists
    if (!fs.existsSync(modelPath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Starship model file not found' 
      });
    }
    
    // Read the current model file
    const currentModelContent = fs.readFileSync(modelPath, 'utf8');
    
    // Create a backup of the current model
    const backupPath = path.join(process.cwd(), 'models', `Starship.backup.${Date.now()}.ts`);
    fs.writeFileSync(backupPath, currentModelContent);
    
    // Update the collection name in the model
    let updatedModelContent = currentModelContent;
    
    // Replace the collection name
    updatedModelContent = updatedModelContent.replace(
      /collection: ['"]starshipv4['"],/g, 
      'collection: \'starshipv5\','
    );
    
    // Add originalId to the schema if it doesn't exist
    if (!updatedModelContent.includes('originalId:')) {
      updatedModelContent = updatedModelContent.replace(
        /const StarshipSchema = new Schema\({/,
        'const StarshipSchema = new Schema({\n  originalId: { type: Schema.Types.ObjectId, ref: \'Starship\', index: true },'
      );
    }
    
    // Write the updated model back to the file
    fs.writeFileSync(modelPath, updatedModelContent);
    
    return res.status(200).json({
      success: true,
      message: 'Starship model updated successfully',
      details: {
        backupPath: backupPath,
        modelPath: modelPath
      }
    });
  } catch (error) {
    console.error('Error updating Starship model:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while updating the Starship model',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 