import { Types } from 'mongoose';
import type { Server } from 'socket.io';

import { PrintSetting } from '@modules/print-setting/print-setting.model';
import type { IApiResponse } from '@shared/interfaces/api';

import { printerServiceRegistry } from './printer-service.service';

export const PRINT_JOB_EVENT = 'print-job';

type PrintableData = {
  kotImages?: string[];
  receiptImage?: string;
  printerName?: string;
  jobName?: string;
};

type PrintableJobData = {
  data: PrintableData;
  printType: 'bill' | 'kot';
};

const getPrintableData = (data: unknown): PrintableJobData | null => {
  if (!data || typeof data !== 'object') return null;

  const printableData = data as Partial<PrintableData>;
  const hasKotImages = Array.isArray(printableData.kotImages) && printableData.kotImages.length > 0;
  const hasReceiptImage =
    typeof printableData.receiptImage === 'string' && printableData.receiptImage.length > 0;

  if (!hasKotImages && !hasReceiptImage) return null;

  return {
    printType: hasReceiptImage ? 'bill' : 'kot',
    data: {
      ...(hasKotImages ? { kotImages: printableData.kotImages } : {}),
      ...(hasReceiptImage ? { receiptImage: printableData.receiptImage } : {}),
    },
  };
};

const getPrinterName = async (
  brandId: string,
  outletId: string,
  printType: PrintableJobData['printType'],
): Promise<string> => {
  const settings = await PrintSetting.findOne({
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false,
  }).lean();

  return printType === 'bill'
    ? settings?.billPrinting?.printerName || ''
    : settings?.kotPrinting?.printerName || '';
};

const getJobName = (data: unknown, printType: 'bill' | 'kot'): string => {
  if (!data || typeof data !== 'object') {
    return printType === 'bill' ? 'BILL-Job' : 'KOT-Job';
  }

  const orderData = data as Record<string, unknown>;
  const tokenNo = orderData.tokenNo;
  const orderNumber = orderData.orderNumber;
  const prefix = printType === 'bill' ? 'BILL' : 'KOT';

  if (tokenNo) {
    return `${prefix}-${tokenNo}`;
  }

  if (orderNumber) {
    return `${prefix}-${orderNumber}`;
  }

  return `${prefix}-Job`;
};

export const emitPrintJobToOutlet = async (
  io: Server | undefined,
  brandId: string,
  outletId: string,
  response: IApiResponse,
): Promise<boolean> => {
  const printableJobData = getPrintableData(response.data);
  if (!io || !printableJobData) return false;

  const printerService = printerServiceRegistry.getPrimaryByOutlet(outletId);
  if (!printerService) return false;

  const printerName = await getPrinterName(brandId, outletId, printableJobData.printType);
  const jobName = getJobName(response.data, printableJobData.printType);

  io.to(printerService.socketId).emit(PRINT_JOB_EVENT, {
    ...response,
    data: {
      ...printableJobData.data,
      printerName,
      jobName,
    },
  });
  return true;
};
