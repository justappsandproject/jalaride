/** Android download URLs — from env, downloads.json, or EAS defaults. */
import downloadsFile from "./downloads.json";

const fileUrls = downloadsFile as {
  riderApk?: string | null;
  riderAab?: string | null;
  driverApk?: string | null;
  driverAab?: string | null;
};

export const appDownloads = {
  riderApk:
    process.env.NEXT_PUBLIC_RIDER_APK_URL ??
    fileUrls.riderApk ??
    "#download-rider",
  riderAab:
    process.env.NEXT_PUBLIC_RIDER_AAB_URL ??
    fileUrls.riderAab ??
    "#download-rider",
  driverApk:
    process.env.NEXT_PUBLIC_DRIVER_APK_URL ??
    fileUrls.driverApk ??
    "#download-driver",
  driverAab:
    process.env.NEXT_PUBLIC_DRIVER_AAB_URL ??
    fileUrls.driverAab ??
    "#download-driver",
};
