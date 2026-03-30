const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Service = require('./models/Service');
const { Facility } = require('./models/Facility');
const Wallet = require('./models/Wallet');
dotenv.config();

const services = [
  // Grocery
  { name: 'Fresh Milk (1L)', category: 'grocery', subCategory: 'Dairy', price: 5, unit: 'per litre', estimatedTime: '20-30 mins' },
  { name: 'Eggs (12 pcs)', category: 'grocery', subCategory: 'Dairy', price: 8, unit: 'per dozen', estimatedTime: '20-30 mins' },
  { name: 'Bread Loaf', category: 'grocery', subCategory: 'Packaged Food', price: 4, unit: 'per loaf', estimatedTime: '20-30 mins' },
  { name: 'Mineral Water (20L)', category: 'grocery', subCategory: 'Drinking Water', price: 15, unit: 'per can', estimatedTime: '30-45 mins' },
  { name: 'Mixed Vegetables (1kg)', category: 'grocery', subCategory: 'Fruits & Vegetables', price: 10, unit: 'per kg', estimatedTime: '20-30 mins' },
  { name: 'Banana (1 dozen)', category: 'grocery', subCategory: 'Fruits & Vegetables', price: 6, unit: 'per dozen', estimatedTime: '20-30 mins' },
  // Housekeeping
  { name: 'House Cleaning (2BHK)', category: 'housekeeping', subCategory: 'Cleaning', price: 120, unit: 'per session', estimatedTime: '2-3 hours' },
  { name: 'Laundry Pickup', category: 'housekeeping', subCategory: 'Laundry', price: 80, unit: 'per bag', estimatedTime: '24 hours' },
  { name: 'Garbage Pickup', category: 'housekeeping', subCategory: 'Garbage', price: 0, unit: 'free', estimatedTime: '30 mins' },
  { name: 'Deep Cleaning (Full Home)', category: 'housekeeping', subCategory: 'Cleaning', price: 350, unit: 'per session', estimatedTime: '5-6 hours' },
  // Maintenance
  { name: 'Plumbing Repair', category: 'maintenance', subCategory: 'Plumbing', price: 80, unit: 'per visit', estimatedTime: '1-2 hours' },
  { name: 'Electrical Issue Fix', category: 'maintenance', subCategory: 'Electrical', price: 90, unit: 'per visit', estimatedTime: '1-2 hours' },
  { name: 'AC Maintenance', category: 'maintenance', subCategory: 'AC', price: 150, unit: 'per visit', estimatedTime: '2-3 hours' },
  { name: 'Appliance Repair', category: 'maintenance', subCategory: 'Appliance', price: 100, unit: 'per visit', estimatedTime: '1-3 hours' },
  // Utility
  { name: 'Car Washing (Sedan)', category: 'utility', subCategory: 'Car Wash', price: 50, unit: 'per wash', estimatedTime: '45-60 mins' },
  { name: 'Moving Assistance', category: 'utility', subCategory: 'Moving', price: 250, unit: 'per day', estimatedTime: 'Full day' },
  // Spa & Wellness
  { name: 'Full Body Massage (60 min)', category: 'spa_wellness', subCategory: 'Massage', price: 350, unit: 'per session', estimatedTime: '60 mins' },
  { name: 'Haircut (Men)', category: 'spa_wellness', subCategory: 'Salon', price: 60, unit: 'per session', estimatedTime: '30 mins' },
  { name: 'Manicure & Pedicure', category: 'spa_wellness', subCategory: 'Grooming', price: 180, unit: 'per session', estimatedTime: '60-90 mins' },
  { name: 'Hydrating Facial', category: 'spa_wellness', subCategory: 'Skin Care', price: 250, unit: 'per session', estimatedTime: '45-60 mins' },
  { name: 'Yoga Session (Private)', category: 'spa_wellness', subCategory: 'Wellness', price: 180, unit: 'per session', estimatedTime: '60 mins' },
];

const facilities = [
  { name: 'Gymnasium', type: 'gym', description: 'Fully equipped gym with cardio and weights', capacity: 15, operatingHours: '06:00 AM - 11:00 PM' },
  { name: 'Swimming Pool', type: 'pool', description: 'Temperature-controlled infinity pool', capacity: 20, operatingHours: '07:00 AM - 10:00 PM' },
  { name: 'Clubhouse Hall', type: 'clubhouse', description: 'Event and party hall with AV setup', capacity: 100, operatingHours: '10:00 AM - 11:00 PM' },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
  await Service.deleteMany();
  await Facility.deleteMany();
  await User.deleteMany({ role: 'admin' });
  await Wallet.deleteMany();
  await Service.insertMany(services);
  await Facility.insertMany(facilities);
  const admin = await User.create({
    name: 'Admin', email: 'admin@apartment.com',
    password: 'admin123', apartmentNumber: 'ADMIN', role: 'admin',
  });
  const wallet = await Wallet.create({ user: admin._id, balance: 500 });
  wallet.transactions.push({ type: 'credit', amount: 500, description: 'Welcome bonus', balanceAfter: 500 });
  await wallet.save();
  console.log('✅ Seeded: services (AED), facilities, admin user, wallet');
  console.log('Admin login: admin@apartment.com / admin123');
  process.exit();
};
seed().catch(err => { console.error(err); process.exit(1); });
