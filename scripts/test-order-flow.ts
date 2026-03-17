// scripts/test-order-flow.ts
import axios from 'axios';
import * as readline from 'readline';

const API_BASE = 'http://localhost:3000/api/v1'; // Adjust if different

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string): Promise<string> => {
    return new Promise((resolve) => rl.question(query, resolve));
};

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    console.log('--- Order & KOT Flow Automation Test ---');

    // 1. Login
    const username = await question('Enter username: ');
    const password = await question('Enter password: ');

    let token = '';
    let brandId = '';
    let outletId = '';

    try {
        console.log('\n[1] Logging in...');
        const loginRes = await axios.post(`${API_BASE}/users/login`, {
            username,
            password
        });

        token = loginRes.data.data.token;
        brandId = loginRes.data.data.brand._id;
        // For testing, just pick the first outlet if available
        outletId = loginRes.data.data.outlets?.[0]?._id;

        if (!outletId) {
            // Fallback: If login doesn't return outlets, we'll try to fetch them or ask user
            const outletInput = await question('No outlets returned in login. Enter Outlet ID manually: ');
            outletId = outletInput.trim();
        }

        console.log('✅ Login successful!');
        console.log(`Brand ID: ${brandId}`);
        console.log(`Outlet ID: ${outletId}`);
    } catch (err: any) {
        console.error('❌ Login failed:', err.response?.data || err.message);
        rl.close();
        return;
    }

    const headers = {
        Authorization: `Bearer ${token}`
    };

    // 2. Fetch Menu Items
    console.log('\n[2] Fetching Menu Items...');
    let menuItemId = '';
    let variationId = '';
    let addons: any[] = [];
    let name = '';

    try {
        // We'll use the addon mapping endpoint to get structured data ideally, or list menu items
        const menuRes = await axios.get(`${API_BASE}/menu-items/brand/${brandId}/outlet/${outletId}`, { headers });
        const items = menuRes.data.data.items;

        if (!items || items.length === 0) {
            console.log('❌ No menu items found in this outlet.');
            rl.close();
            return;
        }

        // Pick a random item, preferably with variations if available
        const item = items.find((i: any) => i.isVariation && i.variations?.length > 0) || items[0];
        menuItemId = item._id;
        name = item.name;

        console.log(`Picked Item: ${name} (${menuItemId})`);

        if (item.isVariation && item.variations?.length > 0) {
            variationId = item.variations[0].variationId;
            console.log(`Picked Variation: ${item.variations[0].name || variationId}`);
            if (item.variations[0].addons?.length > 0) {
                addons = item.variations[0].addons;
            }
        } else if (item.addons?.length > 0) {
            addons = item.addons;
        }

    } catch (err: any) {
        console.error('❌ Failed fetching menu:', err.response?.data || err.message);
        rl.close();
        return;
    }

    // Pick addons if available
    const orderAddons = [];
    if (addons.length > 0) {
        // Pick first addon and first allowed item
        const firstAddon = addons[0];
        if (firstAddon.items && firstAddon.items.length > 0) {
            orderAddons.push({
                addonId: firstAddon._id || firstAddon.id || 'missing-addon-id', // Needs valid ID depending on response struct
                addonItemId: firstAddon.items[0] || 'missing-item-id'
            });
            console.log(`Picked Addon for order`);
        }
    }

    // 3. Create Order (Takeaway to test token)
    console.log('\n[3] Creating Takeaway Order...');
    let orderId = '';
    let orderNumber = '';

    try {
        const createOrderPayload = {
            orderType: 'TAKEAWAY',
            items: [
                {
                    menuItemId,
                    quantity: 2,
                    variationId: variationId || undefined,
                    // Since we might not have pure parsed addon IDs easily, we'll try without addons first 
                    // to ensure a successful run, or add logic if you know the exact schema needed.
                    // addons: orderAddons
                }
            ]
        };

        const orderRes = await axios.post(`${API_BASE}/orders/brand/${brandId}/outlet/${outletId}`, createOrderPayload, { headers });

        orderId = orderRes.data.data._id;
        orderNumber = orderRes.data.data.orderNumber;

        console.log('✅ Order created successfully!');
        console.log(`Order ID: ${orderId}`);
        console.log(`Order Number: ${orderNumber}`);
        console.log(`Order Token: ${orderRes.data.data.tokenNumber || 'N/A'}`);

    } catch (err: any) {
        console.error('❌ Failed creating order:', err.response?.data || err.message);
        rl.close();
        return;
    }

    // 4. Fetch the Order to verify KOTs
    console.log('\n[4] Fetching Order Details to get KOT IDs...');
    let kotIds: string[] = [];

    try {
        const listRes = await axios.get(`${API_BASE}/orders/brand/${brandId}/outlet/${outletId}?search=${orderNumber}`, { headers });
        const orderData = listRes.data.data.items?.find((o: any) => o._id === orderId);

        if (orderData && orderData.kots) {
            kotIds = orderData.kots.map((k: any) => k._id);
            console.log(`✅ Found ${kotIds.length} KOT(s) linked to Order.`);
        } else {
            console.log('⚠️ No KOTs found in order response.');
        }
    } catch (err: any) {
        console.error('❌ Failed fetching order details:', err.response?.data || err.message);
    }

    // 5. Update KOT Status -> PREPARING
    if (kotIds.length > 0) {
        console.log(`\n[5] Updating KOT to PREPARING...`);
        try {
            await axios.patch(`${API_BASE}/kots/brand/${brandId}/outlet/${outletId}/${kotIds[0]}`, { status: 'PREPARING' }, { headers });
            console.log(`✅ KOT ${kotIds[0]} marked as PREPARING.`);
        } catch (err: any) {
            console.error('❌ Failed updating KOT:', err.response?.data || err.message);
        }
    }

    // 6. Check Token Display Endpoint
    console.log('\n[6] Checking Token Display Endpoint...');
    try {
        const tokenRes = await axios.get(`${API_BASE}/orders/tokens/brand/${brandId}/outlet/${outletId}`, { headers });
        console.log('Token Display Screen Data:');
        console.log(JSON.stringify(tokenRes.data.data, null, 2));

        // Assert token is in preparing
        const isPreparing = tokenRes.data.data.preparing.some((t: any) => String(t.orderId) === String(orderId));
        if (isPreparing) {
            console.log(`✅ Token successfully found in PREPARING list!`);
        } else {
            console.log(`❌ Token NOT found in PREPARING list!`);
        }

    } catch (err: any) {
        console.error('❌ Failed fetching token display:', err.response?.data || err.message);
    }

    // 7. Update KOT Status -> READY
    if (kotIds.length > 0) {
        console.log(`\n[7] Updating KOT to READY...`);
        try {
            await axios.patch(`${API_BASE}/kots/brand/${brandId}/outlet/${outletId}/${kotIds[0]}`, { status: 'READY' }, { headers });
            console.log(`✅ KOT ${kotIds[0]} marked as READY.`);
        } catch (err: any) {
            console.error('❌ Failed updating KOT:', err.response?.data || err.message);
        }
    }

    // 8. Re-check Token Display Endpoint
    console.log('\n[8] Re-checking Token Display Endpoint...');
    try {
        const tokenRes = await axios.get(`${API_BASE}/orders/tokens/brand/${brandId}/outlet/${outletId}`, { headers });

        const isReady = tokenRes.data.data.ready.some((t: any) => String(t.orderId) === String(orderId));
        if (isReady) {
            console.log(`✅ Token successfully moved to READY list!`);
        } else {
            console.log(`❌ Token NOT found in READY list!`);
        }
    } catch (err: any) {
        console.error('❌ Failed fetching token display:', err.response?.data || err.message);
    }

    // 9. Cancel Order to test edge case
    console.log(`\n[9] Cancelling the Order to clear display...`);
    try {
        await axios.post(`${API_BASE}/orders/cancel/brand/${brandId}/outlet/${outletId}/${orderId}`, { reason: 'Automation Test Cancelled' }, { headers });
        console.log(`✅ Order ${orderId} cancelled successfully.`);
    } catch (err: any) {
        console.error('❌ Failed cancelling order:', err.response?.data || err.message);
    }

    // 10. Final Verification
    console.log('\n[10] Final Check of Token Display (Should be empty of our token)...');
    try {
        const tokenRes = await axios.get(`${API_BASE}/orders/tokens/brand/${brandId}/outlet/${outletId}`, { headers });

        const isPreparing = tokenRes.data.data.preparing.some((t: any) => String(t.orderId) === String(orderId));
        const isReady = tokenRes.data.data.ready.some((t: any) => String(t.orderId) === String(orderId));

        if (!isPreparing && !isReady) {
            console.log(`✅ Token successfully removed from display screen after cancellation!`);
        } else {
            console.log(`❌ Token STILL appears on display screen! (Preparing: ${isPreparing}, Ready: ${isReady})`);
        }
    } catch (err: any) {
        console.error('❌ Failed fetching token display:', err.response?.data || err.message);
    }

    console.log('\n🎉 Automation Flow Test Complete!');
    rl.close();
}

runTest();
