import type { FastifyInstance } from "fastify";

const rideChannels = new Map<string, Set<{ send: (data: string) => void }>>();

export async function registerWs(app: FastifyInstance) {
  app.get("/ws", { websocket: true }, (socket, req) => {
    const rideId = (req.query as { rideId?: string }).rideId;
    if (!rideId) {
      socket.close(4000, "rideId required");
      return;
    }
    let set = rideChannels.get(rideId);
    if (!set) {
      set = new Set();
      rideChannels.set(rideId, set);
    }
    const client = { send: (data: string) => socket.send(data) };
    set.add(client);
    socket.send(JSON.stringify({ type: "subscribed", rideId }));
    socket.on("close", () => {
      set?.delete(client);
      if (set && set.size === 0) rideChannels.delete(rideId);
    });
  });

  app.broadcastRideUpdate = (rideId: string, payload: unknown) => {
    const set = rideChannels.get(rideId);
    if (!set) return;
    const msg = JSON.stringify(payload);
    for (const c of set) c.send(msg);
  };

  app.broadcastDriverLocation = (driverId: string, payload: unknown) => {
    const msg = JSON.stringify({ type: "driver_location", driverId, ...payload });
    for (const [, set] of rideChannels) {
      for (const c of set) c.send(msg);
    }
  };
}
