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
    gstNo?: string;
    currency?: string;
    CGST?: number;
    SGST?: number;
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
    gstNo?: string;
    currency?: string;
    CGST?: number;
    SGST?: number;
  };
}
