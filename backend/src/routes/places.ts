import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { estimateAllFares } from "../services/fare.js";

const GOOGLE_KEY = process.env.GOOGLE_MAPS_SERVER_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? "";

export async function placesRoutes(app: FastifyInstance) {
  app.get("/autocomplete", async (req, reply) => {
    const q = z.object({
      input: z.string().min(2),
      sessiontoken: z.string().optional(),
    }).safeParse(req.query);
    if (!q.success) return reply.status(400).send({ error: "input required (min 2 chars)" });

    if (!GOOGLE_KEY) {
      // Demo fallback — clearly labeled
      return {
        source: "demo",
        predictions: [
          { place_id: "demo-wuse", description: "Wuse Market, Abuja (sample)" },
          { place_id: "demo-maitama", description: "Maitama District, Abuja (sample)" },
          { place_id: "demo-garki", description: "Garki Area 11, Abuja (sample)" },
          { place_id: "demo-airport", description: "Nnamdi Azikiwe Airport, Abuja (sample)" },
          { place_id: "demo-cbd", description: "Central Business District, Abuja (sample)" },
        ].filter((p) => p.description.toLowerCase().includes(q.data.input.toLowerCase()) || q.data.input.length < 4),
      };
    }

    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", q.data.input);
    url.searchParams.set("key", GOOGLE_KEY);
    url.searchParams.set("components", "country:ng");
    if (q.data.sessiontoken) url.searchParams.set("sessiontoken", q.data.sessiontoken);

    const res = await fetch(url);
    const data = (await res.json()) as {
      status: string;
      predictions?: { place_id: string; description: string }[];
    };
    return {
      source: "google",
      predictions: (data.predictions ?? []).slice(0, 5).map((p) => ({
        place_id: p.place_id,
        description: p.description,
      })),
    };
  });

  app.get("/details", async (req, reply) => {
    const q = z.object({
      place_id: z.string(),
      sessiontoken: z.string().optional(),
    }).safeParse(req.query);
    if (!q.success) return reply.status(400).send({ error: "place_id required" });

    const demos: Record<string, { lat: number; lng: number; label: string }> = {
      "demo-wuse": { lat: 9.0765, lng: 7.4814, label: "Wuse Market, Abuja" },
      "demo-maitama": { lat: 9.0882, lng: 7.4922, label: "Maitama District, Abuja" },
      "demo-garki": { lat: 9.0331, lng: 7.4864, label: "Garki Area 11, Abuja" },
      "demo-airport": { lat: 9.0065, lng: 7.2631, label: "Nnamdi Azikiwe Airport, Abuja" },
      "demo-cbd": { lat: 9.0579, lng: 7.4951, label: "Central Business District, Abuja" },
    };

    if (!GOOGLE_KEY || q.data.place_id.startsWith("demo-")) {
      const d = demos[q.data.place_id] ?? demos["demo-wuse"];
      return { source: "demo", ...d };
    }

    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", q.data.place_id);
    url.searchParams.set("fields", "geometry,formatted_address,name");
    url.searchParams.set("key", GOOGLE_KEY);
    if (q.data.sessiontoken) url.searchParams.set("sessiontoken", q.data.sessiontoken);

    const res = await fetch(url);
    const data = (await res.json()) as {
      result?: {
        geometry?: { location?: { lat: number; lng: number } };
        formatted_address?: string;
        name?: string;
      };
    };
    const loc = data.result?.geometry?.location;
    if (!loc) return reply.status(404).send({ error: "Place not found" });
    return {
      source: "google",
      lat: loc.lat,
      lng: loc.lng,
      label: data.result?.formatted_address ?? data.result?.name ?? "Destination",
    };
  });

  app.post("/directions", async (req, reply) => {
    const body = z.object({
      originLat: z.number(),
      originLng: z.number(),
      destLat: z.number(),
      destLng: z.number(),
    }).safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const { originLat, originLng, destLat, destLng } = body.data;

    // Haversine fallback + crude duration (~25 km/h city average)
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(destLat - originLat);
    const dLng = toRad(destLng - originLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(originLat)) * Math.cos(toRad(destLat)) * Math.sin(dLng / 2) ** 2;
    let distanceKm = 2 * R * Math.asin(Math.sqrt(a));
    let durationMin = Math.max(5, (distanceKm / 25) * 60);
    let polyline: string | null = null;
    let source = "haversine";

    if (GOOGLE_KEY) {
      try {
        const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
        url.searchParams.set("origin", `${originLat},${originLng}`);
        url.searchParams.set("destination", `${destLat},${destLng}`);
        url.searchParams.set("key", GOOGLE_KEY);
        const res = await fetch(url);
        const data = (await res.json()) as {
          routes?: { overview_polyline?: { points?: string }; legs?: { distance?: { value: number }; duration?: { value: number } }[] }[];
        };
        const route = data.routes?.[0];
        const leg = route?.legs?.[0];
        if (leg?.distance?.value != null) {
          distanceKm = leg.distance.value / 1000;
          durationMin = (leg.duration?.value ?? 0) / 60;
          polyline = route?.overview_polyline?.points ?? null;
          source = "google";
        }
      } catch (err) {
        app.log.warn({ err }, "Directions API failed — using haversine");
      }
    }

    const fares = estimateAllFares(distanceKm, durationMin);
    return {
      source,
      distanceKm: Math.round(distanceKm * 100) / 100,
      durationMin: Math.round(durationMin * 10) / 10,
      polyline,
      fares,
    };
  });

  app.get("/reverse", async (req, reply) => {
    const q = z.object({ lat: z.coerce.number(), lng: z.coerce.number() }).safeParse(req.query);
    if (!q.success) return reply.status(400).send({ error: "lat,lng required" });

    if (!GOOGLE_KEY) {
      return { source: "demo", label: `Current location (${q.data.lat.toFixed(4)}, ${q.data.lng.toFixed(4)})` };
    }
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${q.data.lat},${q.data.lng}`);
    url.searchParams.set("key", GOOGLE_KEY);
    const res = await fetch(url);
    const data = (await res.json()) as { results?: { formatted_address?: string }[] };
    return {
      source: "google",
      label: data.results?.[0]?.formatted_address ?? "Current location",
    };
  });
}
