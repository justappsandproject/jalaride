# Jala Ride — Flutter Mobile Apps

Native Android apps built with Flutter (replaces Expo/EAS for reliable APK builds).

## Apps

| App | Directory | Package ID |
|-----|-----------|------------|
| Rider | `jala_rider/` | `com.jalaride.rider` |
| Driver | `jala_driver/` | `com.jalaride.driver` |

API base URL: `https://jala-ride-api.onrender.com` (override with `--dart-define=API_URL=...`)

## Build APK (local)

```bash
cd flutter/jala_rider
flutter pub get
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk

cd ../jala_driver
flutter build apk --release
```

## Build AAB (Play Store)

```bash
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
```

## Copy to website downloads

```bash
cp jala_rider/build/app/outputs/flutter-apk/app-release.apk ../../web/public/downloads/jala-ride-rider.apk
cp jala_driver/build/app/outputs/flutter-apk/app-release.apk ../../web/public/downloads/jala-ride-driver.apk
```

## Features

**Rider:** Welcome → Auth → Home (book ride) → Trips → Wallet → Active ride card demo

**Driver:** Welcome → Register/Login → Go online → Trip request modal → Earnings → Weekly remittance

Legacy Expo apps remain in `rider-app/` and `driver-app/` but are superseded by these Flutter builds.
