# Printer Service Socket Events

Complete reference for the Socket.io event protocol between the POS frontend,
the backend (`restaurant-api`), and the local print agent (`PrinterAgent`).

## The three actors

```
Frontend (POS UI)  <-->  Backend (restaurant-api)  <-->  Agent (PrinterAgent Electron app)
```

The backend sits in the middle. Some events are **direct** (handled by the
backend), others are **relayed** (backend forwards to the agent and pipes the
ack back to the frontend).

Event names are defined in `printer-service.types.ts` (`PRINTER_SERVICE_EVENTS`).

---

## All seven events

### 1. `register-printer-service` — Agent → Backend

The agent's first message after connecting. Tells the backend "I am the printer
for this outlet."

- **Emitter:** Agent (`socket-client.js` `register()`)
- **Handler:** `handleRegister` (`printer-service.socket-handler.ts`)

**Payload**

```json
{
  "outletId": "6a0991aac30a6cf832a9e56b",
  "systemName": "DESKTOP-ABC123",
  "hostname": "DESKTOP-ABC123",
  "platform": "win32"
}
```

**Behavior**

- Validates the `outletId` exists in MongoDB (`isActiveOutlet`).
- Stores the agent in the in-memory `printerServiceRegistry`.
- Kicks off any previously-registered agent for the same outlet — **one agent
  per outlet**.
- Joins the agent's socket to the `outlet:<outletId>` room.
- Acks with the full agent list, then broadcasts `printer-service-updated`.

**Errors:** `BAD_REQUEST`, `INVALID_OUTLET`

---

### 2. `get-printer-service` — Frontend → Backend

Frontend asks "who's the agent for this outlet?" — this is also how the
frontend **joins the outlet room** to start receiving push updates.

- **Emitter:** Frontend
- **Handler:** `handleGetPrinterService` (`printer-service.socket-handler.ts`)

**Payload**

```json
{ "outletId": "6a0991aac30a6cf832a9e56b" }
```

**Ack response**

```json
{
  "success": true,
  "message": "ok",
  "data": [
    {
      "socketId": "...",
      "outletId": "...",
      "ipAddress": "192.168.1.42",
      "systemName": "DESKTOP-ABC123",
      "platform": "win32",
      "status": "online",
      "connectedAt": "2026-05-21T09:00:00.000Z",
      "lastSeenAt": "2026-05-21T09:30:00.000Z"
    }
  ]
}
```

Empty `data: []` means no agent is registered for this outlet → local service
is offline.

**Errors:** `BAD_REQUEST`, `INVALID_OUTLET`

---

### 3. `printer-service-updated` — Backend → Frontend (push)

Server-pushed broadcast. There is no emitter on the client side — clients only
listen.

- **Emitter:** Backend (`broadcastPresence` in `printer-service.socket-handler.ts`)
- **Triggers:**
  - Agent registers → fired from `handleRegister`
  - Agent disconnects → fired from `handleDisconnect`

**Payload**

```json
{
  "outletId": "6a0991aac30a6cf832a9e56b",
  "data": []
}
```

`data: []` means agent went offline; `data: [record]` means agent is online
(same record shape as `get-printer-service`).

**Requirement:** the receiver must be in the `outlet:<outletId>` room.
Frontends join via `get-printer-service`; agents join during register.

**Crash detection note:** if the agent process exits cleanly, the disconnect
fires immediately. For hard crashes (power loss, frozen process), Socket.io
relies on its ping/pong heartbeat to notice — with defaults of
`pingInterval=25s` and `pingTimeout=20s`, this means up to ~45s before the
backend marks the agent offline. During that window, relayed requests will
return `PRINTER_AGENT_TIMEOUT` rather than `PRINTER_AGENT_OFFLINE`.

---

### 4. `get-health` — Frontend → Backend → Agent (relayed)

Frontend asks "is the local service healthy?" Backend relays the request to
the registered agent.

- **Frontend handler:** `handleRelay` → `relayToAgent`
  (`printer-service.socket-handler.ts`)
- **Agent handler:** `socket-client.js` (also accepts the aliases `health` and
  `agent-health`)

**Payload**

```json
{ "outletId": "6a0991aac30a6cf832a9e56b" }
```

