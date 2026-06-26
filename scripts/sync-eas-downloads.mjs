#!/usr/bin/env node
/**
 * Fetches latest finished EAS Android build artifact URLs and writes web/public/downloads.json
 * Usage: node scripts/sync-eas-downloads.mjs
 */
import { execSync } from "child_process";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const apps = [
  { dir: "rider-app", key: "rider" },
  { dir: "driver-app", key: "driver" },
];

function latestArtifact(appDir, profile) {
  const out = execSync(
    `npx eas-cli build:list --platform android --profile ${profile} --status finished --limit 1 --json --non-interactive`,
    { cwd: join(root, appDir), encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
  );
  const start = out.indexOf("[");
  if (start < 0) return null;
  const builds = JSON.parse(out.slice(start));
  const b = builds[0];
  if (!b) return null;
  return b.artifacts?.buildUrl ?? b.artifacts?.applicationArchiveUrl ?? null;
}

const downloads = {};
for (const { dir, key } of apps) {
  try {
    downloads[`${key}Apk`] = latestArtifact(dir, "preview");
    downloads[`${key}Aab`] = latestArtifact(dir, "production");
  } catch (e) {
    console.warn(`${key}:`, e.message);
  }
}

const outPath = join(root, "web/src/lib/downloads.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(downloads, null, 2));
console.log("Wrote", outPath, downloads);
