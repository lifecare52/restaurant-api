# Socket.io Backend Implementation Plan — Print Agent Relay

> **Audience:** the engineer building the **cloud Socket.io server** (the backend that
> sits between the POS web UI and the local print agent).
>
> **Goal:** let the browser POS UI check the local print service's **health**,
> fetch its **printers list**, and send **print jobs** — *without the browser ever
> calling `localhost`* (blocked by browser Local Network Access). All traffic flows
> UI → backend → agent over Socket.io.
>
> **Contract source of truth:** `print-service/services/socket-client.js`. The
> backend MUST match the event names and payload shapes documented here, because
> the agent is already implemented against them.

---

## 0. Architecture

```
 ┌─────────────┐        socket.io         ┌──────────────────┐       socket.io        ┌──────────────────┐
 │  POS Web UI │  ───────────────────────►│   Cloud Backend  │───────────────────────►│  Local Print     │
 │  (browser)  │◄───────────────────────  │  (THIS PLAN)     │◄───────────────────────│  Agent (Electron)│
 └─────────────┘   emits + ack callbacks   └──────────────────┘   emits + ack timeout  └──────────────────┘
        │                                         │                                          │
        │ joins room  outlet:<outletId>           │ tracks 1 active agent per outlet         │ auto-reconnects,
        │ (read-only consumer)                    │ in a registry + socket.io room           │ re-registers on connect
```

- **Room convention:** `outlet:<outletId>` (pick one and keep it consistent).
- **One active agent per outlet.** A new `register-printer-service` for an outlet
  **disconnects/replaces** the previous agent for that outlet.
- **The agent is the source of truth** for health and printers. The backend only
  *relays* and *tracks presence*; it never fabricates printer data.

---

## 1. Event Contract (authoritative)

### 1.1 `register-printer-service` — Agent → Backend (has ack)

The agent emits this on every (re)connect.

**Payload (from agent):**
```json
{
  "outletId": "string",
  "systemName": "DESKTOP-ABC",
  "hostname": "DESKTOP-ABC",
  "platform": "win32"
}
```
> `systemName` and `hostname` both carry `os.hostname()` — sent together for
> back-compat across older and newer backends.

**Backend MUST:**
1. **Look up `outletId` in the outlets table.** If it does not exist, ack
   `{ success:false, code:'INVALID_OUTLET', message:'unknown outletId' }` and
   `socket.disconnect(true)`. There is **no user/token auth** — outlet existence
   is the only check (see §6).
2. If another agent is registered for this `outletId`, **force-disconnect the old
   socket** (`oldSocket.disconnect(true)`) and remove it from the registry.
3. Capture `ipAddress` from the **handshake** (`socket.handshake.address` /
   `x-forwarded-for`) — do NOT trust a client-sent IP.
4. Add the agent to the registry (see §2) and `socket.join('outlet:'+outletId)`.
5. Ack the agent with the registry snapshot:
   `{ success:true, message:'registered', data:[<agent entry>] }`.
6. **Broadcast** `printer-service-updated` to the outlet room (see §1.4).

### 1.2 `get-printer-service` — UI → Backend (has ack) — presence/online check

This is how the UI knows if the agent is **online**. (Do **not** use `get-health`
for the online check — use this.)

**Payload (from UI):** `{ "outletId": "string" }`

**Backend MUST:**
1. **Look up `outletId` in the outlets table.** If unknown, ack
   `{ success:false, code:'INVALID_OUTLET', message:'unknown outletId' }`.
2. `socket.join('outlet:'+outletId)` so the UI receives future
   `printer-service-updated` broadcasts.
3. Ack with the current registry snapshot for that outlet:
```json
{
  "success": true,
  "message": "ok",
  "data": [
    {
      "socketId": "abc123",
      "outletId": "outlet-1",
      "ipAddress": "203.0.113.5",
      "systemName": "DESKTOP-ABC",
      "platform": "win32",
      "status": "online",
      "connectedAt": "2026-05-19T10:04:05.111Z",
      "lastSeenAt": "2026-05-19T10:04:05.111Z"
    }
  ]
}
```
**Empty `data: []` ⇒ agent OFFLINE** → UI shows the "turn ON your local print
service" banner.

### 1.3 `print-job` — Backend → Agent (MUST request ack with timeout)

Emitted by the backend **directly to the agent socket** when a KOT/Bill must print.

**Payload (backend → agent):**
```json
{
  "success": true,
  "code": 0,
  "message": "print",
  "data": {
    "kotImages": ["<base64-SVG>", "..."],
    "receiptImage": "<base64-SVG>",
    "printerName": "EPSON TM-T82",
    "jobName": "BILL-501"
  }
}
```
- `kotImages` / `receiptImage` are **base64-encoded SVG** strings (raster is also
  auto-detected by the agent). At least one must be present.
