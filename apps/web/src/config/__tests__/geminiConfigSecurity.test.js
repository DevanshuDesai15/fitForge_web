import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const configSource = readFileSync(
  resolve(process.cwd(), "src/config/aiProviderConfig.js"),
  "utf8"
);
const legacyShimSource = readFileSync(
  resolve(process.cwd(), "src/config/geminiConfig.js"),
  "utf8"
);

describe("AI browser configuration security", () => {
  it("does not dynamically index import.meta.env", () => {
    expect(configSource).not.toMatch(/import\.meta\.env\s*\[/);
  });

  it("does not reference browser-side provider credential names", () => {
    expect(configSource).not.toMatch(
      /VITE_(?:HUGGINGFACE|HF|GEMINI)_API_KEY/
    );
  });

  it("keeps the legacy Gemini module as a re-export-only shim", () => {
    expect(legacyShimSource).toContain('from "./aiProviderConfig"');
    expect(legacyShimSource).not.toContain("import.meta.env");
    expect(legacyShimSource).not.toContain("const browserEnv");
  });
});
