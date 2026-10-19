import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'malwa_namkeen' });
  const db = mongoose.connection.db;
  console.log('--- Connected to DB:', mongoose.connection.name, '---');
  
  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`${c.name}: ${count}`);
  }

  console.log('\n--- Orders ---');
  const orders = await db.collection('orders').find({}).toArray();
  console.log('Orders count:', orders.length);
  for (const o of orders) {
    console.log(`Order ${o.orderNumber || o._id}: user=${o.userId}, total=₹${o.totalAmount}, status=${o.status}, paymentStatus=${o.paymentStatus}, customer=${o.shippingAddress?.fullName || o.customerName}`);
  }

  console.log('\n--- Users ---');
  const users = await db.collection('users').find({}).toArray();
  console.log('Users count:', users.length);
  for (const u of users) {
    console.log(`User: ${u.email} | name: ${u.name} | role: ${u.role} | createdAt: ${u.createdAt}`);
  }

  console.log('\n--- Discounts ---');
  const discounts = await db.collection('discounts').find({}).toArray();
  console.log('Discounts count:', discounts.length);
  for (const d of discounts) {
    console.log(`Coupon: ${d.code} | usedCount: ${d.usedCount} | usedBy: ${JSON.stringify(d.usedBy)}`);
  }

  console.log('\n--- Store Settings ---');
  const settings = await db.collection('storesettings').findOne({});
  console.log('Store Settings:', JSON.stringify(settings, null, 2));

  console.log('\n--- Inquiries ---');
  const inquiries = await db.collection('inquiries').find({}).toArray();
  console.log('Inquiries count:', inquiries.length);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
