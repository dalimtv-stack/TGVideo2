# TGVideo

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Current delivery
The app includes a labelled sample catalog, search, details, email/Google/Lovable authentication, profiles, manual watched status, caption preparation, layout selection and ArtPlayer for HTTPS video sources. Telegram transport, TMDB enrichment and secure parental PIN switching are not enabled. Sample progress is illustrative.

## Android / Android TV
Capacitor loads the published web application; it is not a static TanStack export and requires connectivity. Set `TGVIDEO_APP_URL` to a published public HTTPS origin, then run `node scripts/prepare-android.mjs`. Java 21 and the Android SDK are required for `android/gradlew assembleRelease`, or open Android Studio.

Configure GitHub repository variable `TGVIDEO_APP_URL` and secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Actions generates Android/TV launcher configuration, builds, signs and verifies the APK. A `v*` tag publishes `app-release.apk` to Releases; branch builds produce an artifact. This workflow and APK have not been compiled or device-tested here. Provide TV banner/icon artwork before distribution. Enable the download action only after a real release exists. Keep generated native output and signing files out of source deliveries.

## Checks
Run `bunx vitest run src/lib/tgstorage.test.ts src/test/app-routing.test.tsx`. Real Telegram streaming, codecs, recovery emails, native navigation and external players need separate end-to-end validation.
