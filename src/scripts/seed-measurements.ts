import 'dotenv/config'; // Make sure process.env contains MONGO_URI and others
import mongoose from 'mongoose';
import { Types } from 'mongoose';

// Models
import MeasurementEntity from '../modules/measurement/measurement.model';
import CategoryEntity from '../modules/menu/category/category.model';
import VariationEntity from '../modules/menu/variations/variation.model';
import MenuItemEntity from '../modules/menu/menu-items/menu-item.model';
import MenuItemVariantEntity from '../modules/menu/menu-item-variants/menu-item-variant.model';

import { VariationDepartment } from '../modules/menu/variations/variation.types';
import { Dietary } from '../shared/enum';

// Basic constants based on earlier context
const brandId = new Types.ObjectId('69a9a3abe46a664f8002a4eb');
const outletId = new Types.ObjectId('69a9a3c7e46a664f8002a4ef');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant';

async function seedMeasurements() {
    try {
        console.log(`Connecting to database at ${MONGO_URI}...`);
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully!');

        // 1. Fetch Existing Measurements or Seed Defaults
        console.log('Fetching/Creating Measurements...');
        let measurements = await MeasurementEntity.find({ isActive: true, isDelete: false });

        if (measurements.length === 0) {
            console.log('No measurements found. Seeding default measurements...');
            const defaultMeasurements = [
                { name: 'Weight in Kg', measurementType: 'WEIGHT' as const, unit: 'kg', baseUnit: 'g', conversionFactor: 1000, isDecimalAllowed: true },
                { name: 'Volume in Liters', measurementType: 'VOLUME' as const, unit: 'L', baseUnit: 'ml', conversionFactor: 1000, isDecimalAllowed: true },
                { name: 'Quantity in Pcs', measurementType: 'QUANTITY' as const, unit: 'pc', baseUnit: 'pc', conversionFactor: 1, isDecimalAllowed: false },
                { name: 'Custom Box', measurementType: 'CUSTOM' as const, unit: 'box', baseUnit: 'box', conversionFactor: 1, isDecimalAllowed: false },
            ];
            measurements = await MeasurementEntity.insertMany(defaultMeasurements);
        }
        console.log(`Found ${measurements.length} measurements to use.`);

        // 2. Create Category
        console.log('Ensuring Special Category exists...');
        const catName = 'Measurement Items';
        let category = await CategoryEntity.findOne({ brandId, outletId, name: catName });
        if (!category) {
            category = await CategoryEntity.create({ brandId, outletId, name: catName });
        }

        // 3. Create a Variation set for the measurement items (e.g. Regular vs Premium qualities)
        console.log('Ensuring Variations exist...');
        const varNames = ['Regular', 'Premium', 'Organic'];
        const variations: Types.ObjectId[] = [];
        for (const vName of varNames) {
            const existing = await VariationEntity.findOne({ brandId, outletId, department: VariationDepartment.CUSTOM, name: { $regex: new RegExp(`^${vName}$`, 'i') } });
            if (existing) {
                variations.push(existing._id as Types.ObjectId);
            } else {
                const created = await VariationEntity.create({ brandId, outletId, name: vName, department: VariationDepartment.CUSTOM });
                variations.push(created._id as Types.ObjectId);
            }
        }

        // 4. Create Menu Items covering all of the Measurements
        console.log('Creating Measurement-based Menu Items...');
        let createdCount = 0;

        for (let i = 0; i < measurements.length; i++) {
            const meas = measurements[i];

            // Let's create two items per measurement constraint
            const itemDefs = [
                {
                    name: `Realistic Item 1 for ${meas.name}`,
                    basePrice: 150 + Math.floor(Math.random() * 100),
                    baseValue: 1, // Start with 1 unit
                    minValue: meas.isDecimalAllowed ? 0.5 : 1, // If decimal allowed, 0.5 kg etc.
                    maxValue: 10,
                    stepValue: meas.isDecimalAllowed ? 0.25 : 1, // Can jump by 250g or 1 pc
                },
                {
                    name: `Realistic Item 2 for ${meas.name}`,
                    basePrice: 200 + Math.floor(Math.random() * 200),
                    baseValue: 2,
                    minValue: 1,
                    maxValue: 20,
                    stepValue: meas.isDecimalAllowed ? 0.5 : 1,
                }
            ];

            for (let j = 0; j < itemDefs.length; j++) {
                const def = itemDefs[j];
                const shortCode = `SMEAS${i}${j}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

                let existing = await MenuItemEntity.findOne({ brandId, outletId, name: def.name });
                if (!existing) {
                    const menuItemData = {
                        brandId,
                        outletId,
                        name: def.name,
                        shortCodes: [shortCode],
                        categoryId: category._id,
                        dietary: Dietary.VEG, // defaulting to veg
                        basePrice: null, // As per standard design, measurement price uses measurementConfig
                        costPrice: 0,

                        isMeasurementBased: true,
                        measurementConfig: {
                            measurementId: meas._id,
                            basePrice: def.basePrice,
                            costPrice: Math.floor(def.basePrice * 0.4),
                            baseValue: def.baseValue,
                            minValue: def.minValue,
                            maxValue: def.maxValue,
                            stepValue: def.stepValue,
                        },

                        online: true,
                        takeAway: true,
                        dineIn: true,
                        isActive: true,
                        isVariation: true, // Mark it as having variations
                    };

                    existing = await MenuItemEntity.create(menuItemData);
                    createdCount++;
                }

                // For each variation, ensure we have a measurement variant mapped to it!
                for (let v = 0; v < variations.length; v++) {
                    const variationId = variations[v];
                    const multiplier = v === 0 ? 1 : v === 1 ? 1.5 : 2; // e.g. Premium is 1.5x, Organic is 2x price

                    const existingVariant = await MenuItemVariantEntity.findOne({ brandId, outletId, menuItemId: existing._id, variationId });
                    if (!existingVariant) {
                        await MenuItemVariantEntity.create({
                            brandId,
                            outletId,
                            menuItemId: existing._id,
                            variationId: variationId,
                            basePrice: null, // As measurement based, we define the measurement Config
                            costPrice: 0,
                            isMeasurementBased: true,
                            measurementConfig: {
                                measurementId: meas._id,
                                basePrice: Math.floor(def.basePrice * multiplier),
                                costPrice: Math.floor(def.basePrice * 0.4 * multiplier),
                                baseValue: def.baseValue,
                                minValue: def.minValue,
                                maxValue: def.maxValue,
                                stepValue: def.stepValue,
                            },
                            isActive: true,
                            isDefault: v === 0, // Make the first one default
                        });
                    }
                }
            }
        }

        console.log(`Successfully created/updated ${createdCount} Measurement-based Menu Items with full Variant coverage!`);

    } catch (err) {
        console.error('Error seeding measurement data:', err);
    } finally {
        mongoose.connection.readyState > 0 && await mongoose.connection.close();
        console.log('Database connection closed.');
    }
}

seedMeasurements();
