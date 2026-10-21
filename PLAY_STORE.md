# Publishing HuzaEstate on Google Play

## 1. Ready in this project

| Item | State |
| --- | --- |
| Package name | `com.huzaestate` (the reverse of huzaestate.com). It can never be changed once published. |
| Target Android version | API 36 (Google requires 35 or newer for new apps) |
| Permissions | `INTERNET` only |
| Release signing | The upload key is made; the release build signs with it (`android/keystore.properties`, not committed). A release build with no key stops with an error instead of using the debug key. |
| Code shrinking (R8) | On for release builds |
| Version | `appVersionCode` and `appVersionName` in `android/gradle.properties`. **The code must go up with every upload.** |
| App icon | Adaptive icon (works in every launcher shape), plus the old-style icons for old phones |
| Store art | `store/icon-512.png`, `store/feature-graphic-1024x500.png` |
| Site it loads | `https://huzaestate.com` in release builds (`PRODUCTION_URL` in `src/config.ts`) |

## 2. Keep safe: the upload key

The key is `C:\Users\aimee\Desktop\Huzalabs Work\huzaestate-release-keys\huzaestate-upload.jks`, with its password in `android/keystore.properties`.

- **Back up both files** somewhere private and separate from this computer (a password manager, an encrypted drive). Never commit them or send them in chat.
- Turn on **Play App Signing** when creating the app in Play Console (the default). Google then holds the real signing key, and this one is only your *upload* key. If it is ever lost, Google can reset it for you. Without Play App Signing, losing it means you can never update the app.

## 3. Build the file to upload

```powershell
cd "C:\Users\aimee\Desktop\Huzalabs Work\huzaestate-mobile-app"
. .\scripts\android-env.ps1
cd android
.\gradlew.bat bundleRelease
```

It needs about 6 GB of free disk space and 10 to 15 minutes. To try a release build on the emulator first, use `assembleRelease -PreactNativeArchitectures=x86_64`; the file is `android\app\build\outputs\apk\release\app-release.apk`.

The result is `android\app\build\outputs\bundle\release\app-release.aab`. Raise `appVersionCode` first for any upload after the first.

## 4. Things that need a decision before submitting (policy risks)

1. **Paying for digital features inside the app.** Google requires Google Play Billing for digital goods and services bought in an app, and takes a fee. Posting plans, listing promotions and similar are digital services. The furniture shop is physical goods, which is exempt. Choose one: hide the plan and promotion purchase screens inside the app and send people to the website, or add Google Play Billing. Submitting the app as it is risks rejection.
2. **Account deletion.** Because people can create accounts, Google requires a way to request deletion of the account and its data **inside the app**, and a **public web page** for it (its address goes into the Data safety form). The site has neither yet. Only administrators can delete accounts today.
3. **Mostly a website in a frame.** Google can reject apps that add little beyond a website. Today the app adds a bottom navigation bar, native Google sign-in, an offline screen and phone-link handling. Adding something clearly native, such as push notifications for inquiries and replies, would strengthen it.
4. **Google sign-in must be registered for the release key.** In Google Cloud (the project of the web client) the Android OAuth client needs the SHA-1 of every key the app is signed with:
   - debug: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
   - upload key: `14:39:AB:83:21:46:94:2E:6C:53:66:74:28:7B:04:F2:55:B4:5B:8E`
   - Play's app signing key: shown in Play Console, **Test and release, App integrity**, after the first upload. Users who install from Google Play get an app signed with *this* one, so Google sign-in fails without it.

## 5. Steps in Play Console

1. Create a Play developer account (one-time fee) as an **organisation**, in the name of the registered company, **Huzalabs** (HuzaEstate itself is not a registered company). Google asks for the company's registration details and a D-U-N-S number for organisation accounts. An organisation account also avoids the extra testing rule: a personal account created after 2023 must run a closed test with at least 12 testers for 14 days before it can publish. The developer name Google shows on the store page comes from this account.
2. Create the app: name HuzaEstate, default language, App (not game), Free.
3. Upload the `.aab` to **Internal testing** first and install it from the Play link on a real phone.
4. Fill in: privacy policy (`https://huzaestate.com/privacy`), app access (give reviewers a test buyer and seller login), ads (none), content rating questionnaire, target audience (18 and over, as in the Terms), data safety form, and the account-deletion URL.
5. Store listing: short and full description, `store/icon-512.png`, `store/feature-graphic-1024x500.png`, at least 2 phone screenshots (take them from the emulator on the live site).
6. Promote to Closed or Open testing, then Production.

## 6. Data safety form: what the app handles

Answer from what the platform does. Collected and linked to the person: name, email address, phone number (sellers, suppliers, orders), country, delivery address and company details (some roles), photos and descriptions of listings, messages and inquiries, purchase and order history, approximate location (from the internet address, for relevant listings), and an account identifier. Not collected by us: card numbers (handled by Stripe). Visitor statistics record the internet address and pages viewed. Data is sent over HTTPS. Account deletion: see section 4.

## 7. Draft store text (edit before use)

**Short description (80 characters):** Browse, buy, rent and sell property in Rwanda, and order furniture.

**Full description:**
HuzaEstate brings homes, builders and furniture together in one app.

- Search listings for sale and for rent with filters for price, bedrooms, type and area, on a list or a map.
- Save the homes you like and contact owners directly.
- Sellers and owners post and manage listings, answer inquiries and track their plan.
- Find professionals for design, building and renovation.
- Order furniture from suppliers.

Sign in with your email or with Google.
