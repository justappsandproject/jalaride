import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import Constants from "expo-constants";
import type { AuthState } from "./authSlice";

function getBaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_API_URL ??
    (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
    "https://jala-ride-api.onrender.com"
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
  tagTypes: ["Rides", "Trips"],
  endpoints: (build) => ({
    login: build.mutation<
      { token: string; user: { id: string; name: string; role: string } },
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
        body: { ...body, role: "RIDER" },
      }),
    }),
    myRides: build.query<unknown[], void>({
      query: () => "/v1/rides/mine",
      providesTags: ["Rides"],
    }),
    createRide: build.mutation<
      { ride: unknown },
      {
        originLat: number;
        originLng: number;
        destLat: number;
        destLng: number;
        originLabel?: string;
        destLabel?: string;
      }
    >({
      query: (body) => ({ url: "/v1/rides", method: "POST", body }),
      invalidatesTags: ["Rides"],
    }),
    cancelRide: build.mutation<{ ride: unknown }, string>({
      query: (id) => ({ url: `/v1/rides/${id}/cancel`, method: "POST" }),
      invalidatesTags: ["Rides"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useMyRidesQuery,
  useCreateRideMutation,
  useCancelRideMutation,
} = jalaRideApi;
