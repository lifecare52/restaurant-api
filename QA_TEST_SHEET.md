# Tax Rollout QA Sheet

Use this sheet for shared manual verification across:

- `restaurant-api`
- `restraurent-ui`

Status legend:

- `[ ]` Not started
- `[~]` In progress
- `[x]` Passed
- `[!]` Failed / needs fix

## A. Cart Preview

- [ ] Add a simple taxable item and verify preview `subtotal`, `taxAmount`, and `totalAmount`
- [ ] Add a non-tax item and verify preview tax stays `0`
- [ ] Add a category-tax-group item and verify item tax resolves through category fallback
- [ ] Add a variation item and verify preview totals recalculate correctly
- [ ] Add an addon item and verify addon value contributes to tax preview
- [ ] Add a measurement item and verify preview totals are correct
- [ ] Change quantity and verify preview refreshes automatically
- [ ] Remove item and verify preview refreshes automatically
- [ ] Switch `Dine In` to `Takeaway` and verify applicable taxes change
- [ ] Verify preview failure state does not break cart summary UI

Expected invariants:

- [ ] Preview `taxBreakup` sum equals preview `taxAmount`
- [ ] Preview `totalAmount` matches displayed payable amount

## B. Order Creation

- [ ] Create an order from a cart with tax
- [ ] Verify created order detail `subtotal` matches preview subtotal
- [ ] Verify created order detail `taxAmount` matches preview tax amount
- [ ] Verify created order detail `totalAmount` matches preview total
- [ ] Verify order detail includes `taxBreakup`
- [ ] Verify order items contain `appliedTaxes`
- [ ] Verify order list shows correct `totalAmount`
- [ ] Verify order list shows correct `taxAmount`

## C. Existing Order Mutation

- [ ] Add items to an existing open order and verify totals rebuild correctly
- [ ] Increase quantity of a pending item and verify totals rebuild correctly
- [ ] Decrease quantity of a pending item and verify totals rebuild correctly
- [ ] Cancel a pending item and verify totals rebuild correctly
- [ ] Verify cancelling a served item is blocked
- [ ] Verify mutation responses show updated tax-aware totals

Expected invariants:

- [ ] Order `taxBreakup` sum equals order `taxAmount` after each mutation
- [ ] Order `totalAmount` reflects item mutations without stale values

## D. Order Details And Billing UI

- [ ] Verify order details page shows `subtotal`
- [ ] Verify order details page shows `taxableAmount`
- [ ] Verify order details page shows `taxAmount`
- [ ] Verify order details page shows `taxBreakup`
- [ ] Verify payment status label is correct
- [ ] Verify order status label is correct

## E. Bill Print / Receipt

- [ ] Print bill from orders list
- [ ] Print bill from order details page
- [ ] Verify bill contains all ordered items
- [ ] Verify bill contains addon details where applicable
- [ ] Verify bill contains `subtotal`
- [ ] Verify bill contains `taxableAmount`
- [ ] Verify bill contains `taxAmount`
- [ ] Verify bill contains tax breakup rows
- [ ] Verify bill contains `discountAmount`
- [ ] Verify bill contains final `totalAmount`

## F. Reports

- [ ] Open reports page and load sales report
- [ ] Verify date filter refresh works
- [ ] Verify tax total appears in summary cards
- [ ] Verify sales summary table shows tax and discount values
- [ ] Verify top items table loads correctly
- [ ] Compare one completed order's `taxAmount` with report aggregation manually
- [ ] Verify historical/older orders do not crash reports when tax fields are missing

## G. Regression Checks

- [ ] KOT print still works
- [ ] Order detail page still loads for old orders
- [ ] Orders list page still loads
- [ ] Report page still loads
- [ ] Frontend build/type-check passes
- [ ] Backend build/type-check passes

## Automated Checks Run By Codex

- [x] Backend tax engine smoke test passed
- [x] Backend TypeScript compile passed
- [x] Frontend bill HTML generation smoke test passed
- [x] Frontend TypeScript app check passed

## H. Suggested Test Data Matrix

- [ ] Item with percentage exclusive tax
- [ ] Item with percentage inclusive tax
- [ ] Item with flat exclusive charge
- [ ] Item with multiple taxes in one group
- [ ] Item with no tax group
- [ ] Category-level tax fallback item
- [ ] Variation + addon item
- [ ] Measurement-based item
- [ ] Mixed cart with taxable and non-taxable items
