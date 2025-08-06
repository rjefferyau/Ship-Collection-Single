const mongoose = require('mongoose');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ship-collection-v2');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Starship schema (simplified for this fix)
const starshipSchema = new mongoose.Schema({}, { strict: false, collection: 'starshipv5' });
const Starship = mongoose.model('Starship', starshipSchema);

const fixOwnedWishlistConflict = async () => {
  console.log('🔍 Searching for items with conflicting owned+wishlist status...');
  
  // Find items that are both owned AND wishlist
  const conflictedItems = await Starship.find({
    owned: true,
    wishlist: true
  });
  
  console.log(`📊 Found ${conflictedItems.length} items with conflicting status`);
  
  if (conflictedItems.length === 0) {
    console.log('✅ No conflicts found!');
    return;
  }
  
  // Display the conflicts
  console.log('\n🚨 Items with conflicts:');
  conflictedItems.forEach((item, index) => {
    console.log(`${index + 1}. ${item.shipName} (${item.edition} #${item.issue})`);
    console.log(`   - owned: ${item.owned}, wishlist: ${item.wishlist}, priority: ${item.wishlistPriority}`);
  });
  
  console.log('\n🔧 Fixing conflicts...');
  console.log('   Rule: If owned=true, then wishlist=false (remove from wishlist)');
  
  // Fix the conflicts: if owned, remove from wishlist
  const updateResult = await Starship.updateMany(
    { owned: true, wishlist: true },
    { 
      $set: { wishlist: false },
      $unset: { wishlistPriority: "" }
    }
  );
  
  console.log(`✅ Updated ${updateResult.modifiedCount} items`);
  console.log('   - Set wishlist=false for all owned items');
  console.log('   - Removed wishlistPriority field');
  
  // Verify the fix
  const remainingConflicts = await Starship.countDocuments({
    owned: true,
    wishlist: true
  });
  
  if (remainingConflicts === 0) {
    console.log('✅ All conflicts resolved!');
  } else {
    console.log(`⚠️  Still ${remainingConflicts} conflicts remaining`);
  }
};

const main = async () => {
  try {
    await connectDB();
    await fixOwnedWishlistConflict();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Database connection closed');
  }
};

main();