import type { Socket } from 'socket.io';

export type PrinterServiceStatus = 'online' | 'offline';

export const PRINTER_SERVICE_ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  INVALID_OUTLET: 'INVALID_OUTLET',
  PRINTER_AGENT_OFFLINE: 'PRINTER_AGENT_OFFLINE',
  PRINTER_AGENT_TIMEOUT: 'PRINTER_AGENT_TIMEOUT',
} as const;

export type PrinterServiceErrorCode =
  (typeof PRINTER_SERVICE_ERROR_CODES)[keyof typeof PRINTER_SERVICE_ERROR_CODES];

export const PRINTER_SERVICE_EVENTS = {
  REGISTER: 'register-printer-service',
  GET_PRINTER_SERVICE: 'get-printer-service',
  GET_HEALTH: 'get-health',
  GET_PRINTERS: 'get-printers',
  PRINT_JOB_REQUEST: 'print-job-request',
  PRINT_JOB: 'print-job',
  PRINTER_SERVICE_UPDATED: 'printer-service-updated',
} as const;

export const PRINTER_SERVICE_ROOM_PREFIX = 'outlet:';

export const outletRoomName = (outletId: string): string =>
  `${PRINTER_SERVICE_ROOM_PREFIX}${outletId}`;

export interface PrinterServiceRecord {
  socketId: string;
  outletId: string;
  ipAddress: string;
  systemName: string;
  platform: string;
  status: PrinterServiceStatus;
  connectedAt: string;
  lastSeenAt: string;
}

export interface RegisterPrinterServicePayload {
  outletId: string;
  systemName?: string;
  hostname?: string;
  platform?: string;
}

export interface OutletScopedPayload {
  outletId: string;
}

export interface PrintJobRequestPayload extends OutletScopedPayload {
  kotImages?: string[];
  receiptImage?: string;
  printerName?: string;
  jobName?: string;
}

export interface PrintJobAgentPayload {
  success: true;
  code: number;
  message: string;
  data: {
    kotImages?: string[];
    receiptImage?: string;
    printerName?: string;
    jobName?: string;
  };
}

export interface PrinterServiceUpdatedPayload {
  outletId: string;
  data: PrinterServiceRecord[];
}

export interface PrinterServiceSocketContext {
  socket: Socket;
  payload: RegisterPrinterServicePayload;
}

export interface SocketAckResponse<T = unknown> {
  success: boolean;
  code?: PrinterServiceErrorCode | number | string;
  message?: string;
  data?: T;
}

export type SocketAck<T = unknown> = (response: SocketAckResponse<T>) => void;
