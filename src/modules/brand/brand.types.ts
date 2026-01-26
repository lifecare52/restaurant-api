export interface BrandCreateDTO {
  name: string;
  plan?: {
    name: string;
    outletLimit: number;
  };
}

export interface BrandUpdateDTO {
  name?: string;
  plan?: {
    name: string;
    outletLimit: number;
  };
}
