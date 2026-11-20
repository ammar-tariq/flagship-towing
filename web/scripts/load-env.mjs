import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export const membershipRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const MAPS_PLACEHOLDER = "__GOOGLE_MAPS_KEY__";
const API_PLACEHOLDER = "__API_BASE__";

function parseDotEnv(filePath) {
  const values = {};
  if (!existsSync(filePath)) {
    return values;
  }
  for (const raw of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx < 1) continue;
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[line.slice(0, idx).trim()] = value;
  }
  return values;
}

export function requireMembershipEnv() {
  const envPath = join(membershipRoot, ".env");
  const values = parseDotEnv(envPath);
  const mapsKey = (values.VITE_GOOGLE_MAPS_KEY || "").trim();
  const apiBase = (values.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
  if (!mapsKey) {
    throw new Error(
      "Missing VITE_GOOGLE_MAPS_KEY. Copy membershipFlagship/.env.example to membershipFlagship/.env and paste the web Maps JavaScript key from Google Cloud Console.",
    );
  }
  if (!apiBase) {
    throw new Error(
      "Missing VITE_API_BASE_URL. Copy membershipFlagship/.env.example to membershipFlagship/.env and set the production API base URL.",
    );
  }
  return { mapsKey, apiBase };
}

export function injectMembershipEnv(source, env) {
  return String(source)
    .split(MAPS_PLACEHOLDER)
    .join(env.mapsKey)
    .split(API_PLACEHOLDER)
    .join(env.apiBase);
}
