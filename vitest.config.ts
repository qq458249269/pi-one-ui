import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // 集成测试在本机（Windows）会跑到 5-7s，默认 5s 抖动超时。
    testTimeout: 20000,
  },
});
