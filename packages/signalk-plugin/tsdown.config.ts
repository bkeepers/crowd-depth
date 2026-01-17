import { defineConfig } from "tsdown";

export default defineConfig({
  platform: "node",
  sourcemap: true,
  dts: true,
  exports: true,
  unbundle: true,
  publint: true,
});
