import { access } from "node:fs/promises";

const requiredPaths = [
  "apps/web/index.html",
  "apps/web/src/main.jsx",
  "apps/web/vite.config.js",
  "apps/web/package.json",
  "api/ai.js",
];

const missingPaths = [];

for (const requiredPath of requiredPaths) {
  try {
    await access(new URL(`../${requiredPath}`, import.meta.url));
  } catch {
    missingPaths.push(requiredPath);
  }
}

if (missingPaths.length > 0) {
  console.error(`Missing monorepo paths:\n${missingPaths.join("\n")}`);
  process.exit(1);
}

console.log("Web monorepo paths verified");
