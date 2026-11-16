import { mkdir, writeFile, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const url = process.env.TGVIDEO_APP_URL;
if (!url || new URL(url).protocol !== "https:")
  throw new Error("TGVIDEO_APP_URL must be the public HTTPS app URL.");
await mkdir("native-www", { recursive: true });
await writeFile(
  "native-www/index.html",
  '<!doctype html><html lang="es"><title>TGVideo</title><body>TGVideo</body></html>',
);
const result = spawnSync("bunx", ["cap", "add", "android"], { stdio: "inherit" });
if (result.status !== 0) throw new Error("Android project generation failed.");
const path = "android/app/src/main/AndroidManifest.xml";
const manifest = await readFile(path, "utf8");
await writeFile(
  path,
  manifest
    .replace(
      "<application",
      '<uses-feature android:name="android.software.leanback" android:required="false" /><uses-feature android:name="android.hardware.touchscreen" android:required="false" /><application',
    )
    .replace(
      '<category android:name="android.intent.category.LAUNCHER" />',
      '<category android:name="android.intent.category.LAUNCHER" /><category android:name="android.intent.category.LEANBACK_LAUNCHER" />',
    ),
);
const sync = spawnSync("bunx", ["cap", "sync", "android"], { stdio: "inherit" });
if (sync.status !== 0) throw new Error("Android sync failed.");
