import type { Server, Socket } from 'socket.io';

import { printerServiceRegistry } from './printer-service.service';
import {
  PRINTER_SERVICE_ERROR_CODES,
  PRINTER_SERVICE_EVENTS,
  outletRoomName,
} from './printer-service.types';
import type {
  OutletScopedPayload,
  PrintJobAgentPayload,
  PrintJobRequestPayload,
  PrinterServiceErrorCode,
  PrinterServiceRecord,
  PrinterServiceUpdatedPayload,
  RegisterPrinterServicePayload,
  SocketAck,
  SocketAckResponse,
} from './printer-service.types';
import { printerServiceValidator, validateSocketPayload } from './printer-service.validator';

const RELAY_ACK_TIMEOUT_MS = 8000;
const PRINT_JOB_ACK_TIMEOUT_MS = 30000;

const ackError = <T>(
  ack: SocketAck<T> | undefined,
  code: PrinterServiceErrorCode,
  message: string,
): void => {
  ack?.({ success: false, code, message } as SocketAckResponse<T>);
};

const ackLegacyError = <T>(ack: SocketAck<T> | undefined, message: string): void => {
  ack?.({ success: false, message } as SocketAckResponse<T>);
};

const broadcastPresence = (io: Server, outletId: string): void => {
  const payload: PrinterServiceUpdatedPayload = {
    outletId,
    data: printerServiceRegistry.getByOutlet(outletId),
  };
  io.to(outletRoomName(outletId)).emit(PRINTER_SERVICE_EVENTS.PRINTER_SERVICE_UPDATED, payload);
};

const validateOutletExists = async <T>(
  outletId: string,
  ack: SocketAck<T> | undefined,
): Promise<boolean> => {
  try {
    const isActive = await printerServiceRegistry.isActiveOutlet(outletId);
    if (!isActive) {
      ackError(ack, PRINTER_SERVICE_ERROR_CODES.INVALID_OUTLET, 'Unknown outletId');
      return false;
    }
    return true;
  } catch (error) {
    console.error('[printer-service] outlet validation failed:', error);
    ackError(
      ack,
      PRINTER_SERVICE_ERROR_CODES.INVALID_OUTLET,
      'Unable to validate outlet right now',
    );
    return false;
  }
};

interface RelayContext<TReq> {
  io: Server;
  event: string;
  payload: TReq;
  timeoutMs: number;
  ack: SocketAck | undefined;
  offlineCodeMessage?: string;
}

const relayToAgent = async <TReq extends { outletId: string }>({
  io,
  event,
  payload,
  timeoutMs,
  ack,
  offlineCodeMessage,
}: RelayContext<TReq>): Promise<void> => {
  if (typeof ack !== 'function') return;

  const agent = printerServiceRegistry.getPrimaryByOutlet(payload.outletId);
  const agentSocket = agent ? io.sockets.sockets.get(agent.socketId) : undefined;

  if (!agent || !agentSocket) {
    ackError(
      ack,
      PRINTER_SERVICE_ERROR_CODES.PRINTER_AGENT_OFFLINE,
      offlineCodeMessage || 'Print agent offline',
    );
    return;
  }

  try {
    const response = (await agentSocket
      .timeout(timeoutMs)
      .emitWithAck(event, payload)) as SocketAckResponse;
    printerServiceRegistry.touchByOutlet(payload.outletId);
    ack(response);
  } catch {
    ackError(
      ack,
      PRINTER_SERVICE_ERROR_CODES.PRINTER_AGENT_TIMEOUT,
      'Print agent did not respond in time',
    );
  }
};

const handleRegister = async (
  io: Server,
  socket: Socket,
  payload: unknown,
  ack: SocketAck<PrinterServiceRecord[]> | undefined,
): Promise<void> => {
  const validation = validateSocketPayload<RegisterPrinterServicePayload>(
    printerServiceValidator.register,
    payload,
  );

  if (!validation.success) {
    ackError(ack, PRINTER_SERVICE_ERROR_CODES.BAD_REQUEST, validation.errorMessage);
    return;
  }

  const validatedPayload = validation.value;

  try {
    const isActive = await printerServiceRegistry.isActiveOutlet(validatedPayload.outletId);
    if (!isActive) {
      ackError(ack, PRINTER_SERVICE_ERROR_CODES.INVALID_OUTLET, 'Unknown outletId');
      setImmediate(() => socket.disconnect(true));
      return;
    }
  } catch (error) {
    console.error('[printer-service] outlet validation failed:', error);
    ackError(
      ack,
      PRINTER_SERVICE_ERROR_CODES.INVALID_OUTLET,
      'Unable to validate outlet right now',
    );
    setImmediate(() => socket.disconnect(true));
    return;
  }

  const { replacedSocketId } = printerServiceRegistry.register({
    socket,
    payload: validatedPayload,
  });

  if (replacedSocketId && replacedSocketId !== socket.id) {
    const replacedSocket = io.sockets.sockets.get(replacedSocketId);
    replacedSocket?.disconnect(true);
  }

  await socket.join(outletRoomName(validatedPayload.outletId));

  ack?.({
    success: true,
    message: 'Printer service registered successfully',
    data: printerServiceRegistry.getByOutlet(validatedPayload.outletId),
  });

  broadcastPresence(io, validatedPayload.outletId);
};

