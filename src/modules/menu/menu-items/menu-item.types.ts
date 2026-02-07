export interface MenuItemCreateDTO {
  name: string;
  shortCodes?: string[];
  categoryId: string;

  dietary: 'VEG' | 'NON_VEG' | 'EGG';

  basePrice?: number | null;
  costPrice?: number;
  profitPercentage?: number;

  hasVariation?: boolean;
  variationGroupIds?: string[];
  addonGroupIds?: string[];

  isActive?: boolean;
}

export interface MenuItemUpdateDTO {
  name?: string;
  shortCodes?: string[];
  categoryId?: string;

  dietary?: 'VEG' | 'NON_VEG' | 'EGG';

  basePrice?: number | null;
  costPrice?: number;
  profitPercentage?: number;

  hasVariation?: boolean;
  variationGroupIds?: string[];
  addonGroupIds?: string[];

  isActive?: boolean;
}
