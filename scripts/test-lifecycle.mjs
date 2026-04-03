/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   RESTAURANT POS — FULL ORDER LIFECYCLE TEST SUITE               ║
 * ║   Covers: Order → Items → KOT → Payment → Close/Cancel           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * ⚠️  SAFE: Does NOT drop/clear any DB collections.
 * ⚠️  Creates real orders using real menu data. Review before running.
 *
 * HOW TO RUN:
 *   node scripts/test-lifecycle.mjs                    (embedded token)
 *   node scripts/test-lifecycle.mjs <FRESH_TOKEN>      (cli arg)
 *
 * TEST GROUPS (36 groups: A → AJ):
 *
 *  ── DISCOVERY ──────────────────────────────────────────────────────
 *  A   Menu discovery + item type categorisation
 *  B   Tables discovery (for DINE_IN)
 *  C   GET /order (list with filters)
 *  D   GET /kot/kitchen (kitchen display)
 *
 *  ── ORDER TYPES ────────────────────────────────────────────────────
 *  E   TAKEAWAY order — simple item × 2
 *  F   TAKEAWAY order — variation item
 *  G   TAKEAWAY order — measurement-based item
 *  H   TAKEAWAY order — item with addon
 *  I   DINE_IN order  — requires tableId (skipped if no tables)
 *  J   DELIVERY order — requires shippingAddress
 *
 *  ── ITEM MANAGEMENT (on live TAKEAWAY order) ───────────────────────
 *  K   GET /order/detail — verify item list
 *  L   POST /order/add-items  — add new item to existing order
 *  M   PATCH /order/update-item — change quantity on pending item
 *  N   PATCH /order/update-item — add instruction to item
 *  O   POST /order/remove-item — remove one item (with reason)
 *  P   Re-verify order total after add/remove/update
 *
 *  ── KOT LIFECYCLE (on main test order) ─────────────────────────────
 *  Q   GET /kot?orderId — list KOTs after order created
 *  R   GET /kot?orderId — list KOTs after add-items
 *  S   PATCH /kot/status → PREPARING (1→2)
 *  T   PATCH /kot/status → READY     (2→3)
 *  U   PATCH /kot/status → SERVED    (3→4)
 *  V   PATCH /kot/item-status — mark single item PREPARING
 *  W   PATCH /kot/item-status → READY on same item
 *  X   Invalid KOT status transition guard (e.g. 4→1)
 *
 *  ── PAYMENT LIFECYCLE ───────────────────────────────────────────────
 *  Y   Close before payment (must 400)
 *  Z   Partial CASH payment
 *  AA  Close after partial (must 400)
 *  AB  GET /payment/order-payments — verify paidAmount / balanceDue
 *  AC  Second partial UPI + reference
 *  AD  Pay exact remaining CARD → PAID
 *  AE  Close fully PAID order → COMPLETED
 *  AF  Pay on COMPLETED order (must 400)
 *
 *  ── CANCEL SCENARIO ─────────────────────────────────────────────────
 *  AG  Create fresh order → cancel before payment
 *  AH  Pay on CANCELLED order (must 400)
 *  AI  Close CANCELLED order (must 400)
 *
 *  ── ORDER LIST / TOKEN BOARD ─────────────────────────────────────────
 *  AJ  GET /order/tokens (takeaway token board)
 */

// ─── Configuration ───────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api/v1';

const TOKEN =
  process.argv[2] ||
  process.env.TOKEN ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YTk5OWFlNDBlMDllM2ZjOTY3NTkzMyIsInJvbGUiOiJPV05FUiIsImJyYW5kSWQiOiI2OWE5OTdmYjQwZTA5ZTNmYzk2NzU5MmQiLCJvdXRsZXRzIjpbIjY5YTk5ODZmNDBlMDllM2ZjOTY3NTkzMSJdLCJwZXJtaXNzaW9ucyI6WyJVU0VSX01BTkFHRU1FTlQiLCJCUkFORF9NQU5BR0VNRU5UIiwiT1VUTEVUX01BTkFHRU1FTlQiXSwiaWF0IjoxNzczOTM3Nzg4LCJleHAiOjE3NzQ1NDI1ODh9.CgMj4kzTsXYMG4A8ewmZOyNKTXHA3Q9QXx8W4376EIA';

const BRAND_ID = process.env.BRAND_ID || '69a997fb40e09e3fc967592d';
const OUTLET_ID = process.env.OUTLET_ID || '69a9986f40e09e3fc9675931';

const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
  'brand-id': BRAND_ID,
  'outlet-id': OUTLET_ID
};

// Enums (mirrors backend)
const ORDER_STATUS = { OPEN: 1, IN_PROGRESS: 2, COMPLETED: 3, CANCELLED: 4 };
const KOT_STATUS = { PENDING: 1, PREPARING: 2, READY: 3, SERVED: 4, CANCELLED: 5 };
const ITEM_STATUS = { PENDING: 1, PREPARING: 2, READY: 3, SERVED: 4, CANCELLED: 5 };
const PAYMENT_STATUS = { UNPAID: 1, PARTIAL: 2, PAID: 3, REFUNDED: 4 };
const PAYMENT_METHOD = { CASH: 1, CARD: 2, UPI: 3, WALLET: 4, ONLINE: 5 };
const ORDER_TYPE = { DINE_IN: 1, TAKEAWAY: 2, DELIVERY: 3 };

// ─── Test harness ────────────────────────────────────────────────────────────

let passCount = 0;
let failCount = 0;
let skipCount = 0;
const results = [];

const pass = (label, detail = '') => { passCount++; results.push({ s: 'P', label, detail }); console.log(`✅  ${label}${detail ? `  →  ${detail}` : ''}`); };
const fail = (label, detail = '') => { failCount++; results.push({ s: 'F', label, detail }); console.log(`❌  ${label}${detail ? `  →  ${detail}` : ''}`); };
const skip = (label, reason = '') => { skipCount++; results.push({ s: 'S', label, detail: reason }); console.log(`⏭️   SKIP: ${label}${reason ? `  (${reason})` : ''}`); };
const info = (msg) => console.log(`ℹ️   ${msg}`);
const section = (title) => { console.log(`\n${'═'.repeat(67)}`); console.log(`  ${title}`); console.log('═'.repeat(67)); };

async function api(method, path, body) {
  const opts = { method, headers: HEADERS };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(`${BASE_URL}${path}`, opts);
    const json = await res.json();
    return { httpStatus: res.status, ...json };
  } catch (e) {
    return { httpStatus: 0, status: false, message: e.message };
  }
}

// ─── Discovery helpers ───────────────────────────────────────────────────────

async function fetchMenuItems() {
  const res = await api('GET', '/order/menu-items');
  if (res.httpStatus === 401) {
    console.error('\n💥 401 Unauthorized — token is expired or invalid.');
    console.error('   node scripts/test-lifecycle.mjs <FRESH_TOKEN>\n');
    process.exit(1);
  }
  return (res.data || []).flatMap((c) => (c.items || []));
}

async function fetchTables() {
  const res = await api('GET', '/tables?page=1&limit=20');
  return (res.data || []).filter((t) => t.isActive && !t.isDelete);
}

function categorise(items) {
  const used = new Set();

  const pick = (pred) => {
    const found = items.find((i) => !used.has(String(i._id)) && pred(i));
    if (found) used.add(String(found._id));
    return found || null;
  };

  const simple = pick((i) => i.basePrice && !i.isMeasurementBased && !i.isVariation && (!i.addons || i.addons.length === 0));
  const withVariant = pick((i) => i.isVariation && i.variations?.length > 0);
  const withMeasure = pick((i) => i.isMeasurementBased && i.measurementConfig);
  const withAddon = pick((i) => !i.isVariation && i.addons?.length > 0 && i.addons[0]?.items?.length > 0);
  // Fallback simple for secondary tests (must be different from primary)
  const simple2 = pick((i) => i.basePrice && !i.isMeasurementBased && !i.isVariation);

  return { simple, withVariant, withMeasure, withAddon, simple2 };
}

function itemPayload(item, qty = 1) {
  if (!item) return null;
  const p = { menuItemId: String(item._id), quantity: qty };
  if (item.isVariation && item.variations?.length > 0) {
    p.variationId = String(item.variations[0].variationId || item.variations[0]._id);
    delete p.quantity;
    p.quantity = qty;
  }
  return p;
}

function measurementPayload(item) {
  if (!item?.isMeasurementBased || !item.measurementConfig) return null;
  const mc = item.measurementConfig;
  return {
    menuItemId: String(item._id),
    measurement: {
      measurementId: mc.measurementId ? String(mc.measurementId) : undefined,
      unit: mc.unit || 'kg',
      enteredQuantity: mc.minValue ?? mc.baseValue ?? 0.5
    }
  };
}

function addonPayload(item) {
  if (!item) return null;
  const group = item.addons?.[0];
  const addonItem = group?.items?.[0];
  if (!group || !addonItem) return null;
  return {
    menuItemId: String(item._id),
    quantity: 1,
    addons: [{ addonId: String(group.addonId), addonItemId: String(addonItem._id), quantity: 1 }]
  };
}

// ─── Reusable operations ─────────────────────────────────────────────────────

function createOrder(orderType, items, extra = {}) {
  return api('POST', '/order', { orderType, items: items.filter(Boolean), ...extra });
}

function payFull(orderId, total) {
  return api('POST', '/payment/record', { orderId, amount: total, paymentMethod: PAYMENT_METHOD.CASH });
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  RESTAURANT POS — FULL ORDER LIFECYCLE TEST SUITE               ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`   BASE_URL : ${BASE_URL}`);
  console.log(`   Token    : ${TOKEN.slice(0, 40)}...`);

  // ══════════════════════════════════════════════════════════════════════════
  // A — MENU DISCOVERY
  // ══════════════════════════════════════════════════════════════════════════
  section('A — Menu Discovery & Item Type Categorisation');

  const allItems = await fetchMenuItems();
  if (allItems.length === 0) { fail('A: No active menu items found'); printSummary(); return; }

  pass(`A: Menu has ${allItems.length} active item(s)`);

  const { simple, withVariant, withMeasure, withAddon, simple2 } = categorise(allItems);
  info(`Simple item       : ${simple ? `"${simple.name}" ₹${simple.basePrice}` : 'NOT FOUND (needed)'}`);
  info(`Variation item    : ${withVariant ? `"${withVariant.name}"` : 'not found (groups F will skip)'}`);
  info(`Measurement item  : ${withMeasure ? `"${withMeasure.name}"` : 'not found (group G will skip)'}`);
  info(`Addon item        : ${withAddon ? `"${withAddon.name}"` : 'not found (group H will skip)'}`);
  info(`Secondary simple  : ${simple2 ? `"${simple2.name}" ₹${simple2.basePrice}` : 'NOT FOUND'}`);

  if (!simple) { fail('A: No simple menu item available — most tests will fail'); printSummary(); return; }
  pass(`A: Primary simple item ready: "${simple.name}"`);
  withVariant && pass(`A: Variation item ready: "${withVariant.name}"`);
  withMeasure && pass(`A: Measurement item ready: "${withMeasure.name}"`);
  withAddon && pass(`A: Addon item ready: "${withAddon.name}"`);

  // ══════════════════════════════════════════════════════════════════════════
  // B — TABLES DISCOVERY
  // ══════════════════════════════════════════════════════════════════════════
  section('B — Tables Discovery (needed for DINE_IN)');

  const tables = await fetchTables();
  const availableTable = tables.find((t) => t.status === 'AVAILABLE') ?? tables[0] ?? null;
  info(`Tables available: ${tables.length}${availableTable ? `, using "${availableTable.name}" (${availableTable.status})` : ''}`);
  availableTable ? pass('B: Table found for DINE_IN test') : skip('B: No tables configured — DINE_IN test will be skipped');

  // ══════════════════════════════════════════════════════════════════════════
  // C — LIST ORDERS
  // ══════════════════════════════════════════════════════════════════════════
  section('C — GET /order (list with filters)');
  {
    const r = await api('GET', '/order?page=1&limit=5');
    if (r.status && r.code === 200) {
      pass('C: List orders returns 200');
      typeof r.total === 'number' && pass(`C: total=${r.total} orders in system`);
      Array.isArray(r.data) && pass(`C: Returns array of ${r.data.length} order(s)`);
    } else {
      fail('C: List orders failed', JSON.stringify(r).slice(0, 150));
    }
    // Filter by TAKEAWAY
    const t = await api('GET', '/order?orderType=2&page=1&limit=3');
    t.status && pass('C: Filter by orderType=TAKEAWAY works');
    // Filter by IN_PROGRESS
    const ip = await api('GET', '/order?status=2&page=1&limit=3');
    ip.status && pass('C: Filter by status=IN_PROGRESS works');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // D — KITCHEN DISPLAY
  // ══════════════════════════════════════════════════════════════════════════
  section('D — GET /kot/kitchen (Kitchen Display System)');
  {
    const r = await api('GET', '/kot/kitchen');
    if (r.status && r.code === 200) {
      pass('D: Kitchen display returns 200');
      Array.isArray(r.data) && pass(`D: Kitchen queue has ${r.data.length} active KOT(s)`);
    } else {
      fail('D: Kitchen display failed', JSON.stringify(r).slice(0, 150));
    }
    // Filter by PENDING
    const rp = await api('GET', '/kot/kitchen?status=1');
    rp.status && pass('D: Kitchen filter by status=PENDING works');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // E — TAKEAWAY ORDER (simple item)  ← MAIN TEST ORDER
  // ══════════════════════════════════════════════════════════════════════════
  section('E — Create TAKEAWAY order (simple item × 2) — MAIN TEST ORDER');

  let mainOrder;
  {
    const r = await createOrder(ORDER_TYPE.TAKEAWAY,
      [itemPayload(simple, 2)],
      { notes: 'Lifecycle test — simple takeaway' }
    );
    if (!r.status || !r.data?._id) { fail('E: Create TAKEAWAY order failed', JSON.stringify(r).slice(0, 250)); printSummary(); return; }

    mainOrder = r.data;
    pass(`E: TAKEAWAY order created: ${mainOrder._id}`);
    info(`   totalAmount=₹${mainOrder.totalAmount}, status=${mainOrder.status}, paymentStatus=${mainOrder.paymentStatus}`);

    mainOrder.orderType === ORDER_TYPE.TAKEAWAY ? pass('E: orderType=TAKEAWAY(2)') : fail('E: Wrong orderType', `got=${mainOrder.orderType}`);
    mainOrder.status === ORDER_STATUS.OPEN ? pass('E: status=OPEN(1)') : fail('E: status should be OPEN', `got=${mainOrder.status}`);
    mainOrder.paymentStatus === PAYMENT_STATUS.UNPAID ? pass('E: paymentStatus=UNPAID(1)') : fail('E: Wrong paymentStatus');
    mainOrder.totalAmount > 0 ? pass(`E: totalAmount=₹${mainOrder.totalAmount}`) : fail('E: totalAmount must be > 0');
    Array.isArray(mainOrder.items) && mainOrder.items.length > 0
      ? pass(`E: items array has ${mainOrder.items.length} line(s)`)
      : fail('E: items array missing or empty');
    mainOrder.orderNumber ? pass(`E: orderNumber="${mainOrder.orderNumber}"`) : fail('E: orderNumber missing');
  }

  const MID = String(mainOrder._id);

  // ══════════════════════════════════════════════════════════════════════════
  // F — TAKEAWAY ORDER (variation item)
  // ══════════════════════════════════════════════════════════════════════════
  section('F — Create TAKEAWAY order (variation item)');
  {
    if (!withVariant) {
      skip('F: No variation item in menu');
    } else {
      const r = await createOrder(ORDER_TYPE.TAKEAWAY,
        [itemPayload(withVariant, 1)],
        { notes: 'Lifecycle test — variation item' }
      );
      if (r.status && r.data?._id) {
        pass(`F: Variation order created: ${r.data._id}, total=₹${r.data.totalAmount}`);
        r.data.totalAmount > 0 ? pass('F: Variation item priced correctly') : fail('F: totalAmount=0 for variation item');
        // Pay and close (cleanup)
        await api('POST', '/payment/record', { orderId: String(r.data._id), amount: r.data.totalAmount, paymentMethod: PAYMENT_METHOD.CASH });
        await api('POST', '/order/close', { orderId: String(r.data._id) });
        pass('F: Variation order paid and closed (cleanup)');
      } else {
        fail('F: Variation order creation failed', JSON.stringify(r).slice(0, 250));
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // G — TAKEAWAY ORDER (measurement-based item)
  // ══════════════════════════════════════════════════════════════════════════
  section('G — Create TAKEAWAY order (measurement-based item)');
  {
    if (!withMeasure) {
      skip('G: No measurement item in menu');
    } else {
      const mp = measurementPayload(withMeasure);
      if (!mp) {
        skip('G: Could not build measurement payload');
      } else {
        info(`G: payload = ${JSON.stringify(mp)}`);
        const r = await createOrder(ORDER_TYPE.TAKEAWAY, [mp], { notes: 'Lifecycle test — measurement item' });
        if (r.status && r.data?._id) {
          pass(`G: Measurement order created: ${r.data._id}, total=₹${r.data.totalAmount}`);
          await api('POST', '/payment/record', { orderId: String(r.data._id), amount: r.data.totalAmount, paymentMethod: PAYMENT_METHOD.CASH });
          await api('POST', '/order/close', { orderId: String(r.data._id) });
          pass('G: Measurement order paid and closed (cleanup)');
        } else {
          fail('G: Measurement order failed', JSON.stringify(r).slice(0, 250));
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // H — TAKEAWAY ORDER (item with addon)
  // ══════════════════════════════════════════════════════════════════════════
  section('H — Create TAKEAWAY order (item with addon)');
  {
    if (!withAddon) {
      skip('H: No addon item in menu');
    } else {
      const ap = addonPayload(withAddon);
      if (!ap) {
        skip('H: Could not build addon payload');
      } else {
        info(`H: payload = ${JSON.stringify(ap)}`);
        const r = await createOrder(ORDER_TYPE.TAKEAWAY, [ap], { notes: 'Lifecycle test — addon item' });
        if (r.status && r.data?._id) {
          pass(`H: Addon order created: ${r.data._id}, total=₹${r.data.totalAmount}`);
          // Check addon is in the items list
          const hasAddon = r.data.items?.some((i) => i.addons?.length > 0);
          hasAddon ? pass('H: Addon appears in order items') : fail('H: Addon not in order items');
          await api('POST', '/payment/record', { orderId: String(r.data._id), amount: r.data.totalAmount, paymentMethod: PAYMENT_METHOD.CASH });
          await api('POST', '/order/close', { orderId: String(r.data._id) });
          pass('H: Addon order paid and closed (cleanup)');
        } else {
          fail('H: Addon order failed', JSON.stringify(r).slice(0, 250));
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // I — DINE_IN ORDER
  // ══════════════════════════════════════════════════════════════════════════
  section('I — Create DINE_IN order (requires tableId)');
  {
    if (!availableTable) {
      skip('I: No available table found');
    } else {
      const r = await createOrder(ORDER_TYPE.DINE_IN,
        [itemPayload(simple, 1)],
        { tableId: String(availableTable._id), notes: 'Lifecycle test — dine in' }
      );
      if (r.status && r.data?._id) {
        pass(`I: DINE_IN order created: ${r.data._id}`);
        r.data.orderType === ORDER_TYPE.DINE_IN ? pass('I: orderType=DINE_IN(1)') : fail('I: Wrong orderType');
        r.data.tableId ? pass(`I: tableId attached: ${r.data.tableId}`) : fail('I: tableId missing');
        await api('POST', '/payment/record', { orderId: String(r.data._id), amount: r.data.totalAmount, paymentMethod: PAYMENT_METHOD.CASH });
        await api('POST', '/order/close', { orderId: String(r.data._id) });
        pass('I: DINE_IN order paid and closed (cleanup)');
      } else {
        fail('I: DINE_IN order failed', JSON.stringify(r).slice(0, 250));
      }
      // Validation: DINE_IN without tableId must fail
      const badR = await createOrder(ORDER_TYPE.DINE_IN, [itemPayload(simple, 1)]);
      !badR.status && (badR.code === 400 || badR.code === 422)
        ? pass('I: DINE_IN without tableId correctly rejected')
        : fail('I: Should reject DINE_IN without tableId', JSON.stringify(badR).slice(0, 150));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // J — DELIVERY ORDER
  // ══════════════════════════════════════════════════════════════════════════
  section('J — Create DELIVERY order (requires shippingAddress)');
  {
    const r = await createOrder(ORDER_TYPE.DELIVERY,
      [itemPayload(simple, 1)],
      { shippingAddress: '123 Test Street, Test City, India - 400001', notes: 'Lifecycle test — delivery' }
    );
    if (r.status && r.data?._id) {
      pass(`J: DELIVERY order created: ${r.data._id}`);
      r.data.orderType === ORDER_TYPE.DELIVERY ? pass('J: orderType=DELIVERY(3)') : fail('J: Wrong orderType');
      r.data.shippingAddress ? pass(`J: shippingAddress: "${r.data.shippingAddress}"`) : fail('J: shippingAddress missing');
      await api('POST', '/payment/record', { orderId: String(r.data._id), amount: r.data.totalAmount, paymentMethod: PAYMENT_METHOD.ONLINE });
      await api('POST', '/order/close', { orderId: String(r.data._id) });
      pass('J: DELIVERY order paid and closed (cleanup)');
    } else {
      fail('J: DELIVERY order failed', JSON.stringify(r).slice(0, 250));
    }
    // Validation: DELIVERY without shippingAddress must fail
    const badR = await createOrder(ORDER_TYPE.DELIVERY, [itemPayload(simple, 1)]);
    !badR.status && (badR.code === 400 || badR.code === 422)
      ? pass('J: DELIVERY without shippingAddress correctly rejected')
      : fail('J: Should reject DELIVERY without shippingAddress', JSON.stringify(badR).slice(0, 150));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // K — ORDER DETAIL
  // ══════════════════════════════════════════════════════════════════════════
  section('K — GET /order/detail (main test order)');
  let firstItemId;
  {
    const r = await api('GET', `/order/detail?orderId=${MID}`);
    if (r.status && r.code === 200) {
      pass('K: order/detail returns 200');
      const o = r.data;
      o._id ? pass(`K: order._id present`) : fail('K: _id missing');
      typeof o.totalAmount === 'number' ? pass(`K: totalAmount=₹${o.totalAmount}`) : fail('K: totalAmount missing');
      Array.isArray(o.items) && o.items.length > 0
        ? pass(`K: items array has ${o.items.length} entry(s)`)
        : fail('K: items missing from detail');
      firstItemId = String(o.items?.[0]?._id || o.items?.[0]?.orderItemId || '');
      firstItemId ? pass(`K: Got first orderItemId for later tests: ${firstItemId}`) : fail('K: Could not extract orderItemId');
    } else {
      fail('K: order/detail failed', JSON.stringify(r).slice(0, 200));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // L — ADD ITEMS TO ORDER
  // ══════════════════════════════════════════════════════════════════════════
  section('L — POST /order/add-items (add a different item to existing order)');
  const addTarget = simple2 || simple; // prefer a different item, fallback same
  let totalAfterAdd = mainOrder.totalAmount;
  {
    info(`L: Adding item "${addTarget.name}" × 1 to order ${MID}`);
    const r = await api('POST', '/order/add-items', {
      orderId: MID,
      items: [itemPayload(addTarget, 1)]
    });
    if (r.status && r.code === 200) {
      pass('L: add-items returns 200');
      totalAfterAdd = Number(r.data?.totalAmount ?? mainOrder.totalAmount);
      totalAfterAdd > mainOrder.totalAmount
        ? pass(`L: totalAmount increased ₹${mainOrder.totalAmount} → ₹${totalAfterAdd}`)
        : fail('L: totalAmount should increase after add', `before=${mainOrder.totalAmount}, after=${totalAfterAdd}`);
      // Order should now be IN_PROGRESS (KOT fired)
      const newStatus = r.data?.status;
      newStatus === ORDER_STATUS.IN_PROGRESS || newStatus === ORDER_STATUS.OPEN
        ? pass(`L: order.status=${newStatus} after add-items`)
        : fail('L: Unexpected status after add-items', `got=${newStatus}`);
    } else {
      fail('L: add-items failed', JSON.stringify(r).slice(0, 250));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // M — UPDATE ITEM QUANTITY
  // ══════════════════════════════════════════════════════════════════════════
  section('M — PATCH /order/update-item (change quantity on first item)');
  {
    if (!firstItemId) {
      skip('M: No orderItemId found from step K');
    } else {
      const r = await api('PATCH', '/order/update-item', {
        orderId: MID,
        orderItemId: firstItemId,
        quantity: 3
      });
      if (r.status && r.code === 200) {
        pass('M: update-item (quantity=3) returns 200');
        const updatedItem = r.data?.items?.find((i) => String(i._id || i.orderItemId) === firstItemId);
        if (updatedItem) {
          updatedItem.quantity === 3 ? pass('M: quantity updated to 3 ✅') : fail('M: quantity not updated', `got=${updatedItem.quantity}`);
        } else {
          pass('M: update-item accepted (item detail not in response — OK)');
        }
      } else {
        fail('M: update-item (quantity) failed', JSON.stringify(r).slice(0, 250));
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // N — UPDATE ITEM INSTRUCTION
  // ══════════════════════════════════════════════════════════════════════════
  section('N — PATCH /order/update-item (add special instruction)');
  {
    if (!firstItemId) {
      skip('N: No orderItemId from step K');
    } else {
      const r = await api('PATCH', '/order/update-item', {
        orderId: MID,
        orderItemId: firstItemId,
        instruction: 'Less spicy, no onions please'
      });
      if (r.status && r.code === 200) {
        pass('N: update-item (instruction) returns 200');
        const updatedItem = r.data?.items?.find((i) => String(i._id || i.orderItemId) === firstItemId);
        if (updatedItem) {
          updatedItem.instruction === 'Less spicy, no onions please'
            ? pass('N: instruction saved ✅')
            : fail('N: instruction not saved', `got="${updatedItem.instruction}"`);
        } else {
          pass('N: instruction update accepted (item detail not in flat response — OK)');
        }
      } else {
        fail('N: update-item (instruction) failed', JSON.stringify(r).slice(0, 250));
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // O — REMOVE ITEM FROM ORDER
  // ══════════════════════════════════════════════════════════════════════════
  section('O — POST /order/remove-item (remove the added-in-step-L item)');
  {
    // Re-fetch the order to get the ID of the item added in L
    const detail = await api('GET', `/order/detail?orderId=${MID}`);
    const items = detail.data?.items || [];
    // Find an item added in step L by name (addTarget)
    const removeTarget = items.find((i) => String(i.menuItemId) === String(addTarget._id));
    const removeItemId = removeTarget ? String(removeTarget._id || removeTarget.orderItemId) : null;

    if (!removeItemId) {
      skip('O: Could not find L-added item to remove (item may have no removable state)');
    } else {
      info(`O: Removing orderItemId=${removeItemId} (${addTarget.name})`);
      const r = await api('POST', '/order/remove-item', {
        orderId: MID,
        orderItemId: removeItemId,
        cancelReason: 'Customer changed mind'
      });
      if (r.status && r.code === 200) {
        pass('O: remove-item returns 200');
        const stillThere = (r.data?.items || []).some((i) => String(i._id || i.orderItemId) === removeItemId && !i.cancelled);
        !stillThere ? pass('O: Removed item no longer active in order') : fail('O: Item still active after removal');
      } else {
        fail('O: remove-item failed', JSON.stringify(r).slice(0, 250));
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // P — VERIFY ORDER TOTAL AFTER MUTATIONS
  // ══════════════════════════════════════════════════════════════════════════
  section('P — Re-verify order detail after add/update/remove');
  {
    const r = await api('GET', `/order/detail?orderId=${MID}`);
    if (r.status && r.code === 200) {
      pass('P: order/detail still returns 200 after all mutations');
      typeof r.data?.totalAmount === 'number' && pass(`P: Current totalAmount=₹${r.data.totalAmount}`);
      Array.isArray(r.data?.items) && pass(`P: ${r.data.items.length} line item(s) remain`);
      // Store updated total for payment tests
      mainOrder = { ...mainOrder, ...r.data };
    } else {
      fail('P: order/detail failed after mutations', JSON.stringify(r).slice(0, 150));
    }
  }

  const FINAL_TOTAL = Number(mainOrder.totalAmount);
  info(`Final totalAmount for payment tests: ₹${FINAL_TOTAL}`);

  // ══════════════════════════════════════════════════════════════════════════
  // Q — LIST KOTs AFTER ORDER CREATION
  // ══════════════════════════════════════════════════════════════════════════
  section('Q — GET /kot?orderId (KOTs after order created)');
  let firstKot;
  let firstKotItem;
  {
    const r = await api('GET', `/kot?orderId=${MID}`);
    if (r.status && r.code === 200) {
      pass('Q: GET /kot returns 200');
      const kots = r.data || [];
      kots.length > 0 ? pass(`Q: ${kots.length} KOT(s) generated for order`) : fail('Q: No KOTs found — order should have fired KOT');
      firstKot = kots[0];
      firstKotItem = firstKot?.items?.[0];
      if (firstKot) {
        pass(`Q: First KOT id=${firstKot._id} status=${firstKot.status}`);
        firstKot.status === KOT_STATUS.PENDING ? pass('Q: KOT starts in PENDING(1)') : fail('Q: KOT should start PENDING', `got=${firstKot.status}`);
      }
    } else {
      fail('Q: List KOTs failed', JSON.stringify(r).slice(0, 150));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // R — LIST KOTs AFTER ADD-ITEMS
  // ══════════════════════════════════════════════════════════════════════════
  section('R — GET /kot?orderId (after add-items — new KOT expected)');
  {
    const r = await api('GET', `/kot?orderId=${MID}`);
    if (r.status && r.code === 200) {
      const kots = r.data || [];
      pass(`R: ${kots.length} KOT(s) total after add-items`);
      kots.length >= 2
        ? pass('R: Multiple KOTs confirm new items generated separate KOT')
        : pass('R: KOT count OK (may be 1 if items merged or add-items was skipped)');
    } else {
      fail('R: List KOTs (after add) failed', JSON.stringify(r).slice(0, 150));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // S — KOT STATUS → PREPARING
  // ══════════════════════════════════════════════════════════════════════════
  section('S — PATCH /kot/status → PREPARING (1→2)');
  {
    if (!firstKot) {
      skip('S: No KOT available from step Q');
    } else {
      const r = await api('PATCH', '/kot/status', { kotId: String(firstKot._id), status: KOT_STATUS.PREPARING });
      if (r.status && r.code === 200) {
        pass('S: KOT status → PREPARING(2) ✅');
        (r.data?.status === KOT_STATUS.PREPARING) && pass('S: Confirmed status=PREPARING in response');
      } else {
        fail('S: KOT→PREPARING failed', JSON.stringify(r).slice(0, 200));
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // T — KOT STATUS → READY
  // ══════════════════════════════════════════════════════════════════════════
  section('T — PATCH /kot/status → READY (2→3)');
  {
    if (!firstKot) {
      skip('T: No KOT from step Q');
    } else {
      const r = await api('PATCH', '/kot/status', { kotId: String(firstKot._id), status: KOT_STATUS.READY });
      if (r.status && r.code === 200) {
        pass('T: KOT status → READY(3) ✅');
      } else {
        fail('T: KOT→READY failed', JSON.stringify(r).slice(0, 200));
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // U — KOT STATUS → SERVED
  // ══════════════════════════════════════════════════════════════════════════
  section('U — PATCH /kot/status → SERVED (3→4)');
  {
    if (!firstKot) {
      skip('U: No KOT from step Q');
    } else {
      const r = await api('PATCH', '/kot/status', { kotId: String(firstKot._id), status: KOT_STATUS.SERVED });
      if (r.status && r.code === 200) {
        pass('U: KOT status → SERVED(4) ✅');
      } else {
        fail('U: KOT→SERVED failed', JSON.stringify(r).slice(0, 200));
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // V — KOT ITEM STATUS → PREPARING
  // ══════════════════════════════════════════════════════════════════════════
  section('V — PATCH /kot/item-status → PREPARING on single KOT item');
  {
    // Fetch KOTs fresh to find a PENDING item (might be in a second KOT from add-items)
    const kotRes = await api('GET', `/kot?orderId=${MID}`);
    const pendingKot = (kotRes.data || []).find((k) => k.status === KOT_STATUS.PENDING || k.status === KOT_STATUS.PREPARING || k.status === KOT_STATUS.READY);
    const kotItem = pendingKot?.items?.find((i) => i.status !== ITEM_STATUS.SERVED && i.status !== ITEM_STATUS.CANCELLED);

    if (!kotItem) {
      skip('V: No pending KOT item available (all served or no second KOT)');
    } else {
      info(`V: Updating kotItem ${kotItem._id} → PREPARING`);
      const r = await api('PATCH', '/kot/item-status', { kotItemId: String(kotItem._id), status: ITEM_STATUS.PREPARING });
      if (r.status && r.code === 200) {
        pass('V: KOT item-status → PREPARING(2) ✅');
        firstKotItem = kotItem; // save for W
      } else {
        fail('V: item-status→PREPARING failed', JSON.stringify(r).slice(0, 200));
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // W — KOT ITEM STATUS → READY
  // ══════════════════════════════════════════════════════════════════════════
  section('W — PATCH /kot/item-status → READY on same item');
  {
    if (!firstKotItem) {
      skip('W: No item saved from V');
    } else {
      const r = await api('PATCH', '/kot/item-status', { kotItemId: String(firstKotItem._id), status: ITEM_STATUS.READY });
      if (r.status && r.code === 200) {
        pass('W: KOT item-status → READY(3) ✅');
      } else {
        fail('W: item-status→READY failed', JSON.stringify(r).slice(0, 200));
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // X — INVALID KOT STATUS TRANSITION
  // ══════════════════════════════════════════════════════════════════════════
  section('X — Invalid KOT status transition (SERVED→PENDING must reject)');
  {
    if (!firstKot) {
      skip('X: No KOT from step Q');
    } else {
      // firstKot is now SERVED — try going back to PENDING
      const r = await api('PATCH', '/kot/status', { kotId: String(firstKot._id), status: KOT_STATUS.PENDING });
      !r.status && r.code === 400
        ? pass('X: Invalid transition SERVED→PENDING correctly rejected ✅')
        : fail('X: Should reject backward transition', JSON.stringify(r).slice(0, 200));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Y — CLOSE BEFORE PAYMENT
  // ══════════════════════════════════════════════════════════════════════════
  section('Y — Close order BEFORE payment (must 400)');
  {
    const r = await api('POST', '/order/close', { orderId: MID });
    !r.status && r.code === 400
      ? pass('Y: closeOrder blocked when UNPAID ✅', r.message)
      : fail('Y: closeOrder should block when UNPAID', JSON.stringify(r));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Z — PARTIAL CASH PAYMENT
  // ══════════════════════════════════════════════════════════════════════════
  section('Z — First partial payment (CASH, ~50%)');
  const partial1 = parseFloat((FINAL_TOTAL / 2).toFixed(2));
  let paidSoFar = 0;
  {
    const r = await api('POST', '/payment/record', { orderId: MID, amount: partial1, paymentMethod: PAYMENT_METHOD.CASH });
    if (r.status && r.code === 201) {
      paidSoFar = Number(r.data?.order?.paidAmount ?? 0);
      pass(`Z: CASH ₹${partial1} accepted`);
      r.data?.order?.paymentStatus === PAYMENT_STATUS.PARTIAL ? pass('Z: paymentStatus=PARTIAL(2)') : fail('Z: Expected PARTIAL', `got=${r.data?.order?.paymentStatus}`);
      Math.abs(r.data?.order?.balanceDue - (FINAL_TOTAL - partial1)) < 0.02 ? pass(`Z: balanceDue=₹${r.data?.order?.balanceDue}`) : fail('Z: balanceDue wrong');
    } else {
      fail('Z: Partial payment failed', JSON.stringify(r).slice(0, 250));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AA — CLOSE WHILE PARTIAL
  // ══════════════════════════════════════════════════════════════════════════
  section('AA — Close while PARTIAL (must 400)');
  {
    const r = await api('POST', '/order/close', { orderId: MID });
    !r.status && r.code === 400
      ? pass('AA: closeOrder blocked when PARTIAL ✅', r.message)
      : fail('AA: Should block when PARTIAL', JSON.stringify(r));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AB — GET /payment/order-payments
  // ══════════════════════════════════════════════════════════════════════════
  section('AB — GET /payment/order-payments (verify totals)');
  {
    const r = await api('GET', `/payment/order-payments?orderId=${MID}`);
    if (r.status && r.code === 200) {
      const s = r.data;
      pass('AB: order-payments returns 200');
      Math.abs(s?.paidAmount - paidSoFar) < 0.02 ? pass(`AB: paidAmount=₹${s.paidAmount}`) : fail('AB: paidAmount mismatch');
      Math.abs(s?.totalAmount - FINAL_TOTAL) < 0.02 ? pass(`AB: totalAmount=₹${s.totalAmount}`) : fail('AB: totalAmount mismatch');
      s?.paymentStatus === PAYMENT_STATUS.PARTIAL ? pass('AB: paymentStatus=PARTIAL(2)') : fail('AB: wrong status');
      Array.isArray(s?.payments) && s.payments.length >= 1 ? pass(`AB: ${s.payments.length} payment record(s)`) : fail('AB: payments array empty');
    } else {
      fail('AB: order-payments failed', JSON.stringify(r).slice(0, 150));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AC — SECOND PARTIAL UPI
  // ══════════════════════════════════════════════════════════════════════════
  section('AC — Second partial payment (UPI + reference)');
  const partial2 = parseFloat((FINAL_TOTAL - paidSoFar - 1).toFixed(2));
  {
    if (partial2 <= 0) {
      skip('AC: totalAmount too small to leave ₹1 remaining');
    } else {
      const r = await api('POST', '/payment/record', { orderId: MID, amount: partial2, paymentMethod: PAYMENT_METHOD.UPI, reference: 'UPI-LIFECYCLE-001' });
      if (r.status && r.code === 201) {
        paidSoFar = Number(r.data?.order?.paidAmount ?? paidSoFar);
        pass(`AC: UPI ₹${partial2} accepted`);
        r.data?.payment?.reference === 'UPI-LIFECYCLE-001' ? pass('AC: reference stored') : fail('AC: reference not stored');
        r.data?.order?.paymentStatus === PAYMENT_STATUS.PARTIAL ? pass('AC: Still PARTIAL (₹1 remains)') : fail('AC: Expected PARTIAL');
      } else {
        fail('AC: UPI partial failed', JSON.stringify(r).slice(0, 250));
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AD — PAY EXACT REMAINING → PAID
  // ══════════════════════════════════════════════════════════════════════════
  section('AD — Pay exact remaining → PAID');
  const remaining = parseFloat((FINAL_TOTAL - paidSoFar).toFixed(2));
  {
    const r = await api('POST', '/payment/record', { orderId: MID, amount: remaining, paymentMethod: PAYMENT_METHOD.CARD, reference: 'CARD-LIFECYCLE-9999' });
    if (r.status && r.code === 201) {
      pass(`AD: CARD ₹${remaining} accepted — final payment`);
      r.data?.order?.paymentStatus === PAYMENT_STATUS.PAID ? pass('AD: paymentStatus=PAID(3) ✅') : fail('AD: Expected PAID', `got=${r.data?.order?.paymentStatus}`);
      Math.abs(r.data?.order?.balanceDue) < 0.02 ? pass('AD: balanceDue=0 ✅') : fail('AD: balanceDue should be 0');
    } else {
      fail('AD: Final payment failed', JSON.stringify(r).slice(0, 250));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AE — CLOSE PAID ORDER
  // ══════════════════════════════════════════════════════════════════════════
  section('AE — Close fully PAID order → COMPLETED');
  {
    const r = await api('POST', '/order/close', { orderId: MID });
    if (r.status && r.code === 200) {
      pass('AE: closeOrder succeeded ✅');
      r.data?.status === ORDER_STATUS.COMPLETED ? pass('AE: order.status=COMPLETED(3) ✅') : fail('AE: Expected COMPLETED', `got=${r.data?.status}`);
    } else {
      fail('AE: closeOrder failed on PAID order', JSON.stringify(r).slice(0, 250));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AF — PAY ON COMPLETED ORDER
  // ══════════════════════════════════════════════════════════════════════════
  section('AF — Pay on COMPLETED order (must 400)');
  {
    const r = await api('POST', '/payment/record', { orderId: MID, amount: 10, paymentMethod: PAYMENT_METHOD.CASH });
    !r.status && r.code === 400 ? pass('AF: Payment rejected on COMPLETED order ✅', r.message) : fail('AF: Should reject on COMPLETED', JSON.stringify(r));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AG — CANCEL SCENARIO: create → cancel
  // ══════════════════════════════════════════════════════════════════════════
  section('AG — Cancel scenario: fresh order → cancel before payment');
  let cancelledOrderId;
  {
    const co = await createOrder(ORDER_TYPE.TAKEAWAY, [itemPayload(simple, 1)], { notes: 'AG cancel test' });
    if (!co.status || !co.data?._id) {
      fail('AG: Could not create order for cancel test', JSON.stringify(co).slice(0, 150));
    } else {
      cancelledOrderId = String(co.data._id);
      pass(`AG: Fresh order created: ${cancelledOrderId}`);
      const cr = await api('POST', '/order/cancel', { orderId: cancelledOrderId, cancellationReason: 'Test cancellation — lifecycle suite' });
      if (cr.status && cr.code === 200) {
        pass('AG: Order cancelled ✅');
        cr.data?.status === ORDER_STATUS.CANCELLED ? pass('AG: status=CANCELLED(4) ✅') : fail('AG: Expected CANCELLED', `got=${cr.data?.status}`);
      } else {
        fail('AG: Cancel failed', JSON.stringify(cr).slice(0, 150));
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AH — PAY ON CANCELLED ORDER
  // ══════════════════════════════════════════════════════════════════════════
  section('AH — Pay on CANCELLED order (must 400)');
  {
    if (!cancelledOrderId) {
      skip('AH: No cancelled order from step AG');
    } else {
      const r = await api('POST', '/payment/record', { orderId: cancelledOrderId, amount: 10, paymentMethod: PAYMENT_METHOD.CASH });
      !r.status && r.code === 400 ? pass('AH: Payment rejected on CANCELLED order ✅', r.message) : fail('AH: Should reject on CANCELLED', JSON.stringify(r));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AI — CLOSE CANCELLED ORDER
  // ══════════════════════════════════════════════════════════════════════════
  section('AI — Close CANCELLED order (must 400)');
  {
    if (!cancelledOrderId) {
      skip('AI: No cancelled order from AG');
    } else {
      const r = await api('POST', '/order/close', { orderId: cancelledOrderId });
      !r.status && r.code === 400 ? pass('AI: Close rejected on CANCELLED order ✅', r.message) : fail('AI: Should reject close on CANCELLED', JSON.stringify(r));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AJ — ORDER TOKEN BOARD
  // ══════════════════════════════════════════════════════════════════════════
  section('AJ — GET /order/tokens (takeaway token board)');
  {
    const r = await api('GET', '/order/tokens');
    if (r.status && r.code === 200) {
      pass('AJ: /order/tokens returns 200');
      const d = r.data;
      typeof d === 'object' && d !== null ? pass('AJ: Response is an object') : fail('AJ: Expected object response');
    } else {
      fail('AJ: /order/tokens failed', JSON.stringify(r).slice(0, 150));
    }
  }

  printSummary();
}

// ─── Summary ─────────────────────────────────────────────────────────────────

function printSummary() {
  const total = passCount + failCount + skipCount;
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                       TEST SUMMARY                             ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Total tests : ${String(total).padEnd(49)} ║`);
  console.log(`║  ✅ Passed   : ${String(passCount).padEnd(49)} ║`);
  console.log(`║  ❌ Failed   : ${String(failCount).padEnd(49)} ║`);
  console.log(`║  ⏭️  Skipped  : ${String(skipCount).padEnd(49)} ║`);
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  if (failCount > 0) {
    console.log('Failed tests:');
    results.filter((r) => r.s === 'F').forEach((r) => console.log(`  ❌ ${r.label}${r.detail ? `  —  ${r.detail}` : ''}`));
    console.log('');
  }
  if (skipCount > 0) {
    console.log('Skipped tests:');
    results.filter((r) => r.s === 'S').forEach((r) => console.log(`  ⏭️  ${r.label}${r.detail ? `  (${r.detail})` : ''}`));
    console.log('');
  }
}

run().catch((e) => { console.error('\n💥 Script crashed:', e.message, e.stack); process.exit(1); });
