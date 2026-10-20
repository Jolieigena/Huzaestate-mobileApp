/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// The web view is a native component; the shell around it is what is tested here.
jest.mock('react-native-webview', () => ({ WebView: () => null }));

test('renders the app shell', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
