import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { ShouldStartLoadRequest, WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';
import { APP_USER_AGENT_NAME, IN_APP_HOSTS, SITE_HOSTS, WEB_URL } from './src/config';
import { requestGoogleIdToken } from './src/googleSignIn';

const GREEN = '#2ec440';
const DARK = '#0f172a';

function hostOf(url: string): string {
  const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#:]+)/i.exec(url);
  return match ? match[1].toLowerCase() : '';
}

/** The site runs inside the page, exactly as on the website. The app adds only what a phone needs around it: the back button
 *  goes back through the site's pages, the page keeps clear of the status bar and gesture bar, a failed load shows a retry screen,
 *  and links that are not web pages (phone, email, maps, messaging apps) open the right app. */
function Shell() {
  const insets = useSafeAreaInsets();
  const webView = useRef<ComponentRef<typeof WebView>>(null);
  const canGoBack = useRef(false);
  const googleBusy = useRef(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack.current) {
        webView.current?.goBack();
        return true;
      }
      return false; // at the first page: leave the app as usual
    });
    return () => subscription.remove();
  }, []);

  const shouldLoad = useCallback((request: ShouldStartLoadRequest) => {
    const url = request.url;
    if (/^(about|blob|data|javascript):/i.test(url)) return true;
    if (/^https?:\/\//i.test(url)) {
      const host = hostOf(url);
      if (IN_APP_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) return true;
      // A link to some other website opens in the browser; the page that was open stays as it was.
      if (request.isTopFrame !== false) {
        void Linking.openURL(url).catch(() => undefined);
        return false;
      }
      return true; // resources and frames inside a page (maps, fonts, embedded players) load normally
    }
    // tel:, mailto:, sms:, geo:, whatsapp: and similar go to the app that handles them.
    void Linking.openURL(url).catch(() => undefined);
    return false;
  }, []);

  // The website's Google button cannot work inside the app (Google refuses sign-in in an embedded browser), so it asks the app to do
  // the Google step: Android's own account picker. The answer goes back to the page, which signs in exactly as it does in a browser.
  // Only HuzaEstate's own pages are listened to, never a payment page or anything else that might be on screen.
  const onMessage = useCallback(async (event: WebViewMessageEvent) => {
    if (!SITE_HOSTS.includes(hostOf(event.nativeEvent.url))) return;
    let message: { type?: string } | null = null;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (message?.type !== 'google-sign-in' || googleBusy.current) return;
    googleBusy.current = true;
    const result = await requestGoogleIdToken();
    googleBusy.current = false;
    const reply = result.ok ? `credential(${JSON.stringify(result.idToken)})` : result.cancelled ? 'cancel()' : `fail(${JSON.stringify(result.message)})`;
    webView.current?.injectJavaScript(`window.__huzaNativeGoogle && window.__huzaNativeGoogle.${reply}; true;`);
  }, []);

  const retry = () => {
    setFailed(false);
    setLoading(true);
    webView.current?.reload();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" />
      <WebView
        ref={webView}
        source={{ uri: WEB_URL }}
        style={styles.web}
        applicationNameForUserAgent={APP_USER_AGENT_NAME}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        setSupportMultipleWindows={false}
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        overScrollMode="never"
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={shouldLoad}
        onMessage={onMessage}
        onNavigationStateChange={(state) => {
          canGoBack.current = state.canGoBack;
        }}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
        onHttpError={(event) => {
          // Only a failure of the page itself counts; a missing picture or a failed background call does not.
          if (event.nativeEvent.url.replace(/[#?].*$/, '').replace(/\/$/, '') === WEB_URL.replace(/\/$/, '') && event.nativeEvent.statusCode >= 500) {
            setFailed(true);
          }
        }}
      />

      {loading && !failed && (
        <View style={styles.splash} pointerEvents="none">
          <Text style={styles.brand}>
            Huza<Text style={styles.brandGreen}>Estate</Text>
          </Text>
          <ActivityIndicator style={styles.spinner} color={GREEN} />
        </View>
      )}

      {failed && (
        <View style={styles.failed}>
          <Text style={styles.brand}>
            Huza<Text style={styles.brandGreen}>Estate</Text>
          </Text>
          <Text style={styles.failedTitle}>Can&apos;t reach HuzaEstate</Text>
          <Text style={styles.failedText}>Check your internet connection and try again.</Text>
          <Pressable accessibilityRole="button" onPress={retry} style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  web: { flex: 1, backgroundColor: '#ffffff' },
  splash: { ...StyleSheet.absoluteFill, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 30, fontWeight: '800', color: DARK },
  brandGreen: { color: GREEN },
  spinner: { marginTop: 24 },
  failed: { ...StyleSheet.absoluteFill, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', padding: 32 },
  failedTitle: { marginTop: 28, fontSize: 18, fontWeight: '700', color: DARK },
  failedText: { marginTop: 8, fontSize: 15, color: '#64748b', textAlign: 'center' },
  retry: { marginTop: 28, backgroundColor: DARK, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  retryPressed: { backgroundColor: GREEN },
  retryText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
