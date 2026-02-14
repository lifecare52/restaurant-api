export interface MenuItemAddonInputCreate {
  addonId: string;
  isSingleSelect?: boolean;
  min?: number;
  max?: number;
}

export interface MenuItemAddonInputUpdate extends MenuItemAddonInputCreate {
  allowedItems?: string[];
}

export interface MenuItemCreateDTO {
  name: string;
  shortCodes?: string[];
  categoryId: string;

  dietary: 'VEG' | 'NON_VEG' | 'EGG';

  basePrice?: number | null;
  costPrice?: number;

  variations?: Array<{
    variationId: string;
    price: number;
    addons?: MenuItemAddonInputCreate[];
  }>;
  addons?: MenuItemAddonInputCreate[];

  isActive?: boolean;
}

export interface MenuItemUpdateDTO {
  name?: string;
  shortCodes?: string[];
  categoryId?: string;

  dietary?: 'VEG' | 'NON_VEG' | 'EGG';

  basePrice?: number | null;
  costPrice?: number;

  variations?: Array<{
    variationId: string;
    addons?: MenuItemAddonInputUpdate[];
  }>;
  addons?: MenuItemAddonInputUpdate[];

  isActive?: boolean;
}
