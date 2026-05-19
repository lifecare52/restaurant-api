import type { Server, Socket } from 'socket.io';

import { printerServiceRegistry } from './printer-service.service';
import type {
  PrinterServiceRecord,
  RegisterPrinterServicePayload,
  SocketAck,
} from './printer-service.types';
import { printerServiceValidator, validateSocketPayload } from './printer-service.validator';

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

      const { replacedSocketId } = printerServiceRegistry.register({
        socket,
        payload: validatedPayload,
      });

      if (replacedSocketId && replacedSocketId !== socket.id) {
        const replacedSocket = io.sockets.sockets.get(replacedSocketId);
        replacedSocket?.disconnect(true);
      }

      ack?.({
        success: true,
        message: 'Printer service registered successfully',
        data: printerServiceRegistry.getByOutlet(validatedPayload.outletId),
      });
    },
  );

  socket.on('disconnect', () => {
    printerServiceRegistry.removeBySocketId(socket.id);
  });
};
