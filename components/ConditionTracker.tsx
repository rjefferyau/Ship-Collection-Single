import React, { useState } from 'react';
import { Form, Button, Card, Image } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Starship } from '../pages/api/starships';

interface ConditionTrackerProps {
  starship: Starship;
  onUpdate: (updatedData: Partial<Starship>) => Promise<void>;
}

const ConditionTracker: React.FC<ConditionTrackerProps> = ({ starship, onUpdate }) => {
  const [condition, setCondition] = useState(starship.condition || 'Mint');
  const [notes, setNotes] = useState(starship.conditionNotes || '');
  const [photos, setPhotos] = useState<string[]>(starship.conditionPhotos || []);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handlePhotoUpload = async () => {
    if (!newPhoto) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, you would upload to a storage service
      // For now, we'll use a placeholder URL
      const photoUrl = URL.createObjectURL(newPhoto);
      
      const newPhotos = [...photos, photoUrl];
      setPhotos(newPhotos);
      
      await onUpdate({
        conditionPhotos: newPhotos
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setIsLoading(false);
      setNewPhoto(null);
    }
  };
  
  const handleRemovePhoto = async (index: number) => {
    try {
      const newPhotos = [...photos];
      newPhotos.splice(index, 1);
      setPhotos(newPhotos);
      
      await onUpdate({
        conditionPhotos: newPhotos
      });
    } catch (error) {
      console.error('Error removing photo:', error);
    }
  };
  
  const saveConditionChanges = async () => {
    setIsLoading(true);
    try {
      await onUpdate({
        condition,
        conditionNotes: notes,
        lastInspectionDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving condition changes:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="mt-3">
      <Card.Header>Condition Details</Card.Header>
      <Card.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Condition</Form.Label>
            <Form.Select 
              value={condition} 
              onChange={(e) => setCondition(e.target.value)}
            >
              <option value="Mint">Mint</option>
              <option value="Near Mint">Near Mint</option>
              <option value="Very Good">Very Good</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Condition Notes</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3} 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe any damage, wear, or special features..."
            />
          </Form.Group>
          
          <div className="mb-3">
            <Form.Label>Condition Photos</Form.Label>
            <div className="d-flex flex-wrap gap-2 mb-2">
              {photos.map((photo, index) => (
                <div key={index} className="position-relative">
                  <Image 
                    src={photo} 
                    alt={`Condition photo ${index+1}`} 
                    thumbnail 
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                  />
                  <Button 
                    variant="danger" 
                    size="sm" 
                    className="position-absolute top-0 end-0"
                    onClick={() => handleRemovePhoto(index)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="d-flex gap-2">
              <Form.Control 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  setNewPhoto(target.files?.[0] || null);
                }}
              />
              <Button 
                onClick={handlePhotoUpload} 
                disabled={!newPhoto || isLoading}
              >
                <FontAwesomeIcon icon={faCamera} /> Add
              </Button>
            </div>
          </div>
          
          <Button 
            onClick={saveConditionChanges} 
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Condition Details'}
          </Button>
        </Form>
      </Card.Body>
      <Card.Footer className="text-muted">
        Last inspection: {starship.lastInspectionDate 
          ? new Date(starship.lastInspectionDate).toLocaleDateString() 
          : 'Never'}
      </Card.Footer>
    </Card>
  );
};

export default ConditionTracker; 