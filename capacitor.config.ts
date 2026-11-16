import type { CapacitorConfig } from "@capacitor/cli";
const url = process.env["TGVIDEO_APP_URL"];
if (!url || new URL(url).protocol !== "https:")
  throw new Error("Set TGVIDEO_APP_URL to the public HTTPS app origin before packaging Android.");
const config: CapacitorConfig = {
  appId: "app.tgvideo.player",
  appName: "TGVideo",
  webDir: "native-www",
  server: { url, cleartext: false },
  android: { allowMixedContent: false },
};
export default config;
