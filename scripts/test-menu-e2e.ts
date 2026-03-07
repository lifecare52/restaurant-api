import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Import necessary models / utils to seed prerequisites and auth
import BrandEntity from '../src/modules/brand/brand.model';
import OutletEntity from '../src/modules/outlet/outlet.model';
import CategoryEntity from '../src/modules/menu/category/category.model';
import VariationEntity from '../src/modules/menu/variations/variation.model';
import AddonEntity from '../src/modules/menu/addons/addon.model';
import MeasurementEntity from '../src/modules/measurement/measurement.model';
import { signToken } from '../src/shared/utils/jwt';
import { ROLES, PERMISSIONS } from '../src/shared/constants';
import { createApp } from '../src/app';

let API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3000/api/v1';

// We'll write a helper to make HTTP requests
async function request(endpoint: string, method: string, headers: any, body?: any) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const responseText = await response.text();
    let json;
    try {
        json = JSON.parse(responseText);
    } catch (e) {
        throw new Error(`Non-JSON response from ${method} ${url}: status=${response.status} body=${responseText}`);
    }

    if (!response.ok) {
        throw new Error(`API Error ${response.status} on ${method} ${url}: ${JSON.stringify(json)}`);
    }
    return json;
}

async function runTests() {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) throw new Error('MONGO_URI is not set in .env');

    console.log('🔗 Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.');

    try {
        // ----------------------------------------------------------------------
        // 1. SETUP PREREQUISITES IN DB
        // ----------------------------------------------------------------------
        console.log('🛠️ Setting up test prerequisites in DB using provided credentials...');

        const brandId = '69a9a3abe46a664f8002a4eb';
        const outletId = '69a9a3c7e46a664f8002a4ef';
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YTlhODIxZTQ2YTY2NGY4MDAyYTRmNyIsInJvbGUiOiJPV05FUiIsImJyYW5kSWQiOiI2OWE5YTNhYmU0NmE2NjRmODAwMmE0ZWIiLCJvdXRsZXRzIjpbIjY5YTlhM2M3ZTQ2YTY2NGY4MDAyYTRlZiJdLCJwZXJtaXNzaW9ucyI6WyJVU0VSX01BTkFHRU1FTlQiLCJCUkFORF9NQU5BR0VNRU5UIiwiT1VUTEVUX01BTkFHRU1FTlQiXSwiaWF0IjoxNzcyNzI2Mzk2LCJleHAiOjE3NzMzMzExOTZ9.VOlumiPiPvqi27qifWNxJoNP9yGQ1n8hBnrgMFiTcNM';

        const headers = {
            Authorization: `Bearer ${token}`,
            'x-tenant-id': brandId,
            'brand-id': brandId,
            'outlet-id': outletId,
        };

        // Create Category
        const category = await CategoryEntity.create({
            brandId,
            outletId,
            name: `Test Category ${Date.now()}`,
            isActive: true,
            isDelete: false,
        });
        const categoryId = category._id.toString();

        // Create Addon Master
        const addonMaster = await AddonEntity.create({
            brandId,
            outletId,
            name: `Extra Cheese ${Date.now()}`,
            price: 2.0,
            active: true,
            isDelete: false,
        });

        // Create Variation Master
        const variationMaster = await VariationEntity.create({
            brandId,
            outletId,
            name: `Crust Type ${Date.now()}`,
            department: 'STYLE',
            active: true,
            isDelete: false,
        });

        // Create Measurement Master
        const measurementMaster = await MeasurementEntity.create({
            brandId,
            outletId,
            name: `Volume ${Date.now()}`,
            code: `VOL${Date.now()}`,
            unit: 'ml',
            measurementType: 'VOLUME',
            baseUnit: 'ml',
            isActive: true,
            isDelete: false,
        });

        console.log('✅ Prerequisites setup complete.\n');

        // ----------------------------------------------------------------------
        // 2. TEST SCENARIOS
        // ----------------------------------------------------------------------

        let createdMenuItemId = '';

        // Scenario 1: Simple Menu Item (No variations, addons, measurements)
        console.log('➡️ Scenario 1: Creating Simple Menu Item');
        const simpleRes = await request('/menu/menu-items', 'POST', headers, {
            brandId, outletId, categoryId,
            name: 'Simple Coffee',
            dietary: 'VEG',
            isActive: true,
            basePrice: 5.0,
        });
        createdMenuItemId = simpleRes.data._id;
        console.log('✅ Scenario 1 Passed.');

        // Scenario 2: Variations Only
        console.log('➡️ Scenario 2: Creating Menu Item with Variations');
        await request('/menu/menu-items', 'POST', headers, {
            brandId, outletId, categoryId,
            name: 'Pizza with Variations',
            dietary: 'VEG',
            isActive: true,
            basePrice: 10.0,
            variations: [
                {
                    variationId: variationMaster._id.toString(),
                    basePrice: 10.0,
                }
            ]
        });
        console.log('✅ Scenario 2 Passed.');

        // Scenario 3: Addons Only
        console.log('➡️ Scenario 3: Creating Menu Item with Addons');
        await request('/menu/menu-items', 'POST', headers, {
            brandId, outletId, categoryId,
            name: 'Burger with Addons',
            dietary: 'VEG',
            isActive: true,
            basePrice: 8.0,
            addons: [
                {
                    addonId: addonMaster._id.toString(),
                }
            ]
        });
        console.log('✅ Scenario 3 Passed.');

        // Scenario 4: Measurements Only
        console.log('➡️ Scenario 4: Creating Menu Item with Measurements');
        await request('/menu/menu-items', 'POST', headers, {
            brandId, outletId, categoryId,
            name: 'Beer with Measurements',
            dietary: 'VEG',
            isActive: true,
            isMeasurementBased: true,
            measurementConfig: {
                measurementId: measurementMaster._id.toString(),
                basePrice: 5.0,
            }
        });
        console.log('✅ Scenario 4 Passed.');

        // Scenario 5: Variations + Addons
        console.log('➡️ Scenario 5: Creating Menu Item with Variations and Addons');
        await request('/menu/menu-items', 'POST', headers, {
            brandId, outletId, categoryId,
            name: 'Pizza with Variations and Addons',
            dietary: 'VEG',
            isActive: true,
            basePrice: 10.0,
            variations: [
                {
                    variationId: variationMaster._id.toString(),
                    basePrice: 10.0,
                }
            ],
            addons: [
                {
                    addonId: addonMaster._id.toString(),
                }
            ]
        });
        console.log('✅ Scenario 5 Passed.');

        // Scenario 6: Variations + Measurements
        console.log('➡️ Scenario 6: Creating Menu Item with Variations and Measurements');
        await request('/menu/menu-items', 'POST', headers, {
            brandId, outletId, categoryId,
            name: 'Drink with Variations and Measurements',
            dietary: 'VEG',
            isActive: true,
            basePrice: 5.0,
            variations: [
                {
                    variationId: variationMaster._id.toString(),
                    isMeasurementBased: true,
                    measurementConfig: {
                        measurementId: measurementMaster._id.toString(),
                        basePrice: 5.0,
                    }
                }
            ]
        });
        console.log('✅ Scenario 6 Passed.');

        // ----------------------------------------------------------------------
        // 3. TEST CRUD OPERATIONS (UPDATE, LIST, DELETE)
        // ----------------------------------------------------------------------

        console.log('➡️ Updating Menu Item (Simple Coffee)');
        await request(`/menu/menu-items?menuItemId=${createdMenuItemId}`, 'PATCH', headers, {
            name: 'Updated Simple Coffee',
            basePrice: 6.0,
        });
        console.log('✅ Update Passed.');

        console.log('➡️ Listing Menu Items');
        const listRes = await request(`/menu/menu-items?page=1&limit=10`, 'GET', headers);
        if (!Array.isArray(listRes.data)) throw new Error('List failed');
        console.log('✅ List Passed.');

        console.log('➡️ Deleting Menu Item');
        await request(`/menu/menu-items?menuItemId=${createdMenuItemId}`, 'DELETE', headers);
        console.log('✅ Delete Passed.');

        console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
    } catch (error: any) {
        console.error('\n❌ TEST FAILED:');
        console.error(error.message);
        if (error.stack) console.error(error.stack);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

runTests();
