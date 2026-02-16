export interface CategoryCreateDTO {
  name: string;
  onlineName?: string;
  logo?: string;
  isActive?: boolean;
}

export interface CategoryUpdateDTO {
  name?: string;
  onlineName?: string;
  logo?: string;
  isActive?: boolean;
}
