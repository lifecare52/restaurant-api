import type { Socket } from 'socket.io';

export type PrinterServiceStatus = 'online' | 'offline';

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

export interface GetPrinterServicePayload {
  outletId: string;
}

export interface PrinterServiceSocketContext {
  socket: Socket;
  payload: RegisterPrinterServicePayload;
}

export interface SocketAckResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export type SocketAck<T = unknown> = (response: SocketAckResponse<T>) => void;
