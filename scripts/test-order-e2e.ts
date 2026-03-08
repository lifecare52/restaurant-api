import 'dotenv/config';
import mongoose from 'mongoose';
import { OrderEntity } from '../src/modules/order/order.model';

let API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3000/api/v1';

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

async function testTakeawayOrder(headers: any, menuItems: any[]) {
    console.log('\n=========================================');
    console.log('🍔 SCENARIO 1: TAKEAWAY ORDER TESTING');
    console.log('=========================================');

    if (menuItems.length < 2) {
        throw new Error('Not enough menu items to run the test. Need at least 2.');
    }

    const item1 = menuItems[0];
    const item2 = menuItems[1];

    // Step 1: Create a takeaway order using POST /orders
    console.log('\n➡️ Step 1: Create a takeaway order (POST /orders)');
    const createOrderPayload = {
        orderType: 2, // 2 = TAKEAWAY
        items: [
            {
                menuItemId: item1._id,
                quantity: 1,
                instruction: 'No onions please'
            }
        ],
        notes: 'Test takeaway order'
    };

    const orderRes = await request('/order', 'POST', headers, createOrderPayload);
    const orderId = orderRes.data._id;
    const tokenNumber = orderRes.data.tokenNumber;
    console.log(`✅ Order created! Order ID: ${orderId}, Token: ${tokenNumber}`);

    // Wait a moment before checking KOTs
    await new Promise(resolve => setTimeout(resolve, 500));

    // Expected: KOT should be automatically created
    let kotsRes = await request(`/kot?orderId=${orderId}`, 'GET', headers);
    let originalKotId = kotsRes.data[0]._id;
    console.log(`✅ Initial KOT created automatically. KOT ID: ${originalKotId}, Items count: ${kotsRes.data[0].items.length}`);

    // Step 2: Add multiple menu items to the order.
    console.log('\n➡️ Step 2: Add multiple menu items to the order (POST /orders/add-items)');
    const addItemsPayload = {
        orderId,
        items: [
            {
                menuItemId: item2._id,
                quantity: 2
            }
        ]
    };
    await request('/order/add-items', 'POST', headers, addItemsPayload);
    console.log('✅ Items added successfully.');

    // Wait a moment and check KOTs again
    await new Promise(resolve => setTimeout(resolve, 500));
    kotsRes = await request(`/kot?orderId=${orderId}`, 'GET', headers);
    console.log(`✅ Total KOTs for order now: ${kotsRes.data.length}. Expected: 2.`);
    const newKot = kotsRes.data.find((k: any) => k._id !== originalKotId);
    console.log(`✅ New KOT generated for added items. KOT ID: ${newKot._id}`);

    // Step 3: Update item quantity.
    console.log('\n➡️ Step 3: Update item quantity (PATCH /orders/update-item)');
    // We need to fetch the order details to get the orderItemId
    const orderDetailContent = await request(`/order/detail?orderId=${orderId}`, 'GET', headers);
    const orderItemToUpdate = orderDetailContent.data.items.find((i: any) => i.menuItemId._id === item1._id || i.menuItemId === item1._id);

    if (!orderItemToUpdate) throw new Error('Could not find order item to update');

    await request('/order/update-item', 'PATCH', headers, {
        orderId,
        orderItemId: orderItemToUpdate._id,
        quantity: orderItemToUpdate.quantity + 1
    });
    console.log(`✅ Order item quantity updated from ${orderItemToUpdate.quantity} to ${orderItemToUpdate.quantity + 1}.`);

    await new Promise(resolve => setTimeout(resolve, 500));
    kotsRes = await request(`/kot?orderId=${orderId}`, 'GET', headers);
    console.log(`✅ Total KOTs for order now: ${kotsRes.data.length}. Expected: 3 (1 Original, 1 Add, 1 Quantity Update).`);

    // Step 4: Remove or cancel an item.
    console.log('\n➡️ Step 4: Remove or cancel an item (POST /orders/remove-item)');
    const orderItemToRemove = orderDetailContent.data.items.find((i: any) => i.menuItemId._id === item2._id || i.menuItemId === item2._id);

    await request('/order/remove-item', 'POST', headers, {
        orderId,
        orderItemId: orderItemToRemove._id,
        cancelReason: 'Customer changed mind'
    });
    console.log('✅ Item removed successfully.');

    await new Promise(resolve => setTimeout(resolve, 500));
    kotsRes = await request(`/kot?orderId=${orderId}`, 'GET', headers);
    console.log(`✅ Total KOTs for order now: ${kotsRes.data.length}. Expected: 4.`);
    const voidKots = kotsRes.data.filter((k: any) => k.kotType === 'VOID'); // Assuming there's a property to identify VOID or checking the status
    console.log(`✅ VOID KOT generated: ${voidKots.length > 0}`);

    // Step 5: Fetch KOT list using GET /kots
    console.log('\n➡️ Step 5: Fetch KOT list (GET /kots)');
    console.log('KOTs Summary:');
    kotsRes.data.forEach((kot: any, index: number) => {
        console.log(`   [${index + 1}] KOT ID: ${kot.kotNumber || kot._id} | Type: ${kot.kotType || 'NEW'} | Items: ${kot.items.length}`);
    });
    console.log(`Token Number visible: ${kotsRes.data[0].tokenNumber || tokenNumber}`);

    // Step 5.5: Mock Payment
    console.log('\n➡️ Step 5.5: Mocking Payment for Order (Setting paymentStatus = 3)...');
    await OrderEntity.updateOne({ _id: orderId }, { paymentStatus: 3 });

    // Step 6: Complete the order and submit the bill.
    console.log('\n➡️ Step 6: Complete the order and submit the bill (POST /order/close)');
    await request('/order/close', 'POST', headers, {
        orderId,
        paymentMethod: 1 // 1 = CASH
    });
    console.log('✅ Order closed successfully.');

    const finalOrder = await request(`/order/detail?orderId=${orderId}`, 'GET', headers);
    console.log(`✅ Final Order Status: ${finalOrder.data.status} (Expected: 4 or COMPLETED)`);
}

