import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const FIREBASE_ENV_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_FIREBASE_MEASUREMENT_ID",
];

function injectFirebaseServiceWorker(env) {
  const missing = FIREBASE_ENV_KEYS.filter((key) => !String(env[key] || "").trim());
  if (missing.length) {
    throw new Error(
      `Missing ${missing.join(", ")}. Copy adminFlagship/.env.example to .env and set them.`,
    );
  }

  const apply = (source) =>
    FIREBASE_ENV_KEYS.reduce(
      (text, key) => text.split(`__${key}__`).join(String(env[key]).trim()),
      source,
    );

  const swPath = resolve("public/firebase-messaging-sw.js");

  return {
    name: "inject-firebase-service-worker",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || "").split("?")[0];
        if (url !== "/firebase-messaging-sw.js") {
          next();
          return;
        }
        const body = apply(readFileSync(swPath, "utf8"));
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader("Service-Worker-Allowed", "/");
        res.end(body);
      });
    },
    enforce: "post",
    closeBundle() {
      const out = resolve("dist/firebase-messaging-sw.js");
      if (!existsSync(out)) return;
      writeFileSync(out, apply(readFileSync(out, "utf8")));
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const base = env.VITE_BASE || "/";

  return {
    base,
    plugins: [react(), tailwindcss(), injectFirebaseServiceWorker(env)],
    preview: {
      host: "0.0.0.0",
      port: 60029,
    },
  };
});
