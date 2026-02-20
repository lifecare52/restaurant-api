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
  isActive?: boolean;
  salary?: number;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  password?: string;
  role?: 'PARTNER' | 'STAFF';
  outlets?: string[];
  permissions?: string[];
  isActive?: boolean;
  salary?: number;
}

export interface UserListQueryDTO {
  page?: number;
  limit?: number;
  searchText?: string;
  role?: string;
  column?: string;
  order?: 'ASC' | 'DESC';
}

export interface CreateAdminDTO {
  name: string;
  username: string;
  email: string;
  password: string;
}
