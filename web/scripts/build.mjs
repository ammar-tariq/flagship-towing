import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";
import {
  injectMembershipEnv,
  membershipRoot,
  requireMembershipEnv,
} from "./load-env.mjs";

const root = membershipRoot;
const dist = join(root, "dist");
const env = requireMembershipEnv();

execSync("npm run build:css", { cwd: root, stdio: "inherit" });

if (existsSync(dist)) {
  rmSync(dist, { recursive: true });
}
mkdirSync(dist, { recursive: true });

const htmlFiles = readdirSync(root).filter((name) => name.endsWith(".html"));
for (const file of htmlFiles) {
  const html = readFileSync(join(root, file), "utf8");
  writeFileSync(join(dist, file), injectMembershipEnv(html, env));
}

for (const dir of ["js", "css", "assets"]) {
  const src = join(root, dir);
  if (existsSync(src)) {
    cpSync(src, join(dist, dir), { recursive: true });
  }
}

const distJs = join(dist, "js");
if (existsSync(distJs)) {
  for (const file of readdirSync(distJs)) {
    if (!file.endsWith(".js")) continue;
    const injectedJs = join(distJs, file);
    writeFileSync(
      injectedJs,
      injectMembershipEnv(readFileSync(injectedJs, "utf8"), env),
    );
  }
}

const logo = join(root, "FTLogoLongNew.png");
if (existsSync(logo)) {
  cpSync(logo, join(dist, "FTLogoLongNew.png"));
}

const publicDir = join(root, "public");
if (existsSync(publicDir)) {
  cpSync(publicDir, dist, { recursive: true });
}

console.log("Build complete → dist/");
