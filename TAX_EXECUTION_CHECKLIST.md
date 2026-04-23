# Tax Execution Checklist

This checklist tracks the approved fullstack rollout for tax-aware billing across:

- `restaurant-api`
- `restraurent-ui`

Locked business decisions:

- Discount is applied before tax
- V1 supports percentage inclusive, percentage exclusive, and flat exclusive taxes
- V1 does not support flat inclusive tax
- Frontend will not be the source of truth for tax arithmetic
- Frontend billing totals will come from backend preview/final order responses

## Phase 1: Specification And Contract Freeze

### `restaurant-api`

- [ ] Document tax source priority: `MenuItem.taxGroupId > Category.taxGroupId`
- [ ] Document tax applicability by order type
- [ ] Document inclusive/exclusive rules
- [ ] Document cumulative vs standard behavior
- [ ] Document discount allocation rule
- [ ] Define order-level tax response contract
- [ ] Define item-level tax snapshot contract

### `restraurent-ui`

- [ ] Audit current cart, order, and invoice screens
- [ ] Identify all local total/tax calculations
- [ ] Identify all screens that render subtotal/discount/total
- [ ] Confirm summary UI for tax breakup and inclusive labels

## Phase 2: Data Model Foundation

### `restaurant-api`

- [x] Add order-level tax snapshot fields to `Order` type/schema
- [x] Add line-level tax snapshot fields to `OrderItem` type/schema
- [ ] Add preview response interfaces
- [ ] Keep all new fields backward compatible with existing records

### `restraurent-ui`

- [x] Extend order interfaces with tax-aware summary fields
- [x] Extend item interfaces with applied tax snapshot fields
- [ ] Add preview response interfaces for billing summary
- [ ] Prepare mock payloads for new billing responses

## Phase 3: Tax Engine

### `restaurant-api`

- [x] Add `tax-calculation.types.ts`
- [x] Add `tax-calculation.service.ts`
- [x] Implement line tax calculation
- [x] Implement order tax aggregation
- [x] Implement discount allocation before tax
- [ ] Add rounding helpers

### `restraurent-ui`

- [x] Build display-only summary models
- [ ] Mark local tax arithmetic service as deprecated
- [ ] Prepare reusable components for tax summary rendering

## Phase 4: Tax Resolution And Preview

### `restaurant-api`

- [x] Add `tax-resolution.service.ts`
- [x] Resolve effective tax group with item/category fallback
- [x] Filter by active/deleted/order-type rules
- [x] Add tax preview endpoint

### `restraurent-ui`

- [x] Add preview endpoint API wiring
- [x] Integrate preview endpoint into cart flow
- [x] Refresh preview on item, quantity, addon, and order-type changes
- [x] Handle loading and preview-failure states

## Phase 5: Create Order Tax Integration

### `restaurant-api`

- [x] Refactor `createOrder` to use the tax engine
- [x] Persist order-level tax totals and breakup
- [x] Persist line-level applied tax snapshots

### `restraurent-ui`

- [ ] Remove local draft total assumptions from order placement flow
- [ ] Hydrate checkout summary from backend response
- [ ] Render final tax breakup after order creation

## Phase 6: Existing Order Mutation Recalculation

### `restaurant-api`

- [x] Add centralized `recalculatePersistedOrderTotals`
- [x] Refactor add item flow
- [x] Refactor update quantity/instruction flow
- [x] Refactor remove item flow
- [x] Refactor cancel item flow

### `restraurent-ui`

- [ ] Refresh UI from returned order snapshots after mutations
- [ ] Remove stale local subtotal/total updates
- [ ] Align open-order editing with server totals

## Phase 7: Checkout And Invoice Surfaces

### `restaurant-api`

- [ ] Enrich order detail response with tax-aware summary fields
- [ ] Add invoice-friendly tax breakup output

### `restraurent-ui`

- [x] Update cart summary panel
- [ ] Update checkout/payment summary
- [x] Update order details screen
- [x] Update invoice/receipt rendering

## Phase 8: Reports And Admin Surfaces

### `restaurant-api`

- [x] Make reports rely on persisted `taxAmount`
- [ ] Add null-safe tax aggregations
- [ ] Add optional tax-wise reporting

### `restraurent-ui`

- [x] Update report screens to show tax totals
- [ ] Update report exports if required

## Phase 9: Validation And Hardening

### `restaurant-api`

- [ ] Reject invalid tax configurations
- [ ] Restrict unsupported V1 combinations
- [ ] Harden tax group validation

### `restraurent-ui`

- [ ] Add operator-friendly error states for preview/config failures
- [ ] Add backward-safe rendering for old orders without tax snapshots

## Phase 10: Testing And Release Readiness

### `restaurant-api`

- [ ] Unit test tax engine formulas
- [ ] Integration test order lifecycle recalculation
- [ ] Test report aggregation correctness

### `restraurent-ui`

- [ ] Component test tax summary rendering
- [ ] Flow test cart to checkout
- [ ] Test open-order mutation refresh
- [ ] Test invoice tax rendering
