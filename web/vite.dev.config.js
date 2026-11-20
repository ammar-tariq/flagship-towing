import { defineConfig } from "vite";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import {
  injectMembershipEnv,
  membershipRoot,
  requireMembershipEnv,
} from "./scripts/load-env.mjs";

const env = requireMembershipEnv();

/** Local static server for membership + member portal pages */
export default defineConfig({
  root: ".",
  server: {
    port: 5173,
    open: "/index.html",
  },
  plugins: [
    {
      name: "inject-membership-env",
      transformIndexHtml(html) {
        return injectMembershipEnv(html, env);
      },
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = (req.url || "").split("?")[0];
          if (!url.startsWith("/js/") || !url.endsWith(".js")) {
            next();
            return;
          }
          const filePath = join(membershipRoot, url.slice(1));
          if (!existsSync(filePath)) {
            next();
            return;
          }
          const source = readFileSync(filePath, "utf8");
          if (
            source.indexOf("__API_BASE__") === -1 &&
            source.indexOf("__GOOGLE_MAPS_KEY__") === -1
          ) {
            next();
            return;
          }
          const body = injectMembershipEnv(source, env);
          res.setHeader("Content-Type", "application/javascript; charset=utf-8");
          res.end(body);
        });
      },
    },
  ],
});