- `printerName` should be set; agent falls back to its configured default printer.

**Agent acks:**
```json
{ "success": true,  "message": "printed", "data": { "printer": "EPSON TM-T82", "jobName": "BILL-501", "printed": 2 } }
{ "success": false, "message": "<driver / validation error>" }
```

**Backend MUST** use an **ack timeout** (see §4) and treat timeout / no-agent as a
failed job (see §5 offline handling).

### 1.4 `printer-service-updated` — Backend → outlet room (broadcast, no ack)

Emit to `outlet:<outletId>` on **every** presence change: agent registers, agent
disconnects, agent replaced.

```json
{
  "outletId": "outlet-1",
  "data": [ /* same agent objects as 1.2; [] when offline */ ]
}
```

### 1.5 `get-health` — UI → Backend → Agent → back (relayed, has ack)

**New event.** UI asks for health; backend relays to the agent and returns the ack.

- **UI → Backend payload:** `{ "outletId": "string" }`
- **Backend → Agent:** emit `get-health` to the agent socket **with ack + timeout**.
  (Agent also listens on aliases `health`, `agent-health` — pick `get-health`.)
- **Agent ack → Backend → UI ack:**
```json
{
  "success": true,
  "data": {
    "service": "running",
    "version": "1.0.0",
    "uptime": 1234,
    "startedAt": "2026-05-19T09:00:00.000Z",
    "printers": 3,
    "queueSize": 0,
    "outletId": "outlet-1",
    "systemName": "DESKTOP-ABC",
    "platform": "win32"
  }
}
```
- **No agent / timeout:** ack the UI
  `{ "success": false, "code": "PRINTER_AGENT_OFFLINE", "message": "Print agent offline" }`.

### 1.6 `get-printers` — UI → Backend → Agent → back (relayed, has ack)

**New event.** Same relay pattern as `get-health`. (Agent aliases: `printers`,
`get-printer-list` — use `get-printers`.)

- **UI → Backend payload:** `{ "outletId": "string" }`
- **Agent ack → UI ack:**
```json
{
  "success": true,
  "data": {
    "defaultPrinter": "EPSON TM-T82",
    "printers": [
      { "name": "EPSON TM-T82", "status": "idle", "model": "EPSON TM-T82", "location": null, "isDefault": true }
    ]
  }
}
```
- **No agent / timeout:** `{ "success": false, "code": "PRINTER_AGENT_OFFLINE", "message": "Print agent offline" }`.

---

## 2. Server State — Agent Registry

Maintain an in-memory registry (Redis if multi-instance — see §8):

```
agentsByOutlet: Map<outletId, AgentEntry>
agentBySocketId: Map<socketId, outletId>     // reverse lookup for disconnect
```

```ts
interface AgentEntry {
  socketId: string;
  socket: Socket;             // server-side socket handle (not serialized)
  outletId: string;
  ipAddress: string;          // from handshake, never client-supplied
  systemName: string;
  platform: string;
  status: 'online';
  connectedAt: string;        // ISO
  lastSeenAt: string;         // ISO, refresh on any inbound event/heartbeat
}
```

`serializeOutlet(outletId)` → array form used in §1.2 / §1.4 (strip the `socket`).

---

## 3. Connection & Disconnection Lifecycle

```
io.on('connection', socket => {
  socket.on('register-printer-service', (p, ack) => { /* §1.1 */ });
  socket.on('get-printer-service',      (p, ack) => { /* §1.2 */ });
  socket.on('get-health',               (p, ack) => relayToAgent(socket, 'get-health',  p, ack));
  socket.on('get-printers',             (p, ack) => relayToAgent(socket, 'get-printers', p, ack));
  socket.on('print-job-request',        (p, ack) => relayPrintJob(socket, p, ack)); // UI-initiated print

  socket.on('disconnect', () => {
    const outletId = agentBySocketId.get(socket.id);
    if (!outletId) return;                       // a UI client, not an agent
    const entry = agentsByOutlet.get(outletId);
    if (entry && entry.socketId === socket.id) { // only if still the active agent
      agentsByOutlet.delete(outletId);
      agentBySocketId.delete(socket.id);
      io.to('outlet:'+outletId).emit('printer-service-updated',
        { outletId, data: [] });                 // → UI shows OFFLINE
    }
  });
});
```

**Disconnect is the offline signal.** socket.io fires it on transport close,
heartbeat timeout, server restart, or `disconnect(true)`. The agent auto-reconnects
and re-registers; the backend just needs to handle register/disconnect idempotently.

---

## 4. The Relay Helper (with ack timeout)

