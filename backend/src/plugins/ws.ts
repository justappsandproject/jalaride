import type { FastifyInstance } from "fastify";

const rideChannels = new Map<string, Set<{ send: (data: string) => void }>>();
const driverChannels = new Map<string, Set<{ send: (data: string) => void }>>();

export async function registerWs(app: FastifyInstance) {
  app.get("/ws", { websocket: true }, (socket, req) => {
    const q = req.query as { rideId?: string; driverId?: string };
    if (!q.rideId && !q.driverId) {
      socket.close(4000, "rideId or driverId required");
      return;
    }

    const client = { send: (data: string) => socket.send(data) };

    if (q.rideId) {
      let set = rideChannels.get(q.rideId);
      if (!set) {
        set = new Set();
        rideChannels.set(q.rideId, set);
      }
      set.add(client);
      socket.send(JSON.stringify({ type: "subscribed", rideId: q.rideId }));
      socket.on("close", () => {
        set?.delete(client);
        if (set && set.size === 0) rideChannels.delete(q.rideId!);
      });
    }

    if (q.driverId) {
      let set = driverChannels.get(q.driverId);
      if (!set) {
        set = new Set();
        driverChannels.set(q.driverId, set);
      }
      set.add(client);
      socket.send(JSON.stringify({ type: "subscribed", driverId: q.driverId }));
      socket.on("close", () => {
        set?.delete(client);
        if (set && set.size === 0) driverChannels.delete(q.driverId!);
      });
    }
  });

  app.broadcastRideUpdate = (rideId: string, payload: unknown) => {
    const set = rideChannels.get(rideId);
    if (!set) return;
    const msg = JSON.stringify(payload);
    for (const c of set) c.send(msg);
  };

  app.broadcastDriverLocation = (driverId: string, payload: unknown) => {
    const msg = JSON.stringify({ type: "driver_location", driverId, data: payload });
    for (const [, set] of rideChannels) {
      for (const c of set) c.send(msg);
    }
  };

  app.broadcastDriverOffer = (driverId: string, payload: unknown) => {
    const set = driverChannels.get(driverId);
    if (!set) return;
    const msg = JSON.stringify(payload);
    for (const c of set) c.send(msg);
  };
}
