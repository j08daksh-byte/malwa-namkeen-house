import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';
import { Order } from '../server/models/Order.ts';
import { Product } from '../server/models/Product.ts';
import { User } from '../server/models/User.ts';
import { Category } from '../server/models/Category.ts';
import { Discount } from '../server/models/Discount.ts';
import { Inquiry } from '../server/models/Inquiry.ts';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'malwa_namkeen' });
  
  const [
    totalOrders,
    pendingOrders,
    paidRevenueAgg,
    totalCustomers,
    totalProducts,
    activeProducts,
    totalCategories,
    activeDiscounts,
    newInquiries,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: { $in: ['pending', 'confirmed', 'processing'] } }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' }, paidCount: { $sum: 1 } } },
    ]),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments(),
    Product.countDocuments({ active: true }),
    Category.countDocuments({ active: true }),
    Discount.countDocuments({ active: true }),
    Inquiry.countDocuments({ status: 'new' }),
  ]);

  console.log('--- Admin Dashboard Stats (Live) ---');
  console.log('Total Orders:', totalOrders);
  console.log('Pending Orders awaiting fulfillment:', pendingOrders);
  console.log('Paid Revenue: ₹', paidRevenueAgg[0]?.totalRevenue || 0);
  console.log('Patrons / Customers:', totalCustomers);
  console.log('Total Products:', totalProducts, `(${activeProducts} active)`);
  console.log('Categories:', totalCategories);
  console.log('Active Coupons:', activeDiscounts);
  console.log('New Inquiries:', newInquiries);

  await mongoose.disconnect();
}
main().catch(console.error);
