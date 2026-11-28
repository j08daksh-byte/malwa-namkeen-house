import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'malwa_namkeen' });
  const db = mongoose.connection.db;
  const categories = await db.collection('categories').find({}).toArray();
  console.log('Total categories:', categories.length);
  for (const c of categories) {
    console.log(`- ${c.name} (${c.slug}, _id: ${c._id})`);
  }
  await mongoose.disconnect();
}
main().catch(console.error);
