import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createOrder, getOrderById, closeOrder } from './src/modules/order/order.service';
import { generateKOT, listKOTsByOrder } from './src/modules/kot/kot.service';
import { getTableLiveOrders, updateTableStatus } from './src/modules/table/table.service';
import { getSalesReport, getItemSalesReport } from './src/modules/report/report.service';
import { OrderEntity } from './src/modules/order/order.model';
import { TableEntity } from './src/modules/table/table.model';
import { MenuItemEntity } from './src/modules/menu/menu-items/menu-item.model';

dotenv.config();

const brandId = new mongoose.Types.ObjectId().toString();
const outletId = new mongoose.Types.ObjectId().toString();

async function runTests() {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant-api');
    console.log('Connected.');

    try {
        // Setup test data
        console.log('Setting up dummy table and menu items...');
        const tableId = new mongoose.Types.ObjectId().toString();
        await TableEntity.create({
            _id: tableId,
            brandId,
            outletId,
            name: 'Test Table 1',
            capacity: 4,
            status: 'AVAILABLE'
        });

        const menuId = new mongoose.Types.ObjectId().toString();
        await MenuItemEntity.create({
            _id: menuId,
            brandId,
            outletId,
            name: 'Paneer Butter Masala',
            categoryId: new mongoose.Types.ObjectId().toString(),
            dietary: 'VEG',
            basePrice: 200,
            costPrice: 100,
        });

        console.log('1. Order Flow (DINE_IN) Tests');
        console.log('Creating DINE_IN order...');

        // Using any to bypass strict typechecking for the test script
        const orderPayload: any = {
            orderType: 'DINE_IN',
            tableId,
            items: [
                {
                    menuItemId: menuId,
                    quantity: 2,
                }
            ]
        };

        const order = await createOrder(brandId, outletId, orderPayload);
        if (!order) throw new Error('Order creation failed');
        console.log('Order created successfully. Total:', order.totalAmount);

        console.log('Verifying table status is OCCUPIED...');
        const tableDoc = await TableEntity.findById(tableId);
        if (tableDoc?.status !== 'OCCUPIED') throw new Error(`Table status not OCCUPIED, it's ${tableDoc?.status}`);
        console.log('Table status updated successfully \u2705');

        console.log('Verifying KOT generation...');
        const kots = await listKOTsByOrder(brandId, outletId, order._id.toString());
        if (kots.length !== 1) throw new Error('KOT not generated automatically!');
        console.log('KOT created successfully \u2705', kots[0].kotNumber);

        console.log('Verifying Table Live Orders...');
        const liveOrders = await getTableLiveOrders(brandId, outletId, tableId);
        if (liveOrders.length !== 1) throw new Error('Live orders count mismatch');
        console.log('Table live orders fetched successfully \u2705');

        console.log('Closing Order...');
        await closeOrder(brandId, outletId, order._id.toString());

        console.log('Verifying table status returns to AVAILABLE...');
        const tableClosed = await TableEntity.findById(tableId);
        if (tableClosed?.status !== 'AVAILABLE') throw new Error(`Table status not AVAILABLE after close, it's ${tableClosed?.status}`);
        console.log('Table status returned correctly \u2705');

        console.log('2. Report Tests');
        const salesReport = await getSalesReport(brandId, outletId);
        console.log('Sales Report:', JSON.stringify(salesReport, null, 2));

        const itemReport = await getItemSalesReport(brandId, outletId);
        console.log('Item Sales Report:', JSON.stringify(itemReport, null, 2));

        console.log('All verification checks passed successfully! \u2705\u2705\u2705');
    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        console.log('Cleaning up data...');
        if (mongoose.connection.db) {
            await mongoose.connection.db.dropDatabase();
        }
        await mongoose.disconnect();
    }
}

runTests();
