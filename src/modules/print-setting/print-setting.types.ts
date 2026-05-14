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
    
    showLogo: boolean;
    showHeader: boolean;
    headerText?: string;
    showFooter: boolean;
    footerText?: string;
    
    showCustomerDetails: boolean;
    showCaptainName: boolean;
    showCoverCount: boolean;
    showItemHsnCode: boolean;
    showDiscountDetails: boolean;
    
    showPaymentQrCode: boolean;
    merchantUpiId?: string;
    showOrderType: boolean;
    
    numberOfCopies: number;
  };

  kotPrinting: {
    isEnabled: boolean;
    autoPrintOnGeneration: boolean;
    paperSize: '58mm' | '80mm';
    printMode: 'SILENT' | 'PREVIEW';
    printerName?: string;
    
    showModifiers: boolean;
    itemWiseKOT: boolean;
    showCancelledItems: boolean;
    showTableToken: boolean;
    showWaiterName: boolean;
    showOrderType: boolean;
    showCoverCount: boolean;
  };

  isDelete: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PrintSettingUpdateDTO {
  billPrinting?: Partial<IPrintSetting['billPrinting']>;
  kotPrinting?: Partial<IPrintSetting['kotPrinting']>;
}