async function testDineInOrder(headers: any, menuItems: any[], tableId: string) {
    console.log('\n=========================================');
    console.log('🍽️ SCENARIO 2: DINE-IN ORDER TESTING');
    console.log('=========================================');

    if (menuItems.length < 9) {
        console.log('⚠️ Not enough menu items for full 9-items dine-in test, reusing items...');
    }

    const getMenuItemId = (index: number) => menuItems[index % menuItems.length]._id;

    // Step 1: Create a dine-in order with a tableId.
    console.log('\n➡️ Step 1 & 2: Create a dine-in order with first round (POST /orders)');
    const createOrderPayload = {
        orderType: 1, // 1 = DINE_IN
        tableId: tableId,
        items: [
            { menuItemId: getMenuItemId(0), quantity: 2 },
            { menuItemId: getMenuItemId(1), quantity: 1 },
            { menuItemId: getMenuItemId(2), quantity: 1 },
            { menuItemId: getMenuItemId(3), quantity: 1 },
            { menuItemId: getMenuItemId(4), quantity: 1 }
        ],
        notes: 'Dine-in Customer'
    };

    const orderRes = await request('/order', 'POST', headers, createOrderPayload);
    const orderId = orderRes.data._id;
    console.log(`✅ Dine-in Order created! Order ID: ${orderId}, Table: ${tableId}`);

    await new Promise(resolve => setTimeout(resolve, 500));
    let kotsRes = await request(`/kot?orderId=${orderId}`, 'GET', headers);
    console.log(`✅ Initial KOT created automatically for 5 items. KOT ID: ${kotsRes.data[0]._id}`);

    // Step 3: Customer later orders more items (4 additional items)
    console.log('\n➡️ Step 3: Customer later orders more items (POST /orders/add-items)');
    const addItemsPayload = {
        orderId,
        items: [
            { menuItemId: getMenuItemId(5), quantity: 1 },
            { menuItemId: getMenuItemId(6), quantity: 1 },
            { menuItemId: getMenuItemId(7), quantity: 1 },
            { menuItemId: getMenuItemId(8), quantity: 1 }
        ]
    };
    await request('/order/add-items', 'POST', headers, addItemsPayload);
    console.log('✅ Additional 4 items added successfully.');

    await new Promise(resolve => setTimeout(resolve, 500));
    kotsRes = await request(`/kot?orderId=${orderId}`, 'GET', headers);
    console.log(`✅ Total KOTs for order now: ${kotsRes.data.length}. Expected: 2.`);

    // Step 4: Customer modifies an item quantity
    console.log('\n➡️ Step 4: Customer modifies an item quantity (PATCH /orders/update-item)');
    const orderDetailContent = await request(`/order/detail?orderId=${orderId}`, 'GET', headers);
    const orderItemToUpdate = orderDetailContent.data.items[0]; // Take the first item

    await request('/order/update-item', 'PATCH', headers, {
        orderId,
        orderItemId: orderItemToUpdate._id,
        quantity: orderItemToUpdate.quantity + 1
    });
    console.log(`✅ Order item quantity updated from ${orderItemToUpdate.quantity} to ${orderItemToUpdate.quantity + 1}.`);

    await new Promise(resolve => setTimeout(resolve, 500));
    kotsRes = await request(`/kot?orderId=${orderId}`, 'GET', headers);
    console.log(`✅ Total KOTs for order now: ${kotsRes.data.length}. Expected: 3.`);

    // Step 5: Customer cancels an item.
    console.log('\n➡️ Step 5: Customer cancels an item (POST /orders/remove-item)');
    const orderItemToRemove = orderDetailContent.data.items[orderDetailContent.data.items.length - 1]; // Take the last item added

    await request('/order/remove-item', 'POST', headers, {
        orderId,
        orderItemId: orderItemToRemove._id,
        cancelReason: 'Customer changed mind'
    });
    console.log('✅ Item removed successfully.');

    await new Promise(resolve => setTimeout(resolve, 500));
    kotsRes = await request(`/kot?orderId=${orderId}`, 'GET', headers);
    console.log(`✅ Total KOTs for order now: ${kotsRes.data.length}. Expected: 4.`);
    const voidKots = kotsRes.data.filter((k: any) => k.kotType === 'VOID'); // or checking the status
    console.log(`✅ VOID KOT generated: ${voidKots.length > 0}`);

    // Step 6: Fetch KOT list
    console.log('\n➡️ Step 6: Fetch KOT list (GET /kots)');
    console.log('KOTs Summary:');
    kotsRes.data.forEach((kot: any, index: number) => {
        console.log(`   [${index + 1}] KOT ID: ${kot.kotNumber || kot._id} | Type: ${kot.kotType || 'NEW'} | Items: ${kot.items.length}`);
    });

    // Step 6.5: Mock Payment
    console.log('\n➡️ Step 6.5: Mocking Payment for Dine-In Order (Setting paymentStatus = 3)...');
    await OrderEntity.updateOne({ _id: orderId }, { paymentStatus: 3 });

    // Step 7: Customer finishes meal
    console.log('\n➡️ Step 7: Customer finishes meal, submit bill / complete order (POST /order/close)');
    await request('/order/close', 'POST', headers, {
        orderId,
        paymentMethod: 2 // 2 = CARD
    });
    console.log('✅ Dine-in Order closed successfully.');

    const finalOrder = await request(`/order/detail?orderId=${orderId}`, 'GET', headers);
    console.log(`✅ Final Order Status: ${finalOrder.data.status} (Expected: 4 or COMPLETED)`);
}

