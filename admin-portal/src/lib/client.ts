"use client";

import { createJalaRideClient } from "@jala-ride/shared";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("jala_ride_admin_token");
}

export const api = createJalaRideClient({
  getToken: getStoredToken,
});
