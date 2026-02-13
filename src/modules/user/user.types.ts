export interface CreateOwnerDTO {
  name: string;
  username: string;
  email?: string;
  password: string;
  brandId: string;
  outlets: string[];
}

export interface CreateUserDTO {
  name: string;
  username: string;
  email?: string;
  password: string;
  role: 'PARTNER' | 'STAFF';
  brandId: string;
  outlets?: string[];
  permissions?: string[];
}

export interface CreateAdminDTO {
  name: string;
  username: string;
  email: string;
  password: string;
}
