import { GstScheme } from '@shared/enum';
import { KOT_GENERATION_MODE } from '@shared/enum/order.enum';

export interface OutletCreateDTO {
  basicInfo: {
    name: string;
    logo?: string;
    cuisineType?: string[];
    outletType: string;
  };
  contact: {
    email: string;
    phone: string;
    country: string;
    state: string;
    city: string;
    address: string;
  };
  settings?: {
    gstEnabled: boolean;
    gstNo?: string;
    gstScheme: GstScheme;
    currency?: string;
    kotSettings?: {
      isKotEnabled: boolean;
      generationMode: KOT_GENERATION_MODE;
    };
  };
}

export interface OutletUpdateDTO {
  basicInfo?: {
    name?: string;
    logo?: string;
    cuisineType?: string[];
    outletType?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    country?: string;
    state?: string;
    city?: string;
    address?: string;
  };
  settings?: {
    gstEnabled?: boolean;
    gstNo?: string;
    gstScheme?: GstScheme;
    currency?: string;
    kotSettings?: {
      isKotEnabled?: boolean;
      generationMode?: KOT_GENERATION_MODE;
    };
  };
}
