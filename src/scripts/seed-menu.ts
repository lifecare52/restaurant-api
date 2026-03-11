import 'dotenv/config'; // Make sure process.env contains MONGODB_URI and others
import mongoose from 'mongoose';
import { Types } from 'mongoose';

import AddonEntity from '../modules/menu/addons/addon.model';
import CategoryEntity from '../modules/menu/category/category.model';
import MenuItemEntity from '../modules/menu/menu-items/menu-item.model';
import VariationEntity from '../modules/menu/variations/variation.model';
import { VariationDepartment } from '../modules/menu/variations/variation.types';
import { Dietary } from '../shared/enum';

// Setup basic info from user request
const brandId = new Types.ObjectId('69a9a3abe46a664f8002a4eb');
const outletId = new Types.ObjectId('69a9a3c7e46a664f8002a4ef');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant';

async function seedData() {
  try {
    console.log(`Connecting to database at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    // 1. Create Categories
    console.log('Creating Categories...');
    const categoriesToCreate = [
      { brandId, outletId, name: 'Starters' },
      { brandId, outletId, name: 'Main Course' },
      { brandId, outletId, name: 'Breads' },
      { brandId, outletId, name: 'Desserts' },
      { brandId, outletId, name: 'Beverages' }
    ];
    let categories: any[] = [];
    for (const cat of categoriesToCreate) {
      const existing = await CategoryEntity.findOne({ brandId, outletId, name: cat.name });
      if (existing) {
        categories.push(existing);
      } else {
        categories.push(await CategoryEntity.create(cat));
      }
    }
    console.log(`Ensured ${categories.length} Categories exist.`);

    // 2. Create Addons
    console.log('Creating Addons...');
    const addonsToCreate = [
      {
        brandId,
        outletId,
        name: 'Extra Dips',
        items: [
          { name: 'Mint Chutney', price: 20, dietary: Dietary.VEG },
          { name: 'Garlic Mayo', price: 30, dietary: Dietary.VEG },
          { name: 'Sweet Chili', price: 25, dietary: Dietary.VEG }
        ]
      },
      {
        brandId,
        outletId,
        name: 'Extra Toppings',
        items: [
          { name: 'Extra Cheese', price: 50, dietary: Dietary.VEG },
          { name: 'Olives & Jalapenos', price: 40, dietary: Dietary.VEG },
          { name: 'Chicken Tikka Chunks', price: 80, dietary: Dietary.NON_VEG }
        ]
      }
    ];

    let addons: any[] = [];
    for (const addon of addonsToCreate) {
      // Use case-insensitive regex for Name to match the exact schema rules
      const existing = await AddonEntity.findOne({
        brandId,
        outletId,
        name: { $regex: new RegExp(`^${addon.name}$`, 'i') }
      });
      if (existing) {
        addons.push(existing);
      } else {
        addons.push(await AddonEntity.create(addon));
      }
    }
    console.log(`Ensured ${addons.length} Addons exist.`);

    // 3. Create Variations
    console.log('Creating Variations...');
    const variationsToCreate = [
      { brandId, outletId, name: 'Small', department: VariationDepartment.SIZE },
      { brandId, outletId, name: 'Medium', department: VariationDepartment.SIZE },
      { brandId, outletId, name: 'Large', department: VariationDepartment.SIZE },
      { brandId, outletId, name: 'Half', department: VariationDepartment.PORTION },
      { brandId, outletId, name: 'Full', department: VariationDepartment.PORTION }
    ];
    let variations: any[] = [];
    for (const v of variationsToCreate) {
      const existing = await VariationEntity.findOne({
        brandId,
        outletId,
        department: v.department,
        name: { $regex: new RegExp(`^${v.name}$`, 'i') }
      });
      if (existing) {
        variations.push(existing);
      } else {
        variations.push(await VariationEntity.create(v));
      }
    }
    console.log(`Ensured ${variations.length} Variations exist.`);

    // 4. Create Menu Items
    console.log('Creating Menu Items...');

    const itemNames = [
      // Starters
      { name: 'Paneer Tikka', categoryIndex: 0, dietary: Dietary.VEG, basePrice: 250 },
      { name: 'Chicken Malai Tikka', categoryIndex: 0, dietary: Dietary.NON_VEG, basePrice: 320 },
      { name: 'Hara Bhara Kebab', categoryIndex: 0, dietary: Dietary.VEG, basePrice: 220 },
      { name: 'Fish Tikka', categoryIndex: 0, dietary: Dietary.NON_VEG, basePrice: 400 },
      { name: 'Mutton Seekh Kebab', categoryIndex: 0, dietary: Dietary.NON_VEG, basePrice: 450 },
      { name: 'Chilli Chicken Dry', categoryIndex: 0, dietary: Dietary.NON_VEG, basePrice: 300 },
      { name: 'Crispy Corn', categoryIndex: 0, dietary: Dietary.VEG, basePrice: 180 },
      { name: 'Spring Rolls', categoryIndex: 0, dietary: Dietary.VEG, basePrice: 150 },
      { name: 'Tandoori Gobi', categoryIndex: 0, dietary: Dietary.VEG, basePrice: 200 },
      { name: 'Chicken 65', categoryIndex: 0, dietary: Dietary.NON_VEG, basePrice: 280 },

      // Main Course
      { name: 'Butter Chicken', categoryIndex: 1, dietary: Dietary.NON_VEG, basePrice: 380 },
      { name: 'Paneer Butter Masala', categoryIndex: 1, dietary: Dietary.VEG, basePrice: 320 },
      { name: 'Dal Makhani', categoryIndex: 1, dietary: Dietary.VEG, basePrice: 250 },
      { name: 'Kadai Paneer', categoryIndex: 1, dietary: Dietary.VEG, basePrice: 300 },
      { name: 'Chicken Tikka Masala', categoryIndex: 1, dietary: Dietary.NON_VEG, basePrice: 400 },
      { name: 'Mutton Rogan Josh', categoryIndex: 1, dietary: Dietary.NON_VEG, basePrice: 500 },
      { name: 'Palak Paneer', categoryIndex: 1, dietary: Dietary.VEG, basePrice: 280 },
      { name: 'Mix Veg Curry', categoryIndex: 1, dietary: Dietary.VEG, basePrice: 240 },
      { name: 'Egg Curry', categoryIndex: 1, dietary: Dietary.EGG, basePrice: 200 },
      { name: 'Fish Curry', categoryIndex: 1, dietary: Dietary.NON_VEG, basePrice: 450 },

      // Breads
      { name: 'Plain Naan', categoryIndex: 2, dietary: Dietary.VEG, basePrice: 40 },
      { name: 'Butter Naan', categoryIndex: 2, dietary: Dietary.VEG, basePrice: 50 },
      { name: 'Garlic Naan', categoryIndex: 2, dietary: Dietary.VEG, basePrice: 70 },
      { name: 'Tandoori Roti', categoryIndex: 2, dietary: Dietary.VEG, basePrice: 20 },
      { name: 'Butter Roti', categoryIndex: 2, dietary: Dietary.VEG, basePrice: 30 },
      { name: 'Lachha Paratha', categoryIndex: 2, dietary: Dietary.VEG, basePrice: 60 },
      { name: 'Pudina Paratha', categoryIndex: 2, dietary: Dietary.VEG, basePrice: 65 },
      { name: 'Aloo Stuffed Kulcha', categoryIndex: 2, dietary: Dietary.VEG, basePrice: 80 },
      { name: 'Paneer Kulcha', categoryIndex: 2, dietary: Dietary.VEG, basePrice: 100 },
      { name: 'Missi Roti', categoryIndex: 2, dietary: Dietary.VEG, basePrice: 45 },

      // Desserts
      { name: 'Gulab Jamun (2 pcs)', categoryIndex: 3, dietary: Dietary.VEG, basePrice: 100 },
      { name: 'Rasmalai (2 pcs)', categoryIndex: 3, dietary: Dietary.VEG, basePrice: 140 },
      { name: 'Gajar Ka Halwa', categoryIndex: 3, dietary: Dietary.VEG, basePrice: 150 },
      { name: 'Vanilla Ice Cream', categoryIndex: 3, dietary: Dietary.VEG, basePrice: 120 },
      {
        name: 'Chocolate Brownie with Ice Cream',
        categoryIndex: 3,
        dietary: Dietary.EGG,
        basePrice: 220
      },
      { name: 'Moong Dal Halwa', categoryIndex: 3, dietary: Dietary.VEG, basePrice: 160 },
      { name: 'Kheer', categoryIndex: 3, dietary: Dietary.VEG, basePrice: 130 },
      { name: 'Rabdi', categoryIndex: 3, dietary: Dietary.VEG, basePrice: 180 },
      { name: 'Fruit Salad', categoryIndex: 3, dietary: Dietary.VEG, basePrice: 140 },
      { name: 'Cheese Cake', categoryIndex: 3, dietary: Dietary.EGG, basePrice: 250 },

      // Beverages
      { name: 'Sweet Lassi', categoryIndex: 4, dietary: Dietary.VEG, basePrice: 90 },
      { name: 'Salted Lassi', categoryIndex: 4, dietary: Dietary.VEG, basePrice: 90 },
      { name: 'Virgin Mojito', categoryIndex: 4, dietary: Dietary.VEG, basePrice: 150 },
      { name: 'Fresh Lime Soda', categoryIndex: 4, dietary: Dietary.VEG, basePrice: 80 },
      { name: 'Cold Coffee', categoryIndex: 4, dietary: Dietary.VEG, basePrice: 160 },
      { name: 'Iced Tea', categoryIndex: 4, dietary: Dietary.VEG, basePrice: 140 },
      { name: 'Oreo Shake', categoryIndex: 4, dietary: Dietary.VEG, basePrice: 180 },
      { name: 'Masala Chai', categoryIndex: 4, dietary: Dietary.VEG, basePrice: 50 },
      { name: 'Filter Coffee', categoryIndex: 4, dietary: Dietary.VEG, basePrice: 70 },
      { name: 'Mango Smoothie', categoryIndex: 4, dietary: Dietary.VEG, basePrice: 200 }
    ];

    let createdCount = 0;

    for (let i = 0; i < itemNames.length; i++) {
      const itemDef = itemNames[i];
      const shortCode = `SITM${(i + 1).toString().padStart(3, '0')}`; // Seed ITM short code

      const existing = await MenuItemEntity.findOne({ brandId, outletId, name: itemDef.name });
      if (existing) {
        continue;
      }

      const menuItemData: any = {
        brandId,
        outletId,
        name: itemDef.name,
        shortCodes: [shortCode],
        categoryId: categories[itemDef.categoryIndex]._id,
        dietary: itemDef.dietary,
        basePrice: itemDef.basePrice,
        costPrice: Math.floor(itemDef.basePrice * 0.4), // arbitrary cost price
        online: true,
        takeAway: true,
        dineIn: true,
        isActive: true,
        isVariation: false
      };

      if (itemDef.categoryIndex === 1 || itemDef.categoryIndex === 4) {
        // Main course or beverages
        menuItemData.isVariation = true;
      }

      await MenuItemEntity.create(menuItemData);
      createdCount++;
    }

    console.log(`Successfully created ${createdCount} Menu Items!`);
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.readyState > 0 && (await mongoose.connection.close());
    console.log('Database connection closed.');
  }
}

seedData();
