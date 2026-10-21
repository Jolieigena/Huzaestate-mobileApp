import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

/** The website's Google "web" client id: the same one the site and the backend use. The token the app obtains is issued for it, so the
 *  backend accepts it exactly as it accepts one from the website. It is public by design (it is also in the website's page code). */
export const GOOGLE_WEB_CLIENT_ID = '370870704550-qanb1s793dkd0t5aa4nbmvvdn6i0lkul.apps.googleusercontent.com';

let configured = false;

export type GoogleResult = { ok: true; idToken: string } | { ok: false; cancelled: true } | { ok: false; cancelled?: false; message: string };

/** Opens Android's Google account picker and returns the signed Google ID token. Google refuses sign-in inside an app's embedded
 *  browser, so the website's Google button asks the app to do this step instead (see GoogleAuthButton on the website). */
export async function requestGoogleIdToken(): Promise<GoogleResult> {
  try {
    if (!configured) {
      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, scopes: ['email', 'profile'] });
      configured = true;
    }
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Forget the previous choice so the picker always shows and a different account can be picked.
    await GoogleSignin.signOut().catch(() => undefined);
    const response = await GoogleSignin.signIn();
    if (response.type !== 'success') return { ok: false, cancelled: true };
    const idToken = response.data.idToken;
    if (!idToken) return { ok: false, message: 'Google did not return a sign-in token. Please try again.' };
    return { ok: true, idToken };
  } catch (error) {
    const code = (error as { code?: string | number } | null)?.code;
    if (code === statusCodes.SIGN_IN_CANCELLED) return { ok: false, cancelled: true };
    if (code === statusCodes.IN_PROGRESS) return { ok: false, cancelled: true };
    if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) return { ok: false, message: 'Google Play services is not available on this device.' };
    // Android reports "10" (DEVELOPER_ERROR) when the app has not been registered with Google (package name and certificate).
    if (String(code) === '10') return { ok: false, message: "Google sign-in isn't set up for this app yet." };
    return { ok: false, message: 'Could not sign in with Google. Please try again.' };
  }
}