This is the core new logic. socket.io v4 supports `.timeout(ms).emit(ev, payload, cb)`.

```js
const ACK_TIMEOUT_MS = 8000; // health/printers fast; raise to ~30000 for print-job

function getAgent(outletId) {
  return agentsByOutlet.get(outletId);
}

function relayToAgent(uiSocket, event, payload, ack) {
  const outletId = payload && payload.outletId;
  if (typeof ack !== 'function') return;            // event is useless without an ack

  if (!outletId)            return ack({ success:false, code:'BAD_REQUEST',          message:'outletId required' });
  const agent = getAgent(outletId);
  if (!agent)               return ack({ success:false, code:'PRINTER_AGENT_OFFLINE', message:'Print agent offline' });

  agent.socket
    .timeout(ACK_TIMEOUT_MS)
    .emit(event, payload, (err, agentResponse) => {
      if (err) {                                     // agent didn't ack in time
        return ack({ success:false, code:'PRINTER_AGENT_TIMEOUT', message:'Agent did not respond' });
      }
      agent.lastSeenAt = new Date().toISOString();
      ack(agentResponse);                            // pass agent's envelope straight through
    });
}
```

`relayPrintJob` is the same shape but: wrap the UI payload into the §1.3 envelope,
use the longer timeout, and on failure apply the offline policy in §5.

---

## 5. Offline / Failure Policy (decide & document)

When a print job is requested but the agent is **offline or times out**, the
backend MUST do **one** of these — recommended: **Option A**.

| | Option A — Reject (recommended) | Option B — Queue & flush |
|---|---|---|
| Behavior | Ack UI `{success:false, code:'PRINTER_AGENT_OFFLINE'}` immediately | Persist job per outlet; flush on next `register-printer-service` |
| UI does | Show error / fall back to `window.print()` | Show "queued, will print when agent online" |
| Server cost | None | Storage + dedup + TTL (avoid printing stale receipts) |
| Risk | User must retry | Late/duplicate prints if not TTL'd |

**Never** `emit('print-job')` without an ack and assume success — that silently
loses receipts. Always confirm via ack.

If Option B: cap queue size, set a TTL (e.g. 5 min — a 1-hour-old KOT must not
print), and dedupe by a UI-supplied idempotency key.

---

## 6. Validation & Security (do not skip)

1. **No JWT, no token, no user auth.** Socket connections are open. The **only**
   identity check is: does the `outletId` exist in the outlets table?
   - On `register-printer-service` (agent) and `get-printer-service` (UI),
     verify the outlet exists; on unknown outlet, ack
     `{ success:false, code:'INVALID_OUTLET' }` and (for the agent)
     `socket.disconnect(true)`.
   - The agent owns its `outletId` (set in its `.env` / tray). The backend
     trusts whichever `outletId` it sends, after the existence check.
2. **`ipAddress` from handshake only** — ignore any client-sent IP.
3. **Rate-limit** `get-health` / `get-printers` per socket (e.g. ≤ 1/sec) — UIs
   tend to poll; the agent enumerates printers on each call.
4. **Payload caps** — `print-job` SVG arrays can be large; enforce a max body /
   image count consistent with the agent (`security.maxBodyBytes`, default 25 MB).
5. **Don't log base64 image bodies.** Log sizes and counts only.

---

## 7. Step-by-Step Implementation Checklist

> Do these in order. Each step is independently testable.

- [ ] **Step 1 — Rooms & registry.** Add `agentsByOutlet` / `agentBySocketId`
      maps and `serializeOutlet()`. No behavior change yet.
- [ ] **Step 2 — Outlet existence check.** Add a single helper
      `outletExists(outletId) -> bool` (one query against the outlets table).
      Call it from `register-printer-service` and `get-printer-service`; reject
      unknown outlets with `INVALID_OUTLET`. **No** JWT / user / token auth.
- [ ] **Step 3 — `register-printer-service`.** Implement §1.1 fully incl.
      old-agent eviction, handshake IP, ack with registry snapshot, and the
      `printer-service-updated` broadcast.
- [ ] **Step 4 — `disconnect`.** Implement §3 (only clears registry if the
      socket is still the active agent for that outlet) + offline broadcast.
- [ ] **Step 5 — `get-printer-service`.** Implement §1.2 (join room + snapshot
      ack). UI can now detect online/offline. *Test the banner end-to-end.*
- [ ] **Step 6 — Relay helper.** Add `relayToAgent()` with ack timeout (§4).
- [ ] **Step 7 — `get-health` + `get-printers`.** Wire both to `relayToAgent`
      (§1.5 / §1.6). *Test against a running agent.*
- [ ] **Step 8 — `print-job` relay.** Implement UI→backend print request,
      envelope wrapping (§1.3), long ack timeout, and the §5 offline policy.
