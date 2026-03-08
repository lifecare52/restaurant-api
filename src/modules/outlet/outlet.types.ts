import { GstScheme } from '@shared/enum';

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
  };
}
