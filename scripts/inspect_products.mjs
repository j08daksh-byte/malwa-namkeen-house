import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'malwa_namkeen' });
  const db = mongoose.connection.db;
  const products = await db.collection('products').find({}).toArray();
  console.log('Total products:', products.length);
  for (const p of products) {
    const variants = p.variants?.map(v => `${v.label || v.weight || 'Default'}: ₹${v.price} (stock:${v.stock})`).join(', ');
    console.log(`- [${p.category}] ${p.name} (${p.slug}): ${variants}`);
  }
  await mongoose.disconnect();
}
main().catch(console.error);
