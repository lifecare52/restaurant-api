export interface CreateOwnerDTO {
  name: string;
  email: string;
  password: string;
  brandName: string;
  plan?: {
    name: string;
    outletLimit: number;
  };
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: 'PARTNER' | 'STAFF';
  brandId: string;
  outlets?: string[];
  permissions?: string[];
}

export interface CreateAdminDTO {
  name: string;
  email: string;
  password: string;
}
