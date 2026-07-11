"use client";

import { useEffect, useRef, useState } from "react";
import { MOBILE_API_URL } from "@/lib/mobile-backend";

type ShareRide = {
  id: string;
  status: string;
  originLabel?: string;
  destLabel?: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  driverLat?: number | null;
  driverLng?: number | null;
  driverName?: string | null;
  vehicle?: { make?: string; model?: string; plate?: string } | null;
  trust?: {
    ninVerified?: boolean;
    driverApproved?: boolean;
    accountTenureDays?: number | null;
    rating?: number | null;
  };
  expiresAt?: string;
};

const ACTIVE_STATUSES = new Set([
  "MATCHED",
  "DRIVER_EN_ROUTE",
  "ARRIVED",
  "PIN_CONFIRMED",
  "IN_PROGRESS",
]);

function formatStatus(status: string) {
  return status.replace(/_/g, " ").toLowerCase();
}

function formatCoords(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null) return "—";
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export default function SharePage({ params }: { params: { token: string } }) {
  const [ride, setRide] = useState<ShareRide | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rideRef = useRef<ShareRide | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchShare() {
      try {
        const res = await fetch(`${MOBILE_API_URL}/v1/share/${params.token}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "Share link expired or invalid");
        }
        const data = (await res.json()) as { ride: ShareRide };
        if (!cancelled) {
          rideRef.current = data.ride;
          setRide(data.ride);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          rideRef.current = null;
          setRide(null);
          setError(e instanceof Error ? e.message : "Could not load trip");
        }
      }
    }

    fetchShare();
    const interval = setInterval(() => {
      const current = rideRef.current;
      if (current == null || ACTIVE_STATUSES.has(current.status)) {
        fetchShare();
      }
    }, 8000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [params.token]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] px-6">
        <div className="max-w-md text-center">
          <p className="text-lg font-semibold text-white">Trip unavailable</p>
          <p className="mt-2 text-sm text-white/60">{error}</p>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14]">
        <p className="text-white/60">Loading trip…</p>
      </div>
    );
  }

  const vehicle = ride.vehicle;
  const vehicleLabel = vehicle
    ? [vehicle.make, vehicle.model].filter(Boolean).join(" ")
    : null;
  const trust = ride.trust ?? {};

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A2818] text-sm font-bold text-[#C9A227]">
            JR
          </div>
          <span className="font-bold">Jala Ride — Shared trip</span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-6 py-8">
        <h1 className="text-center text-2xl font-bold">{ride.driverName ?? "Your driver"}</h1>

        {vehicleLabel && (
          <p className="mt-2 text-center text-sm text-white/60">{vehicleLabel}</p>
        )}
        {vehicle?.plate && (
          <p className="mt-1 text-center text-2xl font-bold tracking-wider">{vehicle.plate}</p>
        )}

        <div className="mt-4 text-center">
          <span className="rounded-full bg-[#0A2818] px-4 py-1 text-sm capitalize text-[#C9A227]">
            {formatStatus(ride.status)}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {trust.ninVerified && (
            <span className="rounded-full bg-[#0A2818] px-3 py-1 text-xs text-[#3DAA6D]">
              NIN verified
            </span>
          )}
          {trust.driverApproved && (
            <span className="rounded-full bg-[#0A2818] px-3 py-1 text-xs text-[#3DAA6D]">
              Approved driver
            </span>
          )}
          {trust.accountTenureDays != null && trust.accountTenureDays > 0 && (
            <span className="rounded-full bg-[#0A2818] px-3 py-1 text-xs text-[#3DAA6D]">
              {trust.accountTenureDays} days on Jala
            </span>
          )}
          {trust.rating != null && trust.rating > 0 && (
            <span className="rounded-full bg-[#0A2818] px-3 py-1 text-xs text-[#3DAA6D]">
              {trust.rating.toFixed(1)} ★
            </span>
          )}
        </div>

        <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-[#141A22] p-4 text-sm">
          <p>
            <span className="text-white/50">Pickup:</span> {ride.originLabel ?? "—"}
          </p>
          <p>
            <span className="text-white/50">Drop-off:</span> {ride.destLabel ?? "—"}
          </p>
          <p>
            <span className="text-white/50">Pickup coords:</span>{" "}
            {formatCoords(ride.originLat, ride.originLng)}
          </p>
          <p>
            <span className="text-white/50">Drop-off coords:</span>{" "}
            {formatCoords(ride.destLat, ride.destLng)}
          </p>
          {(ride.driverLat != null || ride.driverLng != null) && (
            <p>
              <span className="text-white/50">Driver location:</span>{" "}
              {formatCoords(ride.driverLat, ride.driverLng)}
            </p>
          )}
        </div>

        {ride.expiresAt && (
          <p className="mt-4 text-center text-xs text-white/40">
            Link expires {new Date(ride.expiresAt).toLocaleString()}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-white/50">
          This trip is protected by Jala Ride safety standards
        </p>

        <a
          href="tel:112"
          className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#C0392B] py-4 font-bold text-white"
        >
          SOS — Call 112
        </a>
      </main>
    </div>
  );
}