**Ack response** (from the agent's `buildHealth`)

```json
{
  "success": true,
  "data": {
    "status": "ready",
    "ready": true,
    "issues": [],
    "service": "running",
    "version": "1.0.0",
    "uptime": 3600,
    "printers": 2,
    "queueSize": 0,
    "defaultPrinter": "XP-80C",
    "outletId": "...",
    "systemName": "...",
    "platform": "win32"
  }
}
```

`status` values:

- `ready` — service live and able to print
- `paused` — user paused the service from the tray menu
- `degraded` — live but cannot print (e.g. no printers detected); details in
  `issues[]`

**Timeout:** 8 seconds (`RELAY_ACK_TIMEOUT_MS`)
**Errors:** `BAD_REQUEST`, `PRINTER_AGENT_OFFLINE`, `PRINTER_AGENT_TIMEOUT`

---

### 5. `get-printers` — Frontend → Backend → Agent (relayed)

Same relay pattern as `get-health`. Returns the list of installed printers
from the agent's machine.

- **Frontend handler:** `handleRelay` (`printer-service.socket-handler.ts`)
- **Agent handler:** `socket-client.js` (aliases: `printers`, `get-printer-list`)

**Payload**

```json
{ "outletId": "6a0991aac30a6cf832a9e56b" }
```

**Ack response** (from the agent's `listPrinters`)

```json
{
  "success": true,
  "data": {
    "defaultPrinter": "XP-80C",
    "printers": [
      { "name": "XP-80C", "isDefault": true, "status": "idle" },
      { "name": "Microsoft Print to PDF", "isDefault": false, "status": "idle" }
    ]
  }
}
```

**Timeout:** 8 seconds
**Errors:** `BAD_REQUEST`, `PRINTER_AGENT_OFFLINE`, `PRINTER_AGENT_TIMEOUT`

---

### 6. `print-job-request` — Frontend → Backend (relayed as `print-job`)

The "actually print this now" call. The frontend emits `print-job-request`,
but the backend forwards it to the agent under a **different event name**,
`print-job`, with a wrapped envelope.

- **Frontend handler:** `handlePrintJobRequest`
  (`printer-service.socket-handler.ts`)

**Payload (frontend → backend)**

```json
{
  "outletId": "6a0991aac30a6cf832a9e56b",
  "kotImages": ["<base64 SVG>", "<base64 SVG>"],
  "receiptImage": "<base64 SVG>",
  "printerName": "XP-80C",
  "jobName": "Order #1234"
}
```

At least one of `kotImages` or `receiptImage` is required (validator uses
`.or('kotImages', 'receiptImage')`). `printerName` falls back to the agent's
`printing.defaultPrinter` config when omitted.

**Envelope built and forwarded as `print-job`** (`buildPrintJobEnvelope`)

```json
{
  "success": true,
  "code": 0,
  "message": "print",
  "data": {
    "kotImages": ["..."],
    "receiptImage": "...",
    "printerName": "XP-80C",
    "jobName": "Order #1234"
  }
}
```

**Ack response** (forwarded back from the agent)

```json
{
  "success": true,
  "message": "printed",
  "data": { "printer": "XP-80C", "jobName": "Order #1234", "printed": 3 }
}
```

**Timeout:** 30 seconds (`PRINT_JOB_ACK_TIMEOUT_MS` — longer than other relays
because printing takes time)
**Errors:** `BAD_REQUEST`, `PRINTER_AGENT_OFFLINE`, `PRINTER_AGENT_TIMEOUT`

---

### 7. `print-job` — Backend → Agent

The relayed event the agent actually listens to. The frontend never emits this
directly.

- **Agent handler:** `socket-client.js` `handlePrintJob`

**What it does**

1. Picks the printer (`printerName` from payload, falling back to
   `printing.defaultPrinter` config).
2. Iterates `kotImages` first, then `receiptImage` (mirrors POS print order).
3. For each base64 doc: converts SVG to PDF, prints silently at the configured
   paper size (default `80mm`).
4. Acks back with `{ success: true, message: 'printed', data: { printer, jobName, printed } }`.

---

## Quick reference: who emits, who listens

| Event                      | Frontend  | Backend          | Agent          |
| -------------------------- | --------- | ---------------- | -------------- |
| `register-printer-service` | —         | listens          | **emits**      |
| `get-printer-service`      | **emits** | listens          | —              |
| `printer-service-updated`  | listens   | broadcasts       | listens (room) |
| `get-health`               | **emits** | relays           | listens & acks |
| `get-printers`             | **emits** | relays           | listens & acks |
| `print-job-request`        | **emits** | relays           | —              |
| `print-job`                | —         | emits to agent   | listens & acks |

---

## Error codes (`PRINTER_SERVICE_ERROR_CODES`)

| Code                     | When                                              |
| ------------------------ | ------------------------------------------------- |
| `BAD_REQUEST`            | Payload validation failed (missing/invalid field) |
| `INVALID_OUTLET`         | Outlet doesn't exist or is inactive/deleted       |
| `PRINTER_AGENT_OFFLINE`  | No agent registered for that outlet               |
| `PRINTER_AGENT_TIMEOUT`  | Agent registered but didn't ack within timeout    |

Failure ack shape:

```json
{ "success": false, "code": "PRINTER_AGENT_OFFLINE", "message": "Print agent offline" }
```

---

## Mental model for the frontend

```js
// 1. On connect — get initial state + join the outlet room
socket.emit('get-printer-service', { outletId }, (ack) => {
  setAgentOnline(ack.success && ack.data.length > 0);
});

// 2. Live status updates pushed by the backend
socket.on('printer-service-updated', ({ outletId, data }) => {
  setAgentOnline(data.length > 0);
});

// 3. Actions
socket.emit('get-health',   { outletId }, (ack) => { /* ... */ });
socket.emit('get-printers', { outletId }, (ack) => { /* ... */ });
socket.emit(
  'print-job-request',
  { outletId, kotImages, receiptImage, printerName, jobName },
  (ack) => {
    if (!ack.success) {
      if (ack.code === 'PRINTER_AGENT_OFFLINE') showBanner('Local service offline');
      if (ack.code === 'PRINTER_AGENT_TIMEOUT') showBanner('Local service not responding');
      if (ack.code === 'BAD_REQUEST')           showBanner(ack.message);
    }
  }
);
```

A frontend only ever cares about five events: emits four (`get-printer-service`,
`get-health`, `get-printers`, `print-job-request`) and listens to one push
(`printer-service-updated`).

---

## Constants reference

| Constant                  | Value     | Defined in                            |
| ------------------------- | --------- | ------------------------------------- |
| `RELAY_ACK_TIMEOUT_MS`    | `8000`    | `printer-service.socket-handler.ts`   |
| `PRINT_JOB_ACK_TIMEOUT_MS`| `30000`   | `printer-service.socket-handler.ts`   |
| Outlet room name format   | `outlet:<outletId>` | `printer-service.types.ts` (`outletRoomName`) |