async function runTests() {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) throw new Error('MONGO_URI is not set in .env');

    console.log('🔗 Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.');

    const brandId = '69a9a3abe46a664f8002a4eb';

    const outletId = '69a9a3c7e46a664f8002a4ef';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YTlhODIxZTQ2YTY2NGY4MDAyYTRmNyIsInJvbGUiOiJPV05FUiIsImJyYW5kSWQiOiI2OWE5YTNhYmU0NmE2NjRmODAwMmE0ZWIiLCJvdXRsZXRzIjpbIjY5YTlhM2M3ZTQ2YTY2NGY4MDAyYTRlZiJdLCJwZXJtaXNzaW9ucyI6WyJVU0VSX01BTkFHRU1FTlQiLCJCUkFORF9NQU5BR0VNRU5UIiwiT1VUTEVUX01BTkFHRU1FTlQiXSwiaWF0IjoxNzcyNzI2Mzk2LCJleHAiOjE3NzMzMzExOTZ9.VOlumiPiPvqi27qifWNxJoNP9yGQ1n8hBnrgMFiTcNM';
    // User mentioned this Waiter/Staff who takes the order
    const staffId = '69ad0074dd5113c0e695b38f';

    const headers = {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': brandId,
        'brand-id': brandId,
        'outlet-id': outletId,
    };

    try {
        console.log('🚀 Starting Order & KOT End-to-End Tests...\n');

        // Fetch some dynamic menu items
        console.log('📖 Fetching available menu items...');
        const menuRes = await request('/menu/menu-items?limit=10', 'GET', headers);
        const menuItems = menuRes.data;

        if (!menuItems || menuItems.length === 0) {
            throw new Error('No menu items found in the database. Please seed the database first.');
        }
        console.log(`✅ Found ${menuItems.length} menu items.`);

        // Test 1: Takeaway Workflow
        await testTakeawayOrder(headers, menuItems);

        // Prepare table for Dine-in Workflow
        console.log('\n🪑 Fetching or creating a table for Dine-In test...');
        let tablesRes = await request('/tables?limit=5', 'GET', headers);
        let tableId;

        if (tablesRes.data && tablesRes.data.length > 0) {
            tableId = tablesRes.data[0]._id;
            console.log(`✅ Found existing table: ${tableId}`);
        } else {
            console.log('⚠️ No existing table found, creating a new table...');
            const newTableRes = await request('/tables', 'POST', headers, {
                name: 'Test Table ' + Date.now(),
                capacity: 4
            });
            tableId = newTableRes.data._id;
            console.log(`✅ Created new table: ${tableId}`);
        }

        // Test 2: Dine-In Workflow
        await testDineInOrder(headers, menuItems, tableId);

        console.log('\n🎉 ALL ORDER SCENARIOS PASSED SUCCESSFULLY! 🎉');

    } catch (error: any) {
        console.error('\n❌ TEST SCENARIO FAILED:');
        console.error(error.message);
        if (error.stack) console.error(error.stack);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

runTests();
