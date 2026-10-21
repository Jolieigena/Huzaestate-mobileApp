# HuzaEstate mobile app

The HuzaEstate app for buyers and sellers, for Android and iOS. It is built with **React Native** (the plain command-line project, no Expo) and is a native shell around the existing web app: the website runs inside the app exactly as it does in a browser, so the app looks and behaves the same as the web app with no copy of it to keep in step.

What the shell itself adds (see `App.tsx`):

- the phone's back button goes back through the site's pages, and leaves the app from the first page;
- the page stays clear of the status bar and the gesture bar;
- a splash while the site loads, and a "Try again" screen when it cannot be reached;
- links that are not web pages (phone, email, maps, messaging apps) open the app that handles them, and addresses outside HuzaEstate and its card-payment pages open in the browser;
- the app tells the site who it is in the user agent (`HuzaEstateApp/1.0`).

Anything else you see in the app is the website. Change the website and the app changes with it.

## Where the app loads the site from

`src/config.ts`:

| Build | Address |
| --- | --- |
| Development, target `server` (the default) | `https://huzaestate.com`: the deployed site and its real database, the same listings and accounts as the website |
| Development, target `local` | `http://localhost:8085`: the website running on this computer, whose database holds only test data |
| Release | always `https://huzaestate.com` (change `PRODUCTION_URL` if the public address is different) |

Switch the development target with `npm run target:server` or `npm run target:local`; the running app reloads by itself. The live site is built against the server API (`api.dev.huzaestate.com`), so the app shows exactly the data the website shows. The local database is a different one and holds older test listings.

Inside the Android emulator, `localhost` is the emulator itself. `scripts/dev.ps1` runs `adb reverse` for these ports, which makes them reach this computer, so the website works in the app without any change:

| Port | What |
| --- | --- |
| 8085 | the website |
| 8081 | the API the website calls |
| 9000 | the listing photos (MinIO) |
| 8082 | Metro, the JavaScript server for this app (8081 is already the API, so Metro uses 8082) |

## Running on Android (Windows, no Android Studio)

Everything below was set up with Google's command-line tools only.

### One-time setup

1. Node 22 or newer and JDK 17 or newer (JDK 21 works).
2. The Android SDK, in `%LOCALAPPDATA%\Android\Sdk`: platform-tools, emulator, build-tools 37, platforms 36 and 37, NDK 27.1.12297006 and the Android 35 x86_64 system image (`google_apis`). Install them with `sdkmanager` from the command-line tools zip
   (<https://developer.android.com/studio#command-line-tools-only>), after accepting the licences with `sdkmanager --licenses`.
3. Hardware acceleration for the emulator: turn on **Windows Hypervisor Platform** (Windows Features, needs a restart) and make sure virtualisation is enabled in the BIOS. Check with `emulator -accel-check`.
4. `npm install`

### Every day

Start the website and its API (the project's Docker setup), then:

```powershell
npm run dev:android
```

It starts the emulator (creating the `HuzaPixel` emulator the first time), forwards the ports, builds the app and opens it. Metro, the JavaScript server, opens in its own window. The first build downloads a lot (Gradle and its libraries) and can take 30 to 40 minutes; later builds take a few minutes.

**Windows path limit.** The native (C++) build creates paths longer than 260 characters. The ninja that comes with the Android SDK's default CMake (3.22.1) fails on them even with Windows long paths switched on, so the project asks for CMake 3.31.6, whose ninja (1.12) handles long paths. Install it once with `sdkmanager --install cmake;3.31.6`, and make sure Windows long paths are enabled (`LongPathsEnabled` = 1 in the registry). Nothing else is needed: the project builds from its normal folder.

To start only the emulator: `npm run emulator`. It uses software rendering (the host graphics card can freeze the picture on Windows once the window loses focus), starts fresh each time, and sizes the window to about two thirds of the screen height and puts it in the top-right corner. The phone is 2400 pixels tall, and at its default size the window can be taller than a laptop screen and end up mostly off it. To run the app on a phone instead, enable USB debugging, connect it, and run `adb reverse tcp:8085 tcp:8085` and `adb reverse tcp:8081 tcp:8081` followed by `npx react-native run-android`.

### Building the installable file

```powershell
. .\scripts\android-env.ps1
cd android
.\gradlew assembleRelease     # android\app\build\outputs\apk\release\app-release.apk
.\gradlew bundleRelease       # the .aab file for Google Play
```

Release builds load `PRODUCTION_URL` and are signed with the upload key named in `android/keystore.properties` (not committed). A release build without that file stops with an error. See `PLAY_STORE.md` for publishing on Google Play.

## iOS

The `ios/` project is generated and ready, but **iOS apps can only be built on a Mac** (Xcode is required), so it cannot be built or run on this Windows computer. On a Mac with Xcode and CocoaPods:

```bash
npm install
cd ios && pod install && cd ..
npx react-native run-ios
```

`localhost:8085` works directly in the iOS simulator. To build iOS without owning a Mac, use a macOS build runner such as GitHub Actions' `macos-latest`.

## Notes

- **Store review.** Apple (and, less strictly, Google) can reject an app that is only a website in a frame. Before submitting to the App Store, add something native that the website cannot do, for example push notifications for inquiries and replies, or sign-in with the phone's biometrics. The shell is built so such features can be added next to the WebView without changing the website.
- **Photos.** The photo upload on the website uses the phone's own picker through the WebView, with no extra permission. Taking a photo straight from the camera needs the camera permission added to `android/app/src/main/AndroidManifest.xml`.
- **App icon and name.** The icons in `android/app/src/main/res/mipmap-*` and `ios/HuzaEstate/Images.xcassets` are still the React Native defaults and should be replaced with the HuzaEstate logo.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev:android` | Emulator, port forwarding, build and launch |
| `npm run emulator` | Start (and create, the first time) the Android emulator |
| `npm start` | Metro only |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit test of the shell |
