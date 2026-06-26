"use client";

import { useEffect, useState } from "react";

type ShareData = {
  driver_name: string;
  driver_photo?: string;
  vehicle?: string;
  plate?: string;
  pickup_address: string;
  dropoff_address: string;
  status: string;
  driver_lat?: number;
  driver_lng?: number;
};

export default function TrackPage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<ShareData | null>(null);

  useEffect(() => {
    function fetchTrip() {
      fetch(`/api/trips/share/${params.token}`)
        .then((r) => r.json())
        .then(setData)
        .catch(console.error);
    }
    fetchTrip();
    const interval = setInterval(fetchTrip, 10000);
    return () => clearInterval(interval);
  }, [params.token]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-text-secondary">Loading trip…</p>
      </div>
    );
  }

  const mapSrc =
    data.driver_lat && data.driver_lng && process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
      ? `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&center=${data.driver_lat},${data.driver_lng}&zoom=14`
      : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-accent">
            JR
          </div>
          <span className="font-bold">Jala Ride</span>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-6 py-8">
        {data.driver_photo && (
          <img
            src={data.driver_photo}
            alt={data.driver_name}
            className="mx-auto h-24 w-24 rounded-full border-4 border-primary object-cover"
          />
        )}
        <h1 className="mt-4 text-center text-2xl font-bold">{data.driver_name}</h1>
        <p className="text-center text-sm text-success">DSS Cleared ✅ | Police Cleared ✅</p>
        {data.vehicle && (
          <p className="mt-2 text-center text-text-secondary">{data.vehicle}</p>
        )}
        {data.plate && (
          <p className="mt-1 text-center text-2xl font-bold tracking-wider">{data.plate}</p>
        )}
        <div className="mt-4 text-center">
          <span className="rounded-full bg-primary/20 px-4 py-1 text-sm capitalize text-accent">
            {data.status.replace(/_/g, " ")}
          </span>
        </div>
        {mapSrc && (
          <iframe
            src={mapSrc}
            className="mt-6 h-48 w-full rounded-2xl border border-white/10"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
        <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-surface p-4">
          <p>📍 {data.pickup_address}</p>
          <p>🏁 {data.dropoff_address}</p>
        </div>
        <p className="mt-6 text-center text-sm text-text-secondary">
          This trip is protected by Jala Ride safety standards
        </p>
        <a
          href="tel:112"
          className="mt-4 flex w-full items-center justify-center rounded-xl bg-error py-4 font-bold text-white"
        >
          SOS — Call 112
        </a>
      </main>
    </div>
  );
}
