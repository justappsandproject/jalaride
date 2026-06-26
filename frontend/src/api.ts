import type { AuthUser, RideDto, UserRole } from "./types";

const defaultBase = "http://localhost:4000";

function readEnvApiUrl(): string | undefined {
  const p = (globalThis as unknown as { process?: { env?: Record<string, string> } }).process;
  const v = p?.env?.NEXT_PUBLIC_API_URL;
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export function createJalaRideClient(options: { baseUrl?: string; getToken?: () => string | null }) {
  const base = options.baseUrl ?? readEnvApiUrl() ?? defaultBase;
  let getToken = options.getToken ?? (() => null);

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    };
    if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    const res = await fetch(`${base}${path}`, { ...init, headers });
    const data = (await res.json().catch(() => ({}))) as T & { error?: unknown };
    if (!res.ok) {
      throw new Error(typeof data.error === "string" ? data.error : res.statusText);
    }
    return data as T;
  }

  return {
    setTokenGetter(fn: () => string | null) {
      getToken = fn;
    },
    auth: {
      login: (body: { phone: string; password: string }) =>
        request<{ token: string; user: AuthUser }>("/v1/auth/login", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      register: (body: { phone: string; password: string; name: string; role?: UserRole }) =>
        request<{ token: string; user: AuthUser }>("/v1/auth/register", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      me: () => request<AuthUser & { driverProfile?: unknown; wallet?: unknown }>("/v1/auth/me"),
    },
    rides: {
      create: (body: {
        originLat: number;
        originLng: number;
        destLat: number;
        destLng: number;
        originLabel?: string;
        destLabel?: string;
        category?: string;
      }) => request<{ ride: RideDto }>("/v1/rides", { method: "POST", body: JSON.stringify(body) }),
      mine: () => request<RideDto[]>("/v1/rides/mine"),
      available: () => request<RideDto[]>("/v1/rides/available"),
      accept: (id: string) =>
        request<{ ride: RideDto }>(`/v1/rides/${id}/accept`, { method: "POST" }),
      enRoute: (id: string) =>
        request<{ ride: RideDto }>(`/v1/rides/${id}/en-route`, { method: "POST" }),
      start: (id: string) =>
        request<{ ride: RideDto }>(`/v1/rides/${id}/start`, { method: "POST" }),
      complete: (id: string) =>
        request<{ ride: RideDto }>(`/v1/rides/${id}/complete`, { method: "POST" }),
      cancel: (id: string) =>
        request<{ ride: RideDto }>(`/v1/rides/${id}/cancel`, { method: "POST" }),
    },
    driver: {
      online: () => request<{ driver: unknown }>("/v1/driver/online", { method: "POST" }),
      offline: () => request<{ driver: unknown }>("/v1/driver/offline", { method: "POST" }),
      location: (body: { lat: number; lng: number; heading?: number }) =>
        request<{ ok: boolean }>("/v1/driver/location", { method: "POST", body: JSON.stringify(body) }),
      vehicle: (body: { make: string; model: string; plate: string; category?: string }) =>
        request<{ vehicle: unknown }>("/v1/driver/vehicle", { method: "POST", body: JSON.stringify(body) }),
      earnings: () =>
        request<{
          totals: { completed: number; revenue: number };
          commissionRate: number;
          estimatedPayout: number;
        }>("/v1/driver/earnings/summary"),
    },
    admin: {
      pendingDrivers: () => request<unknown[]>("/v1/admin/drivers/pending"),
      liveRides: () => request<unknown[]>("/v1/admin/rides/live"),
      approveDriver: (id: string) =>
        request<{ driver: unknown }>(`/v1/admin/drivers/${id}/approve`, { method: "POST" }),
      rejectDriver: (id: string) =>
        request<{ driver: unknown }>(`/v1/admin/drivers/${id}/reject`, { method: "POST" }),
      stats: () =>
        request<{ users: number; approvedDrivers: number; ridesToday: number }>(
          "/v1/admin/stats/overview",
        ),
    },
  };
}

export type JalaRideClient = ReturnType<typeof createJalaRideClient>;

/** @deprecated Use createJalaRideClient */
export const createTrivexaClient = createJalaRideClient;
/** @deprecated Use JalaRideClient */
export type TrivexaClient = JalaRideClient;
