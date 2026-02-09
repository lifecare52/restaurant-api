export const ROLES = {
  ADMIN: 'ADMIN',
  OWNER: 'OWNER',
  PARTNER: 'PARTNER',
  STAFF: 'STAFF',
} as const;

export const PERMISSIONS = {
  USER_MANAGEMENT: 'USER_MANAGEMENT',
  BRAND_MANAGEMENT: 'BRAND_MANAGEMENT',
  OUTLET_MANAGEMENT: 'OUTLET_MANAGEMENT',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const OUTLET_TYPES = ['bakery', 'restaurant', 'cafe'] as const;
export const CUISINE_TYPES = ['Indian', 'Italian', 'Chinese', 'Mexican', 'Thai'] as const;

export const API_MESSAGES = {
  MENU_ITEM_CREATED: 'Menu item created successfully',
  MENU_ITEM_UPDATED: 'Menu item updated successfully',
  MENU_ITEM_NOT_FOUND: 'Menu item not found',
  MENU_ITEM_DELETED: 'Menu item deleted successfully',
  VARIATION_CREATED: 'Variation created successfully',
  VARIATION_UPDATED: 'Variation updated successfully',
  VARIATION_NOT_FOUND: 'Variation not found',
  VARIATION_DELETED: 'Variation deleted successfully',
  MENU_ITEM_VARIANT_CREATED: 'Menu item variant created successfully',
  MENU_ITEM_VARIANT_UPDATED: 'Menu item variant updated successfully',
  MENU_ITEM_VARIANT_NOT_FOUND: 'Menu item variant not found',
  MENU_ITEM_VARIANT_DELETED: 'Menu item variant deleted successfully',
} as const;
