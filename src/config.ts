import { START_PATH, TARGET } from './target';

// Where the app loads HuzaEstate from. The app is a native shell around the web app, so the web app is the single source of
// truth: what ships on the website is what appears in the app, with no copy to keep in step.

/** Shown to the web app in its user agent ("HuzaEstateApp/1.0"), so the site can tell the app apart if it ever needs to. */
export const APP_USER_AGENT_NAME = 'HuzaEstateApp/1.0';

/** The deployed site, used by release builds. Change this if the public address changes. */
export const PRODUCTION_URL = 'https://huzaestate.com';

/** The site while developing. On the Android emulator, `adb reverse` (done by scripts/dev.ps1) makes this reach the website that is
 *  running on this computer, so the web app's own calls to its API on localhost work unchanged. */
export const DEVELOPMENT_URL = 'http://localhost:8085';

// While developing the app shows the deployed site (the real data) unless src/target.ts says "local"; release builds always do.
const SITE_URL = __DEV__ && TARGET === 'local' ? DEVELOPMENT_URL : PRODUCTION_URL;
export const WEB_URL = __DEV__ && START_PATH !== '/' ? `${SITE_URL}${START_PATH}` : SITE_URL;

/** The site's own addresses: the only pages the app lets ask it to do things (see onMessage in App.tsx). */
export const SITE_HOSTS = ['huzaestate.com', 'www.huzaestate.com', 'localhost', '10.0.2.2'];

/** Only the site itself and the card-payment pages are opened inside the app; any other address leaves it for the system browser. */
export const IN_APP_HOSTS = [
  'huzaestate.com',
  'www.huzaestate.com',
  'localhost',
  '10.0.2.2',
  'checkout.stripe.com',
  'js.stripe.com',
  'hooks.stripe.com',
  'm.stripe.network',
  'b.stripecdn.com',
];
