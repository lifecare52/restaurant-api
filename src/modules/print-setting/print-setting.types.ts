import { Types } from 'mongoose';

export interface IPrintSetting {
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;

  billPrinting: {
    isEnabled: boolean;
    autoPrintOnSettlement: boolean;
    paperSize: '58mm' | '80mm';
    printMode: 'SILENT' | 'PREVIEW';
    printerName?: string;
    header: {
      showLogo: boolean;
      restaurantName: string;
      address: string;
      contactNumber: string;
      taxNumber?: string;
    };
    footer: {
      thankYouMessage?: string;
      termsAndConditions?: string;
    };
    showQRCode: boolean;
    numberOfCopies: number;
  };

  kotPrinting: {
    isEnabled: boolean;
    autoPrintOnGeneration: boolean;
    paperSize: '58mm' | '80mm';
    printMode: 'SILENT' | 'PREVIEW';
    printerName?: string;
    showOrderType: boolean;
    showWaiterName: boolean;
  };

  isDelete: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PrintSettingUpdateDTO {
  billPrinting?: Partial<IPrintSetting['billPrinting']>;
  kotPrinting?: Partial<IPrintSetting['kotPrinting']>;
}
