import { createResourceApiHandler } from '../../../lib/apiHandler';
import Starship from '../../../models/Starship';

export default createResourceApiHandler(Starship, 'Starship', {
  allowedMethods: ['GET', 'PUT', 'PATCH', 'DELETE'],
  customHandlers: {
    // Custom logic can be added here if needed
  }
});