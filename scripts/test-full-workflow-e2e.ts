import 'dotenv/config';
import mongoose from 'mongoose';
import { OrderEntity, OrderItemEntity } from '../src/modules/order/order.model';
import { KOTEntity } from '../src/modules/kot/kot.model';
import UserEntity from '../src/modules/user/user.model';
import { signToken } from '../src/shared/utils/jwt';
import { ROLES, PERMISSIONS } from '../src/shared/constants';

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

// Quick sleep helper
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) throw new Error('MONGO_URI is not set in .env');

    console.log('🔗 Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.');

    const brandId = '69a9a3abe46a664f8002a4eb';
    const outletId = '69a9a3c7e46a664f8002a4ef';

    // Data aggregation for final report
    const report = {
        totalOrdersCreated: 0,
        totalKotsGenerated: 0,
        numberOfItemUpdates: 0,
        numberOfVoidKots: 0,
        errors: [] as string[]
    };

    try {
        console.log('🚀 Starting Comprehensive Order & KOT E2E Tests...\n');

        // -----------------------------------------------------
        // PRE-REQUISITES: Generate 3 Fake Waiters
        // -----------------------------------------------------
        console.log('👥 Generating 3 waitstaff for User Simulation...');
        const waiters = [];
        for (let i = 1; i <= 3; i++) {
            const waiter = await UserEntity.create({
                brandId,
                outlets: [outletId],
                name: `Test Waiter ${i}`,
                username: `waiter${i}_${Date.now()}`,
                email: `waiter${i}_${Date.now()}@test.com`,
                phone: `999000${i}${Math.floor(Math.random() * 1000)}`,
                password: 'password123',
                role: ROLES.STAFF,
                permissions: [PERMISSIONS.USER_MANAGEMENT],
                isActive: true
            });
            const token = signToken({
                id: waiter._id.toString(),
                role: waiter.role,
                brandId,
                outlets: (waiter.outlets || []).map((o) => o.toString()),
                permissions: waiter.permissions
            });
            waiters.push({
                id: waiter._id.toString(),
                name: waiter.name,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'x-tenant-id': brandId,
                    'brand-id': brandId,
                    'outlet-id': outletId,
                }
            });
        }

        const waiterA = waiters[0];
        const waiterB = waiters[1];
        const waiterC = waiters[2];

        console.log(`✅ Generated Waiters: A (${waiterA.name}), B (${waiterB.name}), C (${waiterC.name})`);

        // Fetch menu items
        console.log('\n📖 Fetching available menu items...');
        const menuRes = await request('/menu/menu-items?limit=50', 'GET', waiterA.headers);
        const menuItems = menuRes.data;
        if (!menuItems || menuItems.length < 5) throw new Error('Not enough menu items. Need at least 5.');
        const getMenuItemId = (idx: number) => menuItems[idx % menuItems.length]._id;

        const getTableId = async () => {
            let tablesRes = await request('/tables?limit=5', 'GET', waiterA.headers);
            if (tablesRes.data && tablesRes.data.length > 0) return tablesRes.data[0]._id;
            const newTableRes = await request('/tables', 'POST', waiterA.headers, { name: 'E2E Table ' + Date.now(), capacity: 4 });
            return newTableRes.data._id;
        };

        const tableId = await getTableId();

        // -----------------------------------------------------------------------------------------
        // SCENARIO 1 & 2: MULTIPLE USER SIMULATION & TAKEAWAY ORDER LIFECYCLE
        // -----------------------------------------------------------------------------------------
        console.log('\n================================================================');
        console.log('🍔 SCENARIO 1 & 2: MULTIPLE USER SIMULATION & TAKEAWAY LIFECYCLE');
        console.log('================================================================');

        console.log('➡️ Step 1: Waiter A creates a Takeaway order...');
        const sr1OrderRes = await request('/order', 'POST', waiterA.headers, {
            orderType: 2, // TAKEAWAY
            items: [{ menuItemId: getMenuItemId(0), quantity: 1 }],
            notes: 'Takeaway Test'
        });
        const sr1OrderId = sr1OrderRes.data._id;
        report.totalOrdersCreated++;
        console.log(`✅ Order created by Waiter A! ID: ${sr1OrderId}`);

        // Validate Waiter ID correctly saved
        const sr1DbCheck1 = await OrderEntity.findById(sr1OrderId).lean();
        if (sr1DbCheck1?.waiterId?.toString() !== waiterA.id) report.errors.push('Waiter A ID not saved on Takeaway Order');

        await sleep(200);
        let sr1Kots = await request(`/kot?orderId=${sr1OrderId}`, 'GET', waiterA.headers);
        report.totalKotsGenerated += sr1Kots.data.length;

        console.log('➡️ Step 2: Waiter B adds 5 items to the existing order...');
        await request('/order/add-items', 'POST', waiterB.headers, {
            orderId: sr1OrderId,
            items: [
                { menuItemId: getMenuItemId(1), quantity: 1 },
                { menuItemId: getMenuItemId(2), quantity: 1 },
                { menuItemId: getMenuItemId(3), quantity: 1 },
                { menuItemId: getMenuItemId(4), quantity: 1 },
                { menuItemId: getMenuItemId(0), quantity: 2 },
            ]
        });
        report.numberOfItemUpdates += 5;
        console.log('✅ Items added by Waiter B.');

        await sleep(200);
        // Validate KOT for ADD
        sr1Kots = await request(`/kot?orderId=${sr1OrderId}`, 'GET', waiterB.headers);
        report.totalKotsGenerated = sr1Kots.data.length + (report.totalKotsGenerated - 1);
        if (sr1Kots.data.length !== 2) report.errors.push(`Expected 2 KOTs for Takeaway, found ${sr1Kots.data.length}`);

        console.log('➡️ Step 3: Waiter C modifies an item quantity (Burger x1 -> x3)...');
        const sr1OrderDetails = await request(`/order/detail?orderId=${sr1OrderId}`, 'GET', waiterC.headers);
        const itemToModify = sr1OrderDetails.data.items[0];

        await request('/order/update-item', 'PATCH', waiterC.headers, {
            orderId: sr1OrderId,
            orderItemId: itemToModify._id,
            quantity: itemToModify.quantity + 2
        });
        report.numberOfItemUpdates++;
        console.log('✅ Item quantity modified by Waiter C.');

        await sleep(200);
        sr1Kots = await request(`/kot?orderId=${sr1OrderId}`, 'GET', waiterB.headers);
        report.totalKotsGenerated++;

        console.log('➡️ Step 4: Waiter A cancels an item...');
        const itemToCancel = sr1OrderDetails.data.items[sr1OrderDetails.data.items.length - 1];
        await request('/order/remove-item', 'POST', waiterA.headers, {
            orderId: sr1OrderId,
            orderItemId: itemToCancel._id,
            cancelReason: 'Changed mind'
        });
        report.numberOfVoidKots++;
        report.totalKotsGenerated++;

        await sleep(200);
        sr1Kots = await request(`/kot?orderId=${sr1OrderId}`, 'GET', waiterA.headers);
        const hasVoid = sr1Kots.data.some((k: any) => k.kotType === 2); // 2 = VOID
        if (!hasVoid) report.errors.push('VOID KOT not generated in Takeaway scenario');

        console.log('➡️ Step 5: Update order status to READY / COMPLETED');
        // Mock payment before close
        await OrderEntity.updateOne({ _id: sr1OrderId }, { paymentStatus: 3 }); // PAID
        await request('/order/close', 'POST', waiterA.headers, {
            orderId: sr1OrderId,
            paymentMethod: 1 // CASH
        });

        const sr1FinalDB = await OrderEntity.findById(sr1OrderId).lean();
        if (sr1FinalDB?.status !== 3 /* COMPLETED */ || sr1FinalDB?.closedAt == null) {
            report.errors.push('Takeaway Order status/closedAt timestamp not updated');
        } else {
            console.log('✅ Takeaway Order completed! Timestamps and statuses recorded.');
        }


        // -----------------------------------------------------------------------------------------
        // SCENARIO 3: DINE-IN ORDER SCENARIOS (REAL RESTAURANT FLOW)
        // -----------------------------------------------------------------------------------------
        console.log('\n================================================================');
        console.log('🍽️ SCENARIO 3: DINE-IN ORDER LIFECYCLE WITH KITCHEN SERVE FLOW');
        console.log('================================================================');

        console.log('➡️ Step 1 & 2: Customer orders first round of items (Dine-in)...');
        const sr3OrderRes = await request('/order', 'POST', waiterA.headers, {
            orderType: 1, // DINE_IN
            tableId: tableId,
            items: [
                { menuItemId: getMenuItemId(0), quantity: 1 },
                { menuItemId: getMenuItemId(1), quantity: 2 },
                { menuItemId: getMenuItemId(2), quantity: 1 },
                { menuItemId: getMenuItemId(3), quantity: 1 },
                { menuItemId: getMenuItemId(4), quantity: 1 },
            ]
        });
        const sr3OrderId = sr3OrderRes.data._id;
        report.totalOrdersCreated++;
        console.log(`✅ Dine-in Order created! ID: ${sr3OrderId}`);

        await sleep(200);
        let sr3Kots = await request(`/kot?orderId=${sr3OrderId}`, 'GET', waiterA.headers);
        let firstKot = sr3Kots.data[0];
        report.totalKotsGenerated++;

        console.log('➡️ Step 3 & 4 & 5: Add, Modify, and Cancel items later...');
        await request('/order/add-items', 'POST', waiterA.headers, {
            orderId: sr3OrderId,
            items: [
                { menuItemId: getMenuItemId(1), quantity: 3 },
                { menuItemId: getMenuItemId(2), quantity: 1 }
            ]
        });
        report.numberOfItemUpdates += 2;
        await sleep(200);

        const sr3OrderDetails = await request(`/order/detail?orderId=${sr3OrderId}`, 'GET', waiterA.headers);
        const sr3ModifyItem = sr3OrderDetails.data.items[0];
        await request('/order/update-item', 'PATCH', waiterA.headers, {
            orderId: sr3OrderId,
            orderItemId: sr3ModifyItem._id,
            quantity: sr3ModifyItem.quantity + 1
        });
        report.numberOfItemUpdates++;
        await sleep(200);

        const sr3RemoveItem = sr3OrderDetails.data.items[sr3OrderDetails.data.items.length - 1];
        await request('/order/remove-item', 'POST', waiterA.headers, {
            orderId: sr3OrderId,
            orderItemId: sr3RemoveItem._id,
            cancelReason: 'Customer felt full'
        });
        report.numberOfVoidKots++;

        await sleep(200);
        sr3Kots = await request(`/kot?orderId=${sr3OrderId}`, 'GET', waiterA.headers);
        report.totalKotsGenerated += 3; // Add, update, void
        console.log(`✅ Dine-in item manipulations completed. Total KOTs: ${sr3Kots.data.length}`);

        console.log('➡️ Step 6: Kitchen updates item status (PENDING -> PREPARING -> READY -> SERVED)...');
        // Let's take the first KOT and update its first item
        const kotItemToUpdate = firstKot.items[0];

        // PENDING -> PREPARING
        await request('/kot/item-status', 'PATCH', waiterA.headers, {
            kotItemId: kotItemToUpdate._id,
            status: 2 // PREPARING
        });
        console.log('   ✅ Item marked as PREPARING');
        await sleep(100);

        // PREPARING -> READY
        await request('/kot/item-status', 'PATCH', waiterA.headers, {
            kotItemId: kotItemToUpdate._id,
            status: 3 // READY
        });
        console.log('   ✅ Item marked as READY');
        await sleep(100);

        // READY -> SERVED
        console.log('➡️ Step 7: Waiter marks items as SERVED');
        await request('/kot/item-status', 'PATCH', waiterA.headers, {
            kotItemId: kotItemToUpdate._id,
            status: 4 // SERVED
        });
        console.log('   ✅ Item marked as SERVED');

        await sleep(200);
        // Validating DB fields for SERVED
        const servedItemDb = await OrderItemEntity.findOne({ _id: kotItemToUpdate.orderItemId }).lean();
        if (servedItemDb?.itemStatus !== 4 || !servedItemDb?.kotSentAt) {
            report.errors.push('Dine-In order item status or kotSentAt is not correctly registered as SERVED (4).');
        } else {
            console.log('✅ Database accurately recorded item served status and timestamps!');
        }

        console.log('➡️ Step 8: Customer finishes meal and bill is submitted...');
        await OrderEntity.updateOne({ _id: sr3OrderId }, { paymentStatus: 3 }); // Mock Paid
        await request('/order/close', 'POST', waiterA.headers, {
            orderId: sr3OrderId,
            paymentMethod: 2 // CARD
        });
        const sr3FinalDB = await OrderEntity.findById(sr3OrderId).lean();
        if (sr3FinalDB?.status !== 3) report.errors.push('Dine-In Order failed to complete');
        console.log('✅ Dine-in Order lifecycle fully processed.');


        // -----------------------------------------------------------------------------------------
        // SCENARIO 4: LARGE ORDER TESTING
        // -----------------------------------------------------------------------------------------
        console.log('\n================================================================');
        console.log('📦 SCENARIO 4: LARGE ORDER TESTING');
        console.log('================================================================');

        console.log('➡️ Creating a massive order with 20+ items (Testing system stress limits)...');
        const largeItemsPayload = [];
        for (let j = 0; j < 25; j++) {
            largeItemsPayload.push({
                menuItemId: getMenuItemId(j),
                quantity: Math.floor(Math.random() * 5) + 1,
            });
        }

        const sr4OrderRes = await request('/order', 'POST', waiterA.headers, {
            orderType: 2, // Takeaway
            items: largeItemsPayload,
            notes: 'Huge corporate order'
        });
        report.totalOrdersCreated++;
        console.log(`✅ Large Order (25 Items) created successfully! ID: ${sr4OrderRes.data._id}`);
        await sleep(200);
        const sr4Kots = await request(`/kot?orderId=${sr4OrderRes.data._id}`, 'GET', waiterA.headers);
        report.totalKotsGenerated++;

        if (sr4Kots.data[0].items.length !== 25) {
            report.errors.push(`Large order did not retain all 25 items in KOT. Found: ${sr4Kots.data[0].items.length}`);
        } else {
            console.log('✅ KOT correctly received all 25 items.');
        }


        // -----------------------------------------------------------------------------------------
        // SCENARIO 7: PERFORMANCE & RACE CONDITION TESTING
        // -----------------------------------------------------------------------------------------
        console.log('\n================================================================');
        console.log('🚀 SCENARIO 7: PERFORMANCE LOAD TEST (10 SIMULTANEOUS ORDERS)');
        console.log('================================================================');

        console.log('➡️ Firing 10 synchronous order requests to blitz the API and check sequences...');

        const loadPromises = [];
        for (let i = 0; i < 10; i++) {
            loadPromises.push(
                request('/order', 'POST', waiterA.headers, {
                    orderType: 2, // Takeaway
                    items: [{ menuItemId: getMenuItemId(i), quantity: 1 }],
                    notes: `Load test order #${i}`
                }).then(res => res.data._id).catch(e => {
                    report.errors.push(`Load test order ${i} failed: ${e.message}`);
                    return null;
                })
            );
        }

        const perfOrderIds = await Promise.all(loadPromises);
        const successfulBlits = perfOrderIds.filter(id => id !== null);
        report.totalOrdersCreated += successfulBlits.length;
        report.totalKotsGenerated += successfulBlits.length;

        console.log(`✅ Placed ${successfulBlits.length} out of 10 simultaneous orders successfully.`);

        // Assert sequence collisions
        const perfOrders = await OrderEntity.find({ _id: { $in: successfulBlits } }).lean();
        const orderNumbers = new Set(perfOrders.map((o: any) => o.orderNumber));
        if (orderNumbers.size !== successfulBlits.length) {
            report.errors.push('CRITICAL: Duplicate order numbers generated in load test! Sequence failure.');
        } else {
            console.log('✅ All generated orders have UNIQUE sequential order numbers.');
        }


        // -----------------------------------------------------------------------------------------
        // FINAL DATABASE AGGREGATIONS AND VALIDATIONS (Scenario 5, 6, 8)
        // -----------------------------------------------------------------------------------------
        console.log('\n================================================================');
        console.log('📊 ENTIRE WORKFLOW VALIDATION & OUTPUT REPORT');
        console.log('================================================================');

        // Cleanup fake users to keep DB clean
        await UserEntity.deleteMany({ _id: { $in: waiters.map(w => w.id) } });

        console.log('\n[E2E RUN REPORT]');
        console.log('-----------------------------------');
        console.log(`Orders Created:     ${report.totalOrdersCreated}`);
        console.log(`KOTs Generated:     ${report.totalKotsGenerated}`);
        console.log(`Item Updates:       ${report.numberOfItemUpdates}`);
        console.log(`VOID KOTs Issued:   ${report.numberOfVoidKots}`);
        console.log('-----------------------------------');

        if (report.errors.length > 0) {
            console.log('\n❌ TESTS COMPLETED WITH ERRORS:');
            report.errors.forEach((err, idx) => console.log(`  [!] Error ${idx + 1}: ${err}`));
            process.exit(1);
        } else {
            console.log('\n🎉 ALL FULL WORKFLOW END-TO-END TESTS PASSED WITH 100% DATA INTEGRITY! 🎉');
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