const handleGetPrinterService = async (
  socket: Socket,
  payload: unknown,
  ack: SocketAck<PrinterServiceRecord[]> | undefined,
): Promise<void> => {
  const validation = validateSocketPayload<OutletScopedPayload>(
    printerServiceValidator.outletScoped,
    payload,
  );

  if (!validation.success) {
    ackError(ack, PRINTER_SERVICE_ERROR_CODES.BAD_REQUEST, validation.errorMessage);
    return;
  }

  const { outletId } = validation.value;
  const outletExists = await validateOutletExists(outletId, ack);
  if (!outletExists) return;

  await socket.join(outletRoomName(outletId));

  ack?.({
    success: true,
    message: 'ok',
    data: printerServiceRegistry.getByOutlet(outletId),
  });
};

const handleRelay = async (
  io: Server,
  event: string,
  payload: unknown,
  ack: SocketAck | undefined,
  timeoutMs: number,
): Promise<void> => {
  const validation = validateSocketPayload<OutletScopedPayload>(
    printerServiceValidator.outletScoped,
    payload,
  );

  if (!validation.success) {
    ackError(ack, PRINTER_SERVICE_ERROR_CODES.BAD_REQUEST, validation.errorMessage);
    return;
  }

  await relayToAgent({
    io,
    event,
    payload: validation.value,
    timeoutMs,
    ack,
  });
};

const buildPrintJobEnvelope = (payload: PrintJobRequestPayload): PrintJobAgentPayload => ({
  success: true,
  code: 0,
  message: 'print',
  data: {
    ...(payload.kotImages ? { kotImages: payload.kotImages } : {}),
    ...(payload.receiptImage ? { receiptImage: payload.receiptImage } : {}),
    ...(payload.printerName ? { printerName: payload.printerName } : {}),
    ...(payload.jobName ? { jobName: payload.jobName } : {}),
  },
});

const handlePrintJobRequest = async (
  io: Server,
  payload: unknown,
  ack: SocketAck | undefined,
): Promise<void> => {
  const validation = validateSocketPayload<PrintJobRequestPayload>(
    printerServiceValidator.printJobRequest,
    payload,
  );

  if (!validation.success) {
    ackError(ack, PRINTER_SERVICE_ERROR_CODES.BAD_REQUEST, validation.errorMessage);
    return;
  }

  const validatedPayload = validation.value;
  const agent = printerServiceRegistry.getPrimaryByOutlet(validatedPayload.outletId);
  const agentSocket = agent ? io.sockets.sockets.get(agent.socketId) : undefined;

  if (!agent || !agentSocket) {
    ackError(ack, PRINTER_SERVICE_ERROR_CODES.PRINTER_AGENT_OFFLINE, 'Print agent offline');
    return;
  }

  const envelope = buildPrintJobEnvelope(validatedPayload);

  try {
    const response = (await agentSocket
      .timeout(PRINT_JOB_ACK_TIMEOUT_MS)
      .emitWithAck(PRINTER_SERVICE_EVENTS.PRINT_JOB, envelope)) as SocketAckResponse;
    printerServiceRegistry.touchByOutlet(validatedPayload.outletId);
    ack?.(response);
  } catch {
    ackError(
      ack,
      PRINTER_SERVICE_ERROR_CODES.PRINTER_AGENT_TIMEOUT,
      'Print agent did not respond in time',
    );
  }
};

const handleDisconnect = (io: Server, socket: Socket): void => {
  const result = printerServiceRegistry.removeBySocketId(socket.id);
  if (result?.removed) {
    broadcastPresence(io, result.outletId);
  }
};

export const registerPrinterServiceSocketHandlers = (io: Server, socket: Socket): void => {
  socket.on(
    PRINTER_SERVICE_EVENTS.REGISTER,
    (payload: unknown, ack?: SocketAck<PrinterServiceRecord[]>) => {
      void handleRegister(io, socket, payload, ack).catch(() => {
        ackLegacyError(ack, 'Failed to register printer service');
      });
    },
  );

  socket.on(
    PRINTER_SERVICE_EVENTS.GET_PRINTER_SERVICE,
    (payload: unknown, ack?: SocketAck<PrinterServiceRecord[]>) => {
      void handleGetPrinterService(socket, payload, ack).catch(() => {
        ackLegacyError(ack, 'Failed to fetch printer service status');
      });
    },
  );

  socket.on(PRINTER_SERVICE_EVENTS.GET_HEALTH, (payload: unknown, ack?: SocketAck) => {
    void handleRelay(io, PRINTER_SERVICE_EVENTS.GET_HEALTH, payload, ack, RELAY_ACK_TIMEOUT_MS);
  });

  socket.on(PRINTER_SERVICE_EVENTS.GET_PRINTERS, (payload: unknown, ack?: SocketAck) => {
    void handleRelay(io, PRINTER_SERVICE_EVENTS.GET_PRINTERS, payload, ack, RELAY_ACK_TIMEOUT_MS);
  });

  socket.on(PRINTER_SERVICE_EVENTS.PRINT_JOB_REQUEST, (payload: unknown, ack?: SocketAck) => {
    void handlePrintJobRequest(io, payload, ack);
  });

  socket.on('disconnect', () => {
    handleDisconnect(io, socket);
  });
};
