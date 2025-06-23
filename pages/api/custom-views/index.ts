import { createCollectionApiHandler } from '../../../lib/apiHandler';
import CustomView from '../../../models/CustomView';

export default createCollectionApiHandler(CustomView, 'Custom View', {
  sortOptions: { isDefault: -1, name: 1 }
}); 