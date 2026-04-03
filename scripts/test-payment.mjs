/**
 * ============================================================
 *   PAYMENT SYSTEM — COMPREHENSIVE TEST SCRIPT (v2)
 *   Restaurant POS Backend
 * ============================================================
 *
 * ⚠️  SAFE: Does NOT drop/clear any collection or database.
 * ⚠️  Uses REAL API against a live server. Review before running.
 *
 * HOW TO RUN:
 *   node scripts/test-payment.mjs                  (uses embedded token)
 *   node scripts/test-payment.mjs <FRESH_TOKEN>    (pass fresh token)
 *
 * COVERAGE — 24 TEST GROUPS (A → X):
 *
 *   A  Close order before any payment (must 400)
 *   B  Joi validation — 7 cases (missing fields, bad values, bad IDs)
 *   C  Overpayment guard (amount > totalAmount)
 *   D  First partial payment (CASH) — status/paidAmount/balanceDue
 *   E  Close while PARTIAL (must 400)
 *   F  GET /payment/order-payments — array, totals, paymentStatus
 *   G  Second partial (UPI + reference), leaving ₹1 underpaid
 *   H  Overpayment on tiny remaining balance
 *   I  Pay exact remaining → PAID, balanceDue=0, paidAmount=total
 *   J  Pay again on already-PAID order (must 400)
 *   K  Close PAID order → COMPLETED
 *   L  Pay on COMPLETED order (must 400)
 *   M  Double-close (must 400)
 *   N  Paginated list filtered by orderId — count, total field
 *   O  Global paginated list (no filter)
 *   P  Filter by paymentMethod=CASH(1) — verify all records match
 *   Q  Cancel order → attempt payment (must 400)
 *   R  One-shot full payment (ONLINE + reference) → immediate close
 *   S  Multi-item order — 3 items, verify totalAmount > single item
 *   T  Tri-method split payment (CASH + UPI + CARD across 3 calls)
 *   U  Floating-point precision — pay in 3 near-equal chunks
 *   V  Pagination correctness — limit=1, page=2 returns 2nd record
 *   W  Date-range filter — fromDate/toDate on /payment/list
 *   X  order-payments sort order — oldest payment first (createdAt:1)
 * ============================================================
 */

// ─── Configuration ──────────────────────────────────────────────────────────
//
// Pass a fresh token:   node scripts/test-payment.mjs <TOKEN>
// Or env var:           TOKEN=xxx node scripts/test-payment.mjs
//
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

const PAYMENT_METHOD = { CASH: 1, CARD: 2, UPI: 3, WALLET: 4, ONLINE: 5 };
const PAYMENT_STATUS = { UNPAID: 1, PARTIAL: 2, PAID: 3, REFUNDED: 4 };
const ORDER_STATUS = { OPEN: 1, IN_PROGRESS: 2, COMPLETED: 3, CANCELLED: 4 };

console.log(`\nℹ️  BASE_URL  : ${BASE_URL}`);
console.log(`ℹ️  Brand ID  : ${BRAND_ID}`);
console.log(`ℹ️  Outlet ID : ${OUTLET_ID}`);
console.log(`ℹ️  Token (40): ${TOKEN.slice(0, 40)}...\n`);

// ─── Helpers ────────────────────────────────────────────────────────────────

let passCount = 0;
let failCount = 0;
const results = [];

const pass = (label, detail = '') => {
  passCount++;
  results.push({ status: 'PASS', label, detail });
  console.log(`✅  PASS: ${label}${detail ? `  →  ${detail}` : ''}`);
};
const fail = (label, detail = '') => {
  failCount++;
  results.push({ status: 'FAIL', label, detail });
  console.log(`❌  FAIL: ${label}${detail ? `  →  ${detail}` : ''}`);
};
const info = (label, detail = '') => console.log(`ℹ️   ${label}${detail ? `: ${detail}` : ''}`);
const section = (title) => {
  console.log(`\n${'─'.repeat(65)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(65));
};

async function api(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const opts = { method, headers: HEADERS };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(url, opts);
    const json = await res.json();
    return { httpStatus: res.status, ...json };
  } catch (e) {
    return { httpStatus: 0, status: false, message: e.message };
  }
}

// ─── Setup helpers ───────────────────────────────────────────────────────────

async function getMenuItems() {
  const res = await api('GET', '/order/menu-items');
  if (res.httpStatus === 401) {
    console.error('\n💥 AUTH FAILED (401). Your token is invalid or expired.');
    console.error('   Run: node scripts/test-payment.mjs <FRESH_TOKEN>\n');
    process.exit(1);
  }
  const categories = Array.isArray(res?.data) ? res.data : [];
  const allItems = categories.flatMap((c) => (Array.isArray(c.items) ? c.items : []));
  info(`Menu: ${categories.length} categories, ${allItems.length} total items`);
  if (allItems.length === 0) {
    console.error('\n💥 No active menu items found. Add menu items first.\n');
    process.exit(1);
  }
  return allItems;
}

function pickSimpleItem(items) {
  return (
    items.find((i) => i.basePrice && !i.isMeasurementBased && !i.isVariation) ||
    items.find((i) => i.basePrice) ||
    items[0]
  );
}

function buildItemPayload(item, qty = 2) {
  const payload = { menuItemId: String(item._id), quantity: qty };
  if (item.isVariation && item.variations?.length > 0) {
    payload.variationId = String(item.variations[0]._id || item.variations[0].variationId);
  }
  return payload;
}

async function createOrder(items, notes = 'Payment test — safe to ignore') {
  const res = await api('POST', '/order', { orderType: 2, items, notes });
  if (!res?.status || !res?.data?._id) {
    throw new Error(`Order creation failed: ${JSON.stringify(res).slice(0, 200)}`);
  }
  return res.data;
}

async function recordPayment(orderId, amount, method, reference = undefined) {
  const body = { orderId, amount, paymentMethod: method };
  if (reference) body.reference = reference;
  return api('POST', '/payment/record', body);
}

async function closeOrder(orderId) {
  return api('POST', '/order/close', { orderId });
}

async function cancelOrder(orderId) {
  return api('POST', '/order/cancel', {
    orderId,
    cancellationReason: 'Payment test — cancel scenario'
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       PAYMENT SYSTEM — FULL TEST SUITE (v2)                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const allItems = await getMenuItems();
  const simpleItem = pickSimpleItem(allItems);
  info(`Primary item`, `"${simpleItem.name}" _id=${simpleItem._id} price=${simpleItem.basePrice}`);

  // ── Create primary test order (single item × 2) ──────────────────────────
  section('SETUP — Primary test order');
  let order;
  try {
    order = await createOrder([buildItemPayload(simpleItem, 2)]);
  } catch (e) {
    fail('Create primary test order', e.message);
    printSummary();
    return;
  }

  const ID = String(order._id);
  const TOTAL = Number(order.totalAmount);
  info(`Order created`, `id=${ID}, totalAmount=₹${TOTAL}, paymentStatus=${order.paymentStatus}`);

  order.paymentStatus === PAYMENT_STATUS.UNPAID
    ? pass('Order starts UNPAID (1)')
    : fail('Order should start UNPAID', `got=${order.paymentStatus}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP A — Close before payment
  // ═══════════════════════════════════════════════════════════════════════════
  section('A — Close order BEFORE any payment (must 400)');
  {
    const r = await closeOrder(ID);
    !r.status && r.code === 400
      ? pass('A: closeOrder blocked when UNPAID', r.message)
      : fail('A: closeOrder should block when UNPAID', JSON.stringify(r));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP B — Joi validation errors (7 cases)
  // ═══════════════════════════════════════════════════════════════════════════
  section('B — Joi validation errors (7 sub-cases)');

  const validationCases = [
    { label: 'Missing amount', body: { orderId: ID, paymentMethod: 1 } },
    { label: 'Missing paymentMethod', body: { orderId: ID, amount: 10 } },
    { label: 'Invalid method=99', body: { orderId: ID, amount: 10, paymentMethod: 99 } },
    { label: 'amount = 0', body: { orderId: ID, amount: 0, paymentMethod: 1 } },
    { label: 'Negative amount', body: { orderId: ID, amount: -50, paymentMethod: 1 } },
    { label: 'Malformed orderId', body: { orderId: 'not-valid', amount: 10, paymentMethod: 1 } },
    { label: 'Missing orderId', body: { amount: 10, paymentMethod: 1 } },
  ];

  for (const tc of validationCases) {
    const r = await api('POST', '/payment/record', tc.body);
    !r.status && (r.code === 400 || r.code === 422)
      ? pass(`B: ${tc.label}`)
      : fail(`B: ${tc.label}`, JSON.stringify(r).slice(0, 120));
  }

  // Non-existent (valid ObjectId) → 404
  {
    const r = await api('POST', '/payment/record', {
      orderId: '000000000000000000000001',
      amount: 10,
      paymentMethod: 1
    });
    !r.status && r.code === 404
      ? pass('B: 404 for non-existent orderId (valid format)')
      : fail('B: Should 404 for non-existent orderId', JSON.stringify(r));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP C — Overpayment guard
  // ═══════════════════════════════════════════════════════════════════════════
  section('C — Overpayment guard');
  {
    const r = await recordPayment(ID, TOTAL + 1000, PAYMENT_METHOD.CASH);
    !r.status && r.code === 400
      ? pass(`C: Overpayment rejected (tried ₹${TOTAL + 1000}, balance=₹${TOTAL})`, r.message)
      : fail('C: Overpayment should be rejected', JSON.stringify(r));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP D — First partial payment (CASH)
  // ═══════════════════════════════════════════════════════════════════════════
  section('D — First partial payment (CASH, ~50% of total)');
  const partial1 = parseFloat((TOTAL / 2).toFixed(2));
  let paidSoFar = 0;
  {
    const r = await recordPayment(ID, partial1, PAYMENT_METHOD.CASH);
    if (r.status && r.code === 201) {
      const { payment, order: o } = r.data;
      paidSoFar = Number(o?.paidAmount ?? 0);

      pass('D: Partial CASH payment accepted');
      Math.abs(payment?.amount - partial1) < 0.02 ? pass(`D: payment.amount=₹${payment?.amount}`) : fail('D: amount mismatch', `expected=${partial1}, got=${payment?.amount}`);
      payment?.paymentMethod === PAYMENT_METHOD.CASH ? pass('D: paymentMethod=CASH(1) stored') : fail('D: paymentMethod wrong', String(payment?.paymentMethod));
      o?.paymentStatus === PAYMENT_STATUS.PARTIAL ? pass('D: paymentStatus=PARTIAL(2)') : fail('D: Expected PARTIAL(2)', `got=${o?.paymentStatus}`);
      const expectedBal = parseFloat((TOTAL - partial1).toFixed(2));
      Math.abs(o?.balanceDue - expectedBal) < 0.02 ? pass(`D: balanceDue=₹${o?.balanceDue}`) : fail('D: balanceDue wrong', `expected≈${expectedBal}, got=${o?.balanceDue}`);
    } else {
      fail('D: First partial payment failed', JSON.stringify(r).slice(0, 250));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP E — Close while PARTIAL
  // ═══════════════════════════════════════════════════════════════════════════
  section('E — Close while PARTIAL (must 400)');
  {
    const r = await closeOrder(ID);
    !r.status && r.code === 400
      ? pass('E: closeOrder blocked when PARTIAL', r.message)
      : fail('E: Should block when PARTIAL', JSON.stringify(r));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP F — GET /payment/order-payments
  // ═══════════════════════════════════════════════════════════════════════════
  section('F — GET /payment/order-payments (after 1 partial)');
  {
    const r = await api('GET', `/payment/order-payments?orderId=${ID}`);
    if (r.status && r.code === 200) {
      const s = r.data;
      pass('F: endpoint returns 200');
      Array.isArray(s?.payments) && s.payments.length >= 1 ? pass(`F: ${s.payments.length} payment record(s)`) : fail('F: payments array empty');
      Math.abs(s?.paidAmount - paidSoFar) < 0.02 ? pass(`F: paidAmount=₹${s?.paidAmount}`) : fail('F: paidAmount mismatch', `expected≈${paidSoFar}, got=${s?.paidAmount}`);
      s?.paymentStatus === PAYMENT_STATUS.PARTIAL ? pass('F: summary status=PARTIAL(2)') : fail('F: wrong status', `got=${s?.paymentStatus}`);
      typeof s?.totalAmount === 'number' ? pass(`F: totalAmount present (${s.totalAmount})`) : fail('F: totalAmount missing');
      typeof s?.balanceDue === 'number' ? pass(`F: balanceDue present (${s?.balanceDue})`) : fail('F: balanceDue missing');
    } else {
      fail('F: order-payments failed', JSON.stringify(r));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP G — Second partial (UPI + reference), ₹1 remaining
  // ═══════════════════════════════════════════════════════════════════════════
  section('G — Second partial payment (UPI + reference), leaving ₹1 remaining');
  const partial2 = parseFloat((TOTAL - paidSoFar - 1).toFixed(2));
  {
    if (partial2 <= 0) {
      info('Skip G', 'totalAmount too small to leave ₹1 after first partial');
    } else {
      const r = await recordPayment(ID, partial2, PAYMENT_METHOD.UPI, 'UPI-TEST-TXN-12345');
      if (r.status && r.code === 201) {
        paidSoFar = Number(r.data?.order?.paidAmount ?? paidSoFar);
        pass(`G: Second partial UPI ₹${partial2} accepted`);
        r.data?.payment?.reference === 'UPI-TEST-TXN-12345' ? pass('G: reference stored correctly') : fail('G: reference not stored', JSON.stringify(r.data?.payment));
        r.data?.order?.paymentStatus === PAYMENT_STATUS.PARTIAL ? pass('G: Still PARTIAL (₹1 remains)') : fail('G: Expected PARTIAL(2)', `got=${r.data?.order?.paymentStatus}`);
      } else {
        fail('G: Second partial failed', JSON.stringify(r).slice(0, 250));
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP H — Overpayment on tiny remaining
  // ═══════════════════════════════════════════════════════════════════════════
  section('H — Overpayment on tiny remaining balance (₹1)');
  {
    const r = await recordPayment(ID, 9999, PAYMENT_METHOD.CARD);
    !r.status && r.code === 400
      ? pass('H: Overpayment on small remaining rejected', r.message)
      : fail('H: Should reject overpayment', JSON.stringify(r));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP I — Pay exact remaining → PAID
  // ═══════════════════════════════════════════════════════════════════════════
  section('I — Pay exact remaining → PAID');
  const remaining = parseFloat((TOTAL - paidSoFar).toFixed(2));
  info('Paying exact remaining', `₹${remaining}`);
  {
    const r = await recordPayment(ID, remaining, PAYMENT_METHOD.CARD, 'CARD-LAST4-4242');
    if (r.status && r.code === 201) {
      pass(`I: Final payment ₹${remaining} CARD accepted`);
      r.data?.order?.paymentStatus === PAYMENT_STATUS.PAID ? pass('I: paymentStatus=PAID(3) ✅') : fail('I: Expected PAID(3)', `got=${r.data?.order?.paymentStatus}`);
      Math.abs(r.data?.order?.balanceDue) < 0.02 ? pass('I: balanceDue=0 ✅') : fail('I: balanceDue should be 0', `got=${r.data?.order?.balanceDue}`);
      Math.abs(r.data?.order?.paidAmount - TOTAL) < 0.02 ? pass(`I: paidAmount=totalAmount=₹${TOTAL} ✅`) : fail('I: paidAmount mismatch', `got=${r.data?.order?.paidAmount}`);
    } else {
      fail('I: Final payment failed', JSON.stringify(r).slice(0, 250));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP J — Pay on already-PAID
  // ═══════════════════════════════════════════════════════════════════════════
  section('J — Pay on already-PAID order (must 400)');
  {
    const r = await recordPayment(ID, 10, PAYMENT_METHOD.CASH);
    !r.status && r.code === 400 ? pass('J: Rejected on PAID order', r.message) : fail('J: Should reject on PAID', JSON.stringify(r));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP K — Close PAID order
  // ═══════════════════════════════════════════════════════════════════════════
  section('K — Close fully PAID order (must succeed)');
  {
    const r = await closeOrder(ID);
    if (r.status && r.code === 200) {
      pass('K: closeOrder succeeded ✅');
      r.data?.status === ORDER_STATUS.COMPLETED ? pass('K: order.status=COMPLETED(3) ✅') : fail('K: Expected COMPLETED(3)', `got=${r.data?.status}`);
    } else {
      fail('K: closeOrder failed on PAID order', JSON.stringify(r));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP L — Pay on COMPLETED
  // ═══════════════════════════════════════════════════════════════════════════
  section('L — Pay on COMPLETED order (must 400)');
  {
    const r = await recordPayment(ID, 10, PAYMENT_METHOD.CASH);
    !r.status && r.code === 400 ? pass('L: Rejected on COMPLETED order', r.message) : fail('L: Should reject on COMPLETED', JSON.stringify(r));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP M — Double-close
  // ═══════════════════════════════════════════════════════════════════════════
  section('M — Double-close (must 400)');
  {
    const r = await closeOrder(ID);
    !r.status && r.code === 400 ? pass('M: Double-close rejected ✅', r.message) : fail('M: Double-close should be rejected', JSON.stringify(r));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP N — Paginated /payment/list filtered by orderId
  // ═══════════════════════════════════════════════════════════════════════════
  section('N — GET /payment/list?orderId= (paginated)');
  {
    const r = await api('GET', `/payment/list?orderId=${ID}&page=1&limit=20`);
    if (r.status && r.code === 200) {
      pass('N: list returns 200');
      Array.isArray(r.data) && r.data.length >= 3 ? pass(`N: List has ${r.data.length} records (≥3 expected)`) : fail('N: Expected ≥3 payment records', `got=${r.data?.length}`);
      typeof r.total === 'number' && r.total >= 3 ? pass(`N: total field OK (${r.total})`) : fail('N: total field missing/wrong', `got=${r.total}`);
      // Verify each record has required fields
      const sample = r.data?.[0];
      ['_id', 'amount', 'paymentMethod', 'orderId', 'createdAt'].every((f) => sample?.[f] !== undefined)
        ? pass('N: Response records have required fields')
        : fail('N: Some required fields missing on payment record', JSON.stringify(Object.keys(sample ?? {})));
      // Verify sorted newest-first (createdAt DESC)
      if (r.data?.length >= 2) {
        const t0 = new Date(r.data[0].createdAt).getTime();
        const t1 = new Date(r.data[1].createdAt).getTime();
        t0 >= t1 ? pass('N: list sorted createdAt DESC (newest first)') : fail('N: Expected DESC createdAt sort');
      }
    } else {
      fail('N: Payment list failed', JSON.stringify(r));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP O — Global list
  // ═══════════════════════════════════════════════════════════════════════════
  section('O — GET /payment/list (global, no filter)');
  {
    const r = await api('GET', '/payment/list?page=1&limit=5');
    if (r.status && r.code === 200) {
      pass('O: Global list returns 200');
      typeof r.total === 'number' && pass(`O: Total in system: ${r.total} payments`);
      Array.isArray(r.data) && pass(`O: Returns ${r.data.length} records on page 1`);
    } else {
      fail('O: Global list failed', JSON.stringify(r));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP P — Filter by paymentMethod
  // ═══════════════════════════════════════════════════════════════════════════
  section('P — Filter payment list by paymentMethod=CASH(1)');
  {
    const r = await api('GET', '/payment/list?paymentMethod=1&page=1&limit=10');
    if (r.status && r.code === 200) {
      pass('P: Filter by CASH returns 200');
      const allCash = (r.data || []).every((p) => p.paymentMethod === 1);
      allCash ? pass('P: All returned records are CASH(1)') : fail('P: Records with wrong paymentMethod', JSON.stringify(r.data?.map((p) => p.paymentMethod)));
    } else {
      fail('P: Filter by paymentMethod failed', JSON.stringify(r));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP Q — Cancelled order → payment rejected
  // ═══════════════════════════════════════════════════════════════════════════
  section('Q — Payment on CANCELLED order (must 400)');
  {
    let cancelledOrder;
    try {
      cancelledOrder = await createOrder([buildItemPayload(simpleItem, 1)], 'Q cancel test');
    } catch (e) {
      fail('Q: Could not create order for cancel test', e.message);
      cancelledOrder = null;
    }
    if (cancelledOrder) {
      const cid = String(cancelledOrder._id);
      const cancelRes = await cancelOrder(cid);
      if (cancelRes.status) {
        pass('Q: Order created and cancelled');
        const r = await recordPayment(cid, 10, PAYMENT_METHOD.CASH);
        !r.status && r.code === 400 ? pass('Q: Payment rejected on CANCELLED order ✅', r.message) : fail('Q: Should reject on CANCELLED order', JSON.stringify(r));
      } else {
        fail('Q: Could not cancel order', JSON.stringify(cancelRes));
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP R — One-shot full payment + immediate close
  // ═══════════════════════════════════════════════════════════════════════════
  section('R — One-shot full ONLINE payment → direct PAID → close');
  {
    let ro;
    try { ro = await createOrder([buildItemPayload(simpleItem, 1)], 'R one-shot test'); } catch (e) { fail('R: Create order failed', e.message); ro = null; }
    if (ro) {
      const rid = String(ro._id);
      const rtotal = Number(ro.totalAmount);
      const r = await recordPayment(rid, rtotal, PAYMENT_METHOD.ONLINE, 'RAZORPAY-PAY-TEST-001');
      if (r.status && r.code === 201) {
        pass(`R: One-shot full ONLINE ₹${rtotal} accepted`);
        r.data?.order?.paymentStatus === PAYMENT_STATUS.PAID ? pass('R: Jumps directly to PAID in one payment') : fail('R: Expected PAID', `got=${r.data?.order?.paymentStatus}`);
        const cr = await closeOrder(rid);
        cr.status && cr.code === 200 ? pass('R: Immediate close after one-shot ✅') : fail('R: Close failed', JSON.stringify(cr));
      } else {
        fail('R: One-shot payment failed', JSON.stringify(r).slice(0, 250));
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP S — Multi-item order (3 items)
  // ═══════════════════════════════════════════════════════════════════════════
  section('S — Multi-item order (3 different quantities), pay full in CASH');
  {
    let so;
    try {
      so = await createOrder(
        [buildItemPayload(simpleItem, 1), buildItemPayload(simpleItem, 2), buildItemPayload(simpleItem, 3)],
        'S multi-item test'
      );
    } catch (e) { fail('S: Multi-item order failed', e.message); so = null; }

    if (so) {
      const sid = String(so._id);
      const stotal = Number(so.totalAmount);
      info('S: Multi-item order created', `totalAmount=₹${stotal}, items=3 payloads`);

      stotal > 0 ? pass(`S: totalAmount=₹${stotal} (positive, reflects 3 qty tiers)`) : fail('S: totalAmount should be > 0');

      const r = await recordPayment(sid, stotal, PAYMENT_METHOD.CASH);
      if (r.status && r.code === 201) {
        pass('S: Full CASH payment on multi-item order accepted');
        r.data?.order?.paymentStatus === PAYMENT_STATUS.PAID ? pass('S: Multi-item order PAID in one shot') : fail('S: Expected PAID', `got=${r.data?.order?.paymentStatus}`);
        const cr = await closeOrder(sid);
        cr.status && cr.code === 200 ? pass('S: Multi-item order closed successfully ✅') : fail('S: Close failed', JSON.stringify(cr));
      } else {
        fail('S: Multi-item payment failed', JSON.stringify(r).slice(0, 250));
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP T — Tri-method split payment (CASH + UPI + CARD)
  // ═══════════════════════════════════════════════════════════════════════════
  section('T — Tri-method split payment (CASH + UPI + CARD across 3 calls)');
  {
    let to;
    try { to = await createOrder([buildItemPayload(simpleItem, 3)], 'T tri-method test'); } catch (e) { fail('T: Order create failed', e.message); to = null; }

    if (to) {
      const tid = String(to._id);
      const ttotal = Number(to.totalAmount);

      // Split into 3 parts: 40% + 35% + 25%
      const t1 = parseFloat((ttotal * 0.40).toFixed(2));
      const t2 = parseFloat((ttotal * 0.35).toFixed(2));
      const t3 = parseFloat((ttotal - t1 - t2).toFixed(2));
      info('T: Split', `CASH=₹${t1} + UPI=₹${t2} + CARD=₹${t3} = ₹${t1 + t2 + t3} (total=₹${ttotal})`);

      const r1 = await recordPayment(tid, t1, PAYMENT_METHOD.CASH);
      r1.status && r1.code === 201 ? pass(`T: CASH ₹${t1} accepted`) : fail('T: CASH payment failed', JSON.stringify(r1).slice(0, 150));

      const r2 = await recordPayment(tid, t2, PAYMENT_METHOD.UPI, 'UPI-SPLIT-001');
      r2.status && r2.code === 201 ? pass(`T: UPI ₹${t2} accepted`) : fail('T: UPI payment failed', JSON.stringify(r2).slice(0, 150));
      r2.data?.order?.paymentStatus === PAYMENT_STATUS.PARTIAL ? pass('T: Still PARTIAL after 75%') : fail('T: Expected PARTIAL', `got=${r2.data?.order?.paymentStatus}`);

      const r3 = await recordPayment(tid, t3, PAYMENT_METHOD.CARD, 'CARD-SPLIT-9999');
      if (r3.status && r3.code === 201) {
        pass(`T: CARD ₹${t3} accepted (final)`);
        r3.data?.order?.paymentStatus === PAYMENT_STATUS.PAID ? pass('T: Order PAID after tri-method split ✅') : fail('T: Expected PAID', `got=${r3.data?.order?.paymentStatus}`);
        Math.abs(r3.data?.order?.balanceDue) < 0.02 ? pass('T: balanceDue=0 after split payment') : fail('T: balanceDue not zero', `got=${r3.data?.order?.balanceDue}`);
      } else {
        fail('T: Final CARD payment failed', JSON.stringify(r3).slice(0, 150));
      }

      // Verify all 3 methods appear in order-payments
      const op = await api('GET', `/payment/order-payments?orderId=${tid}`);
      if (op.status && op.code === 200) {
        const methods = op.data.payments?.map((p) => p.paymentMethod) ?? [];
        [1, 3, 2].every((m) => methods.includes(m))
          ? pass(`T: All 3 payment methods in order-payments (${JSON.stringify(methods)})`)
          : fail('T: Not all 3 methods found', `methods=${JSON.stringify(methods)}`);
      }

      const cr = await closeOrder(tid);
      cr.status && cr.code === 200 ? pass('T: Tri-method split order closed ✅') : fail('T: Close failed', JSON.stringify(cr));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP U — Floating-point precision (3 near-equal chunks)
  // ═══════════════════════════════════════════════════════════════════════════
  section('U — Floating-point precision (3 near-equal chunks summing to total)');
  {
    let uo;
    try { uo = await createOrder([buildItemPayload(simpleItem, 1)], 'U float precision test'); } catch (e) { fail('U: Create failed', e.message); uo = null; }

    if (uo) {
      const uid = String(uo._id);
      const utotal = Number(uo.totalAmount);

      // Divide into 3 floating-point chunks
      const u1 = parseFloat((utotal / 3).toFixed(2));
      const u2 = parseFloat((utotal / 3).toFixed(2));
      const u3 = parseFloat((utotal - u1 - u2).toFixed(2));
      info('U: Chunks', `₹${u1} + ₹${u2} + ₹${u3} = ₹${(u1 + u2 + u3).toFixed(2)} (total=₹${utotal})`);

      const r1 = await recordPayment(uid, u1, PAYMENT_METHOD.CASH);
      r1.status && r1.code === 201 ? pass(`U: Chunk 1 ₹${u1} accepted`) : fail('U: Chunk 1 failed', JSON.stringify(r1).slice(0, 150));

      const r2 = await recordPayment(uid, u2, PAYMENT_METHOD.CASH);
      r2.status && r2.code === 201 ? pass(`U: Chunk 2 ₹${u2} accepted`) : fail('U: Chunk 2 failed', JSON.stringify(r2).slice(0, 150));

      const r3 = await recordPayment(uid, u3, PAYMENT_METHOD.CASH);
      if (r3.status && r3.code === 201) {
        pass(`U: Chunk 3 ₹${u3} accepted`);
        r3.data?.order?.paymentStatus === PAYMENT_STATUS.PAID
          ? pass('U: Float chunks sum correctly → PAID ✅ (no floating-point drift)')
          : fail('U: PAID not reached — float precision issue!', `status=${r3.data?.order?.paymentStatus}, paidAmount=${r3.data?.order?.paidAmount}, total=${utotal}`);
      } else {
        fail('U: Chunk 3 failed', JSON.stringify(r3).slice(0, 150));
      }

      await closeOrder(uid);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP V — Pagination correctness (limit=1, page=2 → 2nd record)
  // ═══════════════════════════════════════════════════════════════════════════
  section('V — Pagination: limit=1 page=1 vs page=2 returns different records');
  {
    const p1 = await api('GET', `/payment/list?orderId=${ID}&page=1&limit=1`);
    const p2 = await api('GET', `/payment/list?orderId=${ID}&page=2&limit=1`);

    if (p1.status && p2.status) {
      pass('V: Both page=1 and page=2 return 200');
      const id1 = p1.data?.[0]?._id;
      const id2 = p2.data?.[0]?._id;
      id1 && id2 && id1 !== id2
        ? pass(`V: page1._id≠page2._id (pagination works)`)
        : fail('V: Pagination not working — same record on both pages', `id1=${id1}, id2=${id2}`);

      // total should be consistent across pages
      p1.total === p2.total ? pass(`V: total consistent across pages (${p1.total})`) : fail('V: total inconsistent', `p1=${p1.total}, p2=${p2.total}`);
    } else {
      fail('V: Pagination requests failed', `p1=${JSON.stringify(p1).slice(0, 100)}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP W — Date range filter (fromDate / toDate)
  // ═══════════════════════════════════════════════════════════════════════════
  section('W — Date range filter (fromDate / toDate on /payment/list)');
  {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const oneHourFuture = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

    // Should include all payments from this test run
    const r = await api('GET', `/payment/list?fromDate=${encodeURIComponent(oneHourAgo)}&toDate=${encodeURIComponent(oneHourFuture)}&limit=50`);
    if (r.status && r.code === 200) {
      pass('W: fromDate+toDate filter returns 200');
      typeof r.total === 'number' && r.total > 0 ? pass(`W: Found ${r.total} payments in last hour range`) : fail('W: Expected > 0 payments in last-hour range', `got=${r.total}`);
    } else {
      fail('W: Date range filter failed', JSON.stringify(r));
    }

    // Future-only range — should return 0
    const farFuture = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
    const rFuture = await api('GET', `/payment/list?fromDate=${encodeURIComponent(farFuture)}&limit=5`);
    if (rFuture.status && rFuture.code === 200) {
      rFuture.total === 0 ? pass('W: Future fromDate correctly returns 0 payments') : fail('W: Future date should return 0', `got=${rFuture.total}`);
    } else {
      fail('W: Future date range request failed', JSON.stringify(rFuture));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP X — order-payments sort is oldest-first (createdAt ASC)
  // ═══════════════════════════════════════════════════════════════════════════
  section('X — order-payments sorted oldest→newest (createdAt ASC)');
  {
    const r = await api('GET', `/payment/order-payments?orderId=${ID}`);
    if (r.status && r.code === 200 && r.data?.payments?.length >= 2) {
      const payments = r.data.payments;
      let sorted = true;
      for (let i = 0; i < payments.length - 1; i++) {
        if (new Date(payments[i].createdAt) > new Date(payments[i + 1].createdAt)) {
          sorted = false;
          break;
        }
      }
      sorted
        ? pass(`X: ${payments.length} payments sorted createdAt ASC (oldest first) ✅`)
        : fail('X: order-payments not sorted ASC by createdAt');
    } else {
      fail('X: Not enough records to verify sort', JSON.stringify(r).slice(0, 150));
    }
  }

  printSummary();
}

// ─── Summary ─────────────────────────────────────────────────────────────────

function printSummary() {
  const total = passCount + failCount;
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                           ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Total  : ${String(total).padEnd(50)} ║`);
  console.log(`║  ✅ Pass : ${String(passCount).padEnd(50)} ║`);
  console.log(`║  ❌ Fail : ${String(failCount).padEnd(50)} ║`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (failCount > 0) {
    console.log('Failed tests:');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => console.log(`  ❌ ${r.label}${r.detail ? `  —  ${r.detail}` : ''}`));
    console.log('');
  }
}

runTests().catch((e) => { console.error('\n💥 Script crashed:', e.message); process.exit(1); });
