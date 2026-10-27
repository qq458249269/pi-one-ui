// 内置主题必须通过 Pi 的严格主题 schema 校验：pi 会整份拒绝任何多写键的主题
// （colors/export 都是 additionalProperties:false），后果是 cc-dark / cc-light 直接不可用。
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** 找 Pi 的 theme-schema.json：PI_INSTALL_DIR > 本地 devDependency > 全局装到 ~/.pi 的包。 */
function schemaFile(): string | null {
  const roots = [
    process.env.PI_INSTALL_DIR,
    path.join(
      import.meta.dirname,
      "..",
      "..",
      "node_modules",
      "@earendil-works",
      "pi-coding-agent",
    ),
    path.join(
      os.homedir(),
      ".pi",
      "agent",
      "npm",
      "node_modules",
      "@earendil-works",
      "pi-coding-agent",
    ),
  ].filter((r): r is string => Boolean(r));
  for (const root of roots) {
    for (const rel of [
      "dist/modes/interactive/theme/theme-schema.json",
      "theme/theme-schema.json",
    ]) {
      const p = path.join(root, rel);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

const file = schemaFile();
const themes = ["cc-dark", "cc-light"].map((name) => ({
  name,
  theme: JSON.parse(
    fs.readFileSync(
      path.join(import.meta.dirname, "..", "..", "themes", `${name}.json`),
      "utf8",
    ),
  ) as Record<string, unknown>,
}));

describe("built-in themes", () => {
  it.skipIf(!file)("只有 schema 允许的键", () => {
    const schema = JSON.parse(fs.readFileSync(file as string, "utf8")) as {
      additionalProperties: boolean;
      properties: Record<
        string,
        { additionalProperties?: boolean; properties?: Record<string, unknown> }
      >;
    };
    for (const { name, theme } of themes) {
      for (const [section, keys] of Object.entries(theme)) {
        const sub = schema.properties[section];
        expect(
          sub,
          `${name}: 顶层键 ${section} 不在 pi schema 内`,
        ).toBeDefined();
        if (sub?.additionalProperties !== false) continue;
        const bad = Object.keys(keys as object).filter(
          (k) => !(k in (sub.properties ?? {})),
        );
        expect(bad, `${name}: ${section} 里有 pi 不认的键`).toEqual([]);
      }
    }
  });
});
