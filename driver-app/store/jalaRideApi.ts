import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import Constants from "expo-constants";
import type { AuthState } from "./authSlice";

function getBaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_API_URL ??
    (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
    "http://localhost:3000"
  );
}

export const jalaRideApi = createApi({
  reducerPath: "jalaRideApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getBaseUrl(),
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as { auth: AuthState }).auth.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Jobs", "Driver", "Trips"],
  endpoints: (build) => ({
    login: build.mutation<
      { token: string; user: { id: string; name: string; role: string; driverStatus?: string } },
      { phone: string; password: string }
    >({
      query: (body) => ({ url: "/v1/auth/login", method: "POST", body }),
    }),
    register: build.mutation<
      { token: string; user: { id: string; name: string; role: string } },
      { phone: string; password: string; name: string }
    >({
      query: (body) => ({
        url: "/v1/auth/register",
        method: "POST",
        body: { ...body, role: "DRIVER" },
      }),
    }),
    goOnline: build.mutation<{ driver: unknown }, void>({
      query: () => ({ url: "/v1/driver/online", method: "POST" }),
      invalidatesTags: ["Driver", "Jobs"],
    }),
    goOffline: build.mutation<{ driver: unknown }, void>({
      query: () => ({ url: "/v1/driver/offline", method: "POST" }),
      invalidatesTags: ["Driver", "Jobs"],
    }),
    availableRides: build.query<unknown[], void>({
      query: () => "/v1/rides/available",
      providesTags: ["Jobs"],
    }),
    acceptRide: build.mutation<{ ride: unknown }, string>({
      query: (id) => ({ url: `/v1/rides/${id}/accept`, method: "POST" }),
      invalidatesTags: ["Jobs"],
    }),
    earnings: build.query<
      { totals: { completed: number; revenue: number }; estimatedPayout: number },
      void
    >({
      query: () => "/v1/driver/earnings/summary",
    }),
    addVehicle: build.mutation<
      { vehicle: unknown },
      { make: string; model: string; plate: string }
    >({
      query: (body) => ({ url: "/v1/driver/vehicle", method: "POST", body }),
      invalidatesTags: ["Driver"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGoOnlineMutation,
  useGoOfflineMutation,
  useAvailableRidesQuery,
  useAcceptRideMutation,
  useEarningsQuery,
  useAddVehicleMutation,
} = jalaRideApi;
