import { Types } from 'mongoose';

import OutletEntity from '@modules/outlet/outlet.model';

import type { PrinterServiceRecord, PrinterServiceSocketContext } from './printer-service.types';

class PrinterServiceRegistry {
  private readonly servicesByOutlet = new Map<string, PrinterServiceRecord>();
  private readonly socketOutletIndex = new Map<string, string>();

  register({ socket, payload }: PrinterServiceSocketContext): {
    record: PrinterServiceRecord;
    replacedSocketId?: string;
  } {
    const now = new Date().toISOString();
    const ipAddress = this.getIpAddress(socket);
    const systemName = this.getSystemName(socket, payload);
    const platform = this.getPlatform(socket, payload);
    const existingService = this.servicesByOutlet.get(payload.outletId);

    const record: PrinterServiceRecord = {
      socketId: socket.id,
      outletId: payload.outletId,
      ipAddress,
      systemName,
      platform,
      status: 'online',
      connectedAt: now,
      lastSeenAt: now
    };

    if (existingService) {
      this.socketOutletIndex.delete(existingService.socketId);
    }

    this.servicesByOutlet.set(payload.outletId, record);
    this.socketOutletIndex.set(socket.id, payload.outletId);
    return {
      record,
      replacedSocketId: existingService?.socketId
    };
  }

  removeBySocketId(socketId: string): { outletId: string } | null {
    const outletId = this.socketOutletIndex.get(socketId);
    if (!outletId) return null;

    const outletService = this.servicesByOutlet.get(outletId);
    if (outletService?.socketId === socketId) {
      this.servicesByOutlet.delete(outletId);
    }

    this.socketOutletIndex.delete(socketId);

    return { outletId };
  }

  getByOutlet(outletId: string): PrinterServiceRecord[] {
    const service = this.servicesByOutlet.get(outletId);
    return service ? [service] : [];
  }

  getPrimaryByOutlet(outletId: string): PrinterServiceRecord | null {
    return this.servicesByOutlet.get(outletId) || null;
  }

  async isActiveOutlet(outletId: string): Promise<boolean> {
    const outlet = await OutletEntity.exists({
      _id: new Types.ObjectId(outletId),
      isActive: true,
      isDelete: false
    });

    return Boolean(outlet);
  }

  private getIpAddress(socket: PrinterServiceSocketContext['socket']): string {
    const forwardedFor = socket.handshake.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const rawIp = forwardedIp?.split(',')[0]?.trim() || socket.handshake.address || 'unknown';
    return rawIp.replace(/^::ffff:/, '');
  }

  private getSystemName(
    socket: PrinterServiceSocketContext['socket'],
    payload: PrinterServiceSocketContext['payload']
  ): string {
    const headerHostname = socket.handshake.headers['x-hostname'];
    const hostname = Array.isArray(headerHostname) ? headerHostname[0] : headerHostname;
    return payload.systemName || payload.hostname || hostname || `printer-service-${socket.id}`;
  }

  private getPlatform(
    socket: PrinterServiceSocketContext['socket'],
    payload: PrinterServiceSocketContext['payload']
  ): string {
    const clientHintPlatform = socket.handshake.headers['sec-ch-ua-platform'];
    const userAgent = socket.handshake.headers['user-agent'];
    const platform = Array.isArray(clientHintPlatform) ? clientHintPlatform[0] : clientHintPlatform;
    const userAgentValue = Array.isArray(userAgent) ? userAgent[0] : userAgent;
    return payload.platform || platform?.replace(/"/g, '') || userAgentValue || 'unknown';
  }
}

export const printerServiceRegistry = new PrinterServiceRegistry();
