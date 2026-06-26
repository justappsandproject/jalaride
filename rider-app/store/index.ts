import { configureStore } from "@reduxjs/toolkit";
import { authSlice } from "./authSlice";
import { jalaRideApi } from "./jalaRideApi";

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    [jalaRideApi.reducerPath]: jalaRideApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(jalaRideApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