- [ ] **Step 9 — Validation/security pass** (§6): rate limits, payload caps,
      log hygiene.
- [ ] **Step 10 — Load/soak test** (§9) then roll out.

---

## 8. Multi-Instance / Scaling Notes

If the backend runs more than one node:

- Add the **`@socket.io/redis-adapter`** so room broadcasts span instances.
- The agent for an outlet is connected to **exactly one** instance. Either:
  - **Sticky routing** by `outletId`, **or**
  - Store `{ outletId → instanceId }` in Redis and forward relay requests to the
    owning instance (Redis pub/sub or the adapter's `serverSideEmit` /
    `fetchSockets()` with ack).
- `agentsByOutlet` then becomes a Redis hash; keep a per-instance cache for the
  live `socket` handle (handles aren't serializable).

---

## 9. Testing Checklist

**Unit / integration**
- [ ] Register → registry has 1 entry; room broadcast fired with that entry.
- [ ] Second register same outlet → old socket `disconnect(true)`; registry still 1.
- [ ] Agent disconnect → registry empty; `printer-service-updated` `data:[]`.
- [ ] `get-printer-service` before agent connects → `data:[]`.
- [ ] `get-health` with agent online → passes agent envelope through unchanged.
- [ ] `get-health` with **no agent** → `PRINTER_AGENT_OFFLINE` (fast, no hang).
- [ ] `get-printers` agent online → `defaultPrinter` + list.
- [ ] `print-job` agent online → ack `{success:true, data:{printed:N}}`.
- [ ] `print-job` agent offline → §5 policy (reject or queued), never silent loss.
- [ ] Agent slow (kill its event loop) → relay returns `PRINTER_AGENT_TIMEOUT`.

**Manual E2E**
- [ ] Start agent (`npm run dev`, Outlet ID + `SOCKET_SERVER_URL` set) → backend
      logs `register-printer-service`; UI banner clears.
- [ ] Kill agent → within heartbeat window UI banner reappears (offline).
- [ ] Restart agent → auto re-registers; banner clears without UI reload.

---

## 10. Quick Reference — Event Matrix

| Event | From → To | Ack? | Payload in | Ack out |
|---|---|---|---|---|
| `register-printer-service` | Agent → BE | ✅ | `{outletId,systemName,hostname,platform}` | `{success,message,data:[agent]}` |
| `get-printer-service` | UI → BE | ✅ | `{outletId}` | `{success,message,data:[agent]}` |
| `printer-service-updated` | BE → room | ❌ | — | `{outletId,data:[agent]}` (broadcast) |
| `print-job` | BE → Agent | ✅ | `{success,code,message,data:{kotImages,receiptImage,printerName,jobName}}` | `{success,message,data:{printer,jobName,printed}}` |
| `get-health` | UI → BE → Agent | ✅ | `{outletId}` | `{success,data:{status,ready,issues,service,version,uptime,printers,queueSize,defaultPrinter,...}}` |
| `get-printers` | UI → BE → Agent | ✅ | `{outletId}` | `{success,data:{defaultPrinter,printers[]}}` |

**Error codes the backend introduces:** `BAD_REQUEST`, `INVALID_OUTLET`,
`PRINTER_AGENT_OFFLINE`, `PRINTER_AGENT_TIMEOUT`.

---

## 11. What is already DONE vs TODO

| Piece | Status |
|---|---|
| Agent: connect, auto-reconnect, `register-printer-service` | ✅ done (`socket-client.js`) |
| Agent: `print-job` → silent print + ack | ✅ done |
| Agent: `get-health` / `get-printers` (+aliases) + ack with `status`/`ready`/`issues` | ✅ done |
| Backend: `register-printer-service` handler (basic) | ✅ done (swagger) |
| Backend: `print-job` emit to agent socket | ✅ done (swagger) |
| **Backend: registry + rooms (`agentsByOutlet`, `outlet:<id>`)** | ⛔ TODO |
| **Backend: outlet existence check (no JWT/user auth)** | ⛔ TODO |
| **Backend: register ack returns `data:[agent]` snapshot** | ⛔ TODO |
| **Backend: `disconnect` cleanup + `printer-service-updated` broadcast** | ⛔ TODO |
| **Backend: `get-printer-service` (UI presence check)** | ⛔ TODO |
| **Backend: relay `get-health` / `get-printers` (UI → BE → Agent)** | ⛔ TODO |
| **Backend: `print-job-request` (UI → BE → Agent) + offline policy §5** | ⛔ TODO |
| **UI: replace localhost fetch with socket emits + banner from `data:[]`** | ⛔ TODO (other repo) |

The agent will not change for this work — implement strictly against §1.
```
