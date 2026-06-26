/** Android download URLs — set in Vercel env or update after EAS builds complete. */
export const appDownloads = {
  riderApk:
    process.env.NEXT_PUBLIC_RIDER_APK_URL ??
    "https://expo.dev/artifacts/eas",
  riderAab:
    process.env.NEXT_PUBLIC_RIDER_AAB_URL ??
    "https://expo.dev/artifacts/eas",
  driverApk:
    process.env.NEXT_PUBLIC_DRIVER_APK_URL ??
    "https://expo.dev/artifacts/eas",
  driverAab:
    process.env.NEXT_PUBLIC_DRIVER_AAB_URL ??
    "https://expo.dev/artifacts/eas",
};
