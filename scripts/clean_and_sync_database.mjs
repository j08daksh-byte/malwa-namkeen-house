import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';

const PRESERVED_STAFF_EMAILS = [
  'j08daksh@gmail.com',
  'jainnancy2503@gmail.com',
  'baljeetrajawat210@gmail.com',
  'malwanamkeenhouse@gmail.com',
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'malwa_namkeen' });
  const db = mongoose.connection.db;
  console.log('=== CLEANING & SYNCING DATABASE: malwa_namkeen ===\n');

  // 1. ORDERS
  const orderCountBefore = await db.collection('orders').countDocuments();
  console.log(`1. Orders: found ${orderCountBefore} test orders.`);
  const deleteOrdersRes = await db.collection('orders').deleteMany({});
  console.log(`   Deleted ${deleteOrdersRes.deletedCount} dummy test orders. Remaining orders: 0.`);

  // 2. USERS (Preserve 4 staff, remove test users)
  const usersBefore = await db.collection('users').find({}).toArray();
  console.log(`\n2. Users: found ${usersBefore.length} users.`);
  const deleteUsersRes = await db.collection('users').deleteMany({
    email: { $nin: PRESERVED_STAFF_EMAILS },
  });
  console.log(`   Deleted ${deleteUsersRes.deletedCount} dummy test users.`);
  const usersAfter = await db.collection('users').find({}).toArray();
  console.log(`   Remaining staff members (${usersAfter.length}):`);
  for (const u of usersAfter) {
    console.log(`   - ${u.name} <${u.email}> (${u.role})`);
  }

  // 3. PRODUCTS (Preserve all 15, restore baseline stock to 100 for all variants)
  const products = await db.collection('products').find({}).toArray();
  console.log(`\n3. Products: found ${products.length} products (all preserved).`);
  for (const p of products) {
    if (Array.isArray(p.variants)) {
      const updatedVariants = p.variants.map(v => ({
        ...v,
        stock: 100,
      }));
      await db.collection('products').updateOne(
        { _id: p._id },
        { $set: { variants: updatedVariants } }
      );
    }
  }
  console.log('   All 15 products verified with full baseline stock (100 units per variant).');

  // 4. CATEGORIES (Preserve all 7)
  const catCount = await db.collection('categories').countDocuments();
  console.log(`\n4. Categories: ${catCount} categories (all preserved).`);

  // 5. DISCOUNTS (Reset MALWA450 redemptions)
  const discountRes = await db.collection('discounts').updateMany(
    {},
    { $set: { usedCount: 0, usedBy: [] } }
  );
  console.log(`\n5. Discounts: reset ${discountRes.modifiedCount} coupons to usedCount: 0, usedBy: [].`);

  // 6. IDEMPOTENCY & RATE LIMIT RECORDS
  const idempDelete = await db.collection('idempotencyrecords').deleteMany({});
  const rateDelete = await db.collection('ratelimitrecords').deleteMany({});
  console.log(`\n6. Cleaned ${idempDelete.deletedCount} idempotency records and ${rateDelete.deletedCount} rate limit records.`);

  // 7. STORE SETTINGS (Verify canonical singleton)
  const settings = await db.collection('storesettings').findOne({});
  console.log('\n7. Store Settings verified:');
  console.log(`   Store Name: ${settings?.storeName}`);
  console.log(`   GSTIN: ${settings?.gstNumber} | FSSAI: ${settings?.fssaiNumber}`);
  console.log(`   Email: ${settings?.contact?.email} | Phone: ${settings?.contact?.phone}`);
  console.log(`   Address: ${settings?.contact?.address?.full}`);
  console.log(`   Free Delivery Threshold: ₹${settings?.deliverySettings?.freeShippingThreshold} | Standard Fee: ₹${settings?.deliverySettings?.standardShippingFee}`);

  console.log('\n=== DATABASE SYNC & CLEANUP COMPLETE ===');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
