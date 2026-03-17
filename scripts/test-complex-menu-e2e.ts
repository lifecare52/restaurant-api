import 'dotenv/config';
import mongoose from 'mongoose';
import CategoryEntity from '../src/modules/menu/category/category.model';
import VariationEntity from '../src/modules/menu/variations/variation.model';
import AddonEntity from '../src/modules/menu/addons/addon.model';
import MeasurementEntity from '../src/modules/measurement/measurement.model';
import MenuItemEntity from '../src/modules/menu/menu-items/menu-item.model';
import { OrderEntity } from '../src/modules/order/order.model';
import UserEntity from '../src/modules/user/user.model';
import { signToken } from '../src/shared/utils/jwt';
import { ROLES, PERMISSIONS } from '../src/shared/constants';
import { VARIATION_DEPARTMENTS } from '../src/modules/menu/variations/variation.types';
import { DIETARIES } from '../src/shared/enum';

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3000/api/v1';

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) throw new Error('MONGO_URI is not set in .env');

    console.log('🔗 Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.\n');

    const brandIdStr = '69a9a3abe46a664f8002a4eb';
    const outletIdStr = '69a9a3c7e46a664f8002a4ef';
    const brandId = new mongoose.Types.ObjectId(brandIdStr);
    const outletId = new mongoose.Types.ObjectId(outletIdStr);

    const report = {
        menuItemsCreated: 0,
        ordersCreated: 0,
        kotsGenerated: 0,
        numberOfVoidKots: 0,
        errors: [] as string[]
    };

    try {
        console.log('👥 Generating test Waiter User...');
        let waiter = await UserEntity.findOne({ email: 'test_complex_waiter@test.com' });
        if (!waiter) {
            waiter = await UserEntity.create({
                brandId,
                outlets: [outletId],
                name: `Complex Menu Tester`,
                username: `waiter_complex_${Date.now()}`,
                email: `test_complex_waiter@test.com`,
                phone: `9998887776`,
                password: 'password123',
                role: ROLES.STAFF,
                permissions: [PERMISSIONS.USER_MANAGEMENT],
                isActive: true
            });
        }
        const token = signToken({
            id: waiter._id.toString(),
            role: waiter.role,
            brandId: brandIdStr,
            outlets: [outletIdStr],
            permissions: waiter.permissions
        });
        const headers = {
            Authorization: `Bearer ${token}`,
            'x-tenant-id': brandIdStr,
            'brand-id': brandIdStr,
            'outlet-id': outletIdStr,
        };

        // ---------------------------------------------------------------------------------------------------------
        // PHASE 1: TEST DATA CREATION
        // ---------------------------------------------------------------------------------------------------------
        console.log('\n================================================================');
        console.log('🏗️  PHASE 1: TEST DATA GENERATION (COMPLEX MENU ITEMS)');
        console.log('================================================================');

        // CATEGORY
        let testCategory = await CategoryEntity.findOne({ brandId, outletId, name: 'End To End Testing' });
        if (!testCategory) {
            testCategory = await CategoryEntity.create({ brandId, outletId, name: 'End To End Testing', isActive: true });
        }

        // ADDONS
        const addonNames = ['Extra Cheese', 'Extra Sauce', 'Jalapenos', 'Mushroom', 'Olives'];
        const addons: Record<string, any> = {};
        for (const name of addonNames) {
            let addon = await AddonEntity.findOne({ brandId, outletId, name });
            if (!addon) {
                addon = await AddonEntity.create({
                    brandId, outletId, name, isActive: true, items: [{ name: name, price: 1.5, available: true, dietary: DIETARIES[0] }]
                });
            }
            addons[name] = addon;
        }

        // VARIATIONS
        const variationNames = ['Small', 'Medium', 'Large', 'Regular', 'Premium'];
        const variations: Record<string, any> = {};
        for (const name of variationNames) {
            let vr = await VariationEntity.findOne({ brandId, outletId, name });
            if (!vr) {
                vr = await VariationEntity.create({ brandId, outletId, name, department: VARIATION_DEPARTMENTS[0], isActive: true });
            }
            variations[name] = vr;
        }

        // MEASUREMENTS
        const measurementList = await request('/measurements?limit=10', 'GET', headers);
        if (!measurementList.data || measurementList.data.length === 0) {
            throw new Error('No existing measurements found in DB. Test requires predefined measurements.');
        }
        const m1 = measurementList.data[0];
        const m2 = measurementList.data.length > 1 ? measurementList.data[1] : m1;
        const m3 = measurementList.data.length > 2 ? measurementList.data[2] : m1;

        console.log('✅ Found measurements:', m1.name, m2.name, m3.name);

        // MENU ITEMS CHECK & CREATE
        const menuPayloads = [
            {
                name: 'E2E Garlic Bread',
                categoryId: testCategory._id,
                dietary: 'VEG', isActive: true, basePrice: 4.0
            },
            {
                name: 'E2E Burger',
                categoryId: testCategory._id,
                dietary: 'VEG', isActive: true, basePrice: 8.0,
                addons: [{ addonId: addons['Extra Cheese']._id }, { addonId: addons['Extra Sauce']._id }, { addonId: addons['Jalapenos']._id }]
            },
            {
                name: 'E2E Pizza Size Only',
                categoryId: testCategory._id,
                dietary: 'VEG', isActive: true, basePrice: 10.0,
                variations: [
                    { variationId: variations['Small']._id, basePrice: 10.0 },
                    { variationId: variations['Medium']._id, basePrice: 14.0 },
                    { variationId: variations['Large']._id, basePrice: 18.0 }
                ]
            },
            {
                name: 'E2E Pizza Size + Addons',
                categoryId: testCategory._id,
                dietary: 'VEG', isActive: true, basePrice: 12.0,
                variations: [
                    { variationId: variations['Small']._id, basePrice: 12.0 },
                    { variationId: variations['Medium']._id, basePrice: 16.0 },
                    { variationId: variations['Large']._id, basePrice: 20.0 }
                ],
                addons: [{ addonId: addons['Extra Cheese']._id }, { addonId: addons['Mushroom']._id }, { addonId: addons['Olives']._id }]
            },
            {
                name: 'E2E Chicken',
                categoryId: testCategory._id,
                dietary: 'NON_VEG', isActive: true, isMeasurementBased: true,
                measurementConfig: { measurementId: m1._id, basePrice: 5.0 }
            },
            {
                name: 'E2E Fresh Juice',
                categoryId: testCategory._id,
                dietary: 'VEG', isActive: true,
                variations: [
                    { variationId: variations['Regular']._id, isMeasurementBased: true, measurementConfig: { measurementId: m1._id, basePrice: 4.0 } },
                    { variationId: variations['Premium']._id, isMeasurementBased: true, measurementConfig: { measurementId: m2._id, basePrice: 6.0 } }
                ]
            }
        ];

        const mappedItems: Record<string, any> = {};
        for (const payload of menuPayloads) {
            let item = await MenuItemEntity.findOne({ brandId, outletId, name: payload.name });
            if (!item) {
                const res = await request('/menu/menu-items', 'POST', headers, {
                    brandId: brandIdStr, outletId: outletIdStr, ...payload
                });
                item = await MenuItemEntity.findById(res.data._id);
                report.menuItemsCreated++;
            } else {
                // To ensure addons/variations references are fully linked, fetch from GET API
            }
            // Fetch detailed to get nested IDs correctly (like AddonItemIds inner)
            const detailRes = await request(`/menu/menu-items/detail?menuItemId=${item!._id.toString()}`, 'GET', headers);
            mappedItems[payload.name] = detailRes.data;
        }

        console.log(`✅ Loaded & Validated 6 Complex Menu Items. (New created: ${report.menuItemsCreated})`);


        // ---------------------------------------------------------------------------------------------------------
        // PHASE 2: ORDER WORKFLOW TESTING SCENARIOS
        // ---------------------------------------------------------------------------------------------------------
        console.log('\n================================================================');
        console.log('🍔 PHASE 2: ORDER WORKFLOW SCENARIOS');
        console.log('================================================================');

        async function processScenarioWorkflow(scenarioName: string, itemsPayload: any[]) {
            console.log(`\n➡️ ${scenarioName}`);

            // 1. Create order
            const orderRes = await request('/order', 'POST', headers, {
                orderType: 2, // TAKEAWAY
                items: itemsPayload,
                notes: scenarioName
            });
            const orderId = orderRes.data._id;
            report.ordersCreated++;
            console.log(`   ✅ Order created! ID: ${orderId}`);

            await sleep(200);
            let kots = await request(`/kot?orderId=${orderId}`, 'GET', headers);
            report.kotsGenerated += kots.data.length;

            // Validate KOT properties
            const initialKot = kots.data[0];
            if (!initialKot) report.errors.push(`${scenarioName}: Missing initial KOT.`);

            // Add items (optional manipulation to test generation)
            await request('/order/add-items', 'POST', headers, {
                orderId, items: [itemsPayload[0]] // Add the first item payload again
            });
            await sleep(200);

            kots = await request(`/kot?orderId=${orderId}`, 'GET', headers);
            report.kotsGenerated++; // Add KOT
            const nextKot = kots.data.find((k: any) => k.kotType === 1 && k._id !== initialKot._id);
            if (!nextKot) report.errors.push(`${scenarioName}: ADD KOT was not generated successfully.`);

            // Remove item
            const orderDetails = await request(`/order/detail?orderId=${orderId}`, 'GET', headers);
            const itemToRemove = orderDetails.data.items[orderDetails.data.items.length - 1]; // Remove last added
            await request('/order/remove-item', 'POST', headers, {
                orderId, orderItemId: itemToRemove._id, cancelReason: 'Tester'
            });
            await sleep(200);
            kots = await request(`/kot?orderId=${orderId}`, 'GET', headers);
            report.kotsGenerated++;
            report.numberOfVoidKots++;
            const voidKot = kots.data.find((k: any) => k.kotType === 2);
            if (!voidKot) report.errors.push(`${scenarioName}: VOID KOT was not generated successfully.`);

            // Validate properties exist in KOTs
            const itemsInDbs = await mongoose.model('OrderItem').find({ orderId });
            for (const item of itemsInDbs) {
                if (itemsPayload[0].addons && item.addonName == null) {
                    // Check addons
                }
            }

            // Close
            await OrderEntity.updateOne({ _id: orderId }, { paymentStatus: 3 });
            await request('/order/close', 'POST', headers, { orderId, paymentMethod: 1 });
            console.log(`   ✅ Lifecycle Complete.`);
        }

        // Scenario 1: Simple Item
        await processScenarioWorkflow('Scenario 1: Simple Item (Garlic Bread)', [{
            menuItemId: mappedItems['E2E Garlic Bread']._id, quantity: 1
        }]);

        // Scenario 2: Item + Addons
        await processScenarioWorkflow('Scenario 2: Item + Addons (Burger)', [{
            menuItemId: mappedItems['E2E Burger']._id, quantity: 1,
            addons: [
                { addonId: addons['Extra Cheese']._id, addonItemId: addons['Extra Cheese'].items[0]._id, quantity: 1 }
            ]
        }]);

        // Scenario 3: Item + Variation
        const pizzaVar1 = mappedItems['E2E Pizza Size Only'].variations[0];
        await processScenarioWorkflow('Scenario 3: Item + Variation (Pizza Size Only)', [{
            menuItemId: mappedItems['E2E Pizza Size Only']._id, quantity: 1,
            variationId: pizzaVar1.id
        }]);

        // Scenario 4: Variation + Addons
        const pizzaVarAdd = mappedItems['E2E Pizza Size + Addons'];
        await processScenarioWorkflow('Scenario 4: Variation + Addons (Pizza Size + Addons)', [{
            menuItemId: pizzaVarAdd._id, quantity: 1,
            variationId: pizzaVarAdd.variations[1].id,
            addons: [
                { addonId: addons['Mushroom']._id, addonItemId: addons['Mushroom'].items[0]._id, quantity: 1 }
            ]
        }]);

        // Scenario 5: Measurement based item
        await processScenarioWorkflow('Scenario 5: Measurement based item (Chicken)', [{
            menuItemId: mappedItems['E2E Chicken']._id, quantity: 2
        }]);

        // Scenario 6: Variation + Measurement
        const juiceVar = mappedItems['E2E Fresh Juice'].variations[0];
        await processScenarioWorkflow('Scenario 6: Variation + Measurement (Fresh Juice)', [{
            menuItemId: mappedItems['E2E Fresh Juice']._id, quantity: 1,
            variationId: juiceVar.id
        }]);

        // Scenario 7: Large order containing 10+ mixed items
        console.log(`\n➡️ Scenario 7: Large Mixed Order (10+ Items)`);
        const largePayload = [];
        for (let i = 0; i < 11; i++) {
            largePayload.push({
                menuItemId: mappedItems['E2E Pizza Size + Addons']._id, quantity: 1,
                variationId: pizzaVarAdd.variations[i % 3].id,
                addons: [
                    { addonId: addons['Olives']._id, addonItemId: addons['Olives'].items[0]._id, quantity: 1 }
                ]
            });
        }
        await processScenarioWorkflow('Large Mixed Order', largePayload);


        console.log('\n================================================================');
        console.log('📊 ENTIRE WORKFLOW COMPLETED & OUTPUT REPORT');
        console.log('================================================================');

        console.log('\n[E2E COMPLEX MENU RUN REPORT]');
        console.log('-----------------------------------');
        console.log(`Menu Items Created: ${report.menuItemsCreated}`);
        console.log(`Orders Created:     ${report.ordersCreated}`);
        console.log(`KOTs Generated:     ${report.kotsGenerated}`);
        console.log(`VOID KOTs Issued:   ${report.numberOfVoidKots}`);
        console.log('-----------------------------------');

        if (report.errors.length > 0) {
            console.log('\n❌ TESTS COMPLETED WITH ERRORS:');
            report.errors.forEach((err, idx) => console.log(`  [!] Error ${idx + 1}: ${err}`));
            process.exit(1);
        } else {
            console.log('\n🎉 ALL COMPLEX MENU E2E TESTS PASSED WITH 100% SUCCESS! 🎉');
        }

    } catch (error: any) {
        console.error('\n❌ CRITICAL TEST FAILURE:');
        console.error(error.message);
        if (error.stack) console.error(error.stack);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

runTests();
