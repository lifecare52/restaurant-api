import type { Server, Socket } from 'socket.io';

import { printerServiceRegistry } from './printer-service.service';
import type {
  GetPrinterServicePayload,
  PrinterServiceRecord,
  RegisterPrinterServicePayload,
  SocketAck,
} from './printer-service.types';
import { printerServiceValidator, validateSocketPayload } from './printer-service.validator';

const PRINTER_SERVICE_UPDATED_EVENT = 'printer-service-updated';

const emitOutletPrinterServices = (io: Server, outletId: string): void => {
  io.to(outletId).emit(PRINTER_SERVICE_UPDATED_EVENT, {
    outletId,
    data: printerServiceRegistry.getByOutlet(outletId),
  });
};

const ackError = <T>(ack: SocketAck<T> | undefined, message: string): void => {
  ack?.({ success: false, message });
};

const validateActiveOutlet = async (
  outletId: string,
  ack: SocketAck<PrinterServiceRecord[]> | undefined,
): Promise<boolean> => {
  try {
    const isActiveOutlet = await printerServiceRegistry.isActiveOutlet(outletId);
    if (!isActiveOutlet) {
      ackError(ack, 'Outlet not found or inactive');
      return false;
    }

    return true;
  } catch {
    ackError(ack, 'Unable to validate outlet right now');
    return false;
  }
};

export const registerPrinterServiceSocketHandlers = (io: Server, socket: Socket): void => {
  socket.on(
    'register-printer-service',
    async (payload: unknown, ack?: SocketAck<PrinterServiceRecord[]>) => {
      const validation = validateSocketPayload<RegisterPrinterServicePayload>(
        printerServiceValidator.register,
        payload,
      );

      if (!validation.success) {
        ackError(ack, validation.errorMessage);
        return;
      }

      const validatedPayload = validation.value;
      const isActiveOutlet = await validateActiveOutlet(validatedPayload.outletId, ack);
      if (!isActiveOutlet) return;

      socket.join(validatedPayload.outletId);
      const { replacedSocketId } = printerServiceRegistry.register({
        socket,
        payload: validatedPayload,
      });

      if (replacedSocketId && replacedSocketId !== socket.id) {
        const replacedSocket = io.sockets.sockets.get(replacedSocketId);
        replacedSocket?.leave(validatedPayload.outletId);
        replacedSocket?.disconnect(true);
      }

      emitOutletPrinterServices(io, validatedPayload.outletId);

      ack?.({
        success: true,
        message: 'Printer service registered successfully',
        data: printerServiceRegistry.getByOutlet(validatedPayload.outletId),
      });
    },
  );

  socket.on(
    'get-printer-service',
    async (payload: unknown, ack?: SocketAck<PrinterServiceRecord[]>) => {
      const validation = validateSocketPayload<GetPrinterServicePayload>(
        printerServiceValidator.get,
        payload,
      );

      if (!validation.success) {
        ackError(ack, validation.errorMessage);
        return;
      }

      const validatedPayload = validation.value;
      const isActiveOutlet = await validateActiveOutlet(validatedPayload.outletId, ack);
      if (!isActiveOutlet) return;

      socket.join(validatedPayload.outletId);
      ack?.({
        success: true,
        data: printerServiceRegistry.getByOutlet(validatedPayload.outletId),
      });
    },
  );

  socket.on('disconnect', () => {
    const removedService = printerServiceRegistry.removeBySocketId(socket.id);
    if (removedService) {
      emitOutletPrinterServices(io, removedService.outletId);
    }
  });
};
