export interface MenuItemAddonCreateDTO {
  menuItemId: string;
  addonId: string;
  allowedItemIds?: string[];
  menuItemVariantId?: string;
  isSingleSelect?: boolean;
  min?: number;
  max?: number;
  isActive?: boolean;
}

export interface MenuItemAddonUpdateDTO {
  allowedItemIds?: string[];
  isSingleSelect?: boolean;
  min?: number;
  max?: number;
  isActive?: boolean;
}
