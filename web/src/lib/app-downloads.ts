/** Android & iOS download URLs — from env, downloads.json, or defaults. */
import downloadsFile from "./downloads.json";

const fileUrls = downloadsFile as {
  riderApk?: string | null;
  riderAab?: string | null;
  riderIpa?: string | null;
  driverApk?: string | null;
  driverAab?: string | null;
  driverIpa?: string | null;
};

export const appDownloads = {
  riderApk:
    process.env.NEXT_PUBLIC_RIDER_APK_URL ??
    fileUrls.riderApk ??
    "#",
  riderAab:
    process.env.NEXT_PUBLIC_RIDER_AAB_URL ??
    fileUrls.riderAab ??
    "#",
  riderIpa:
    process.env.NEXT_PUBLIC_RIDER_IPA_URL ??
    fileUrls.riderIpa ??
    "#",
  driverApk:
    process.env.NEXT_PUBLIC_DRIVER_APK_URL ??
    fileUrls.driverApk ??
    "#",
  driverAab:
    process.env.NEXT_PUBLIC_DRIVER_AAB_URL ??
    fileUrls.driverAab ??
    "#",
  driverIpa:
    process.env.NEXT_PUBLIC_DRIVER_IPA_URL ??
    fileUrls.driverIpa ??
    "#",
};
