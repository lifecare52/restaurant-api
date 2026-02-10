export interface AddonItemDTO {
  name: string;
  price: number;
  sapCode?: string;
  dietary?: 'VEG' | 'NON_VEG' | 'EGG';
  available?: boolean;
}

export interface AddonCreateDTO {
  name: string;
  items: AddonItemDTO[];
  isActive?: boolean;
}

export interface AddonUpdateDTO {
  name?: string;
  items?: AddonItemDTO[];
  isActive?: boolean;
}
