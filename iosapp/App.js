// Party Night for iPhone and iPad: a thin shell that shows the web game full-screen, like the Android apps.
// The game itself lives on the website, so game updates reach the app without a new App Store version.
import React, { useRef } from 'react';
import { Linking, StatusBar, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useKeepAwake } from 'expo-keep-awake';

const HOME = 'wahoo2k.github.io';
const START = 'https://wahoo2k.github.io/party-night/start.html?app=ios';

export default function App() {
  useKeepAwake();                       // a game stalls if the hosting phone goes to sleep
  const web = useRef(null);
  return (
    <View style={styles.fill}>
      <StatusBar hidden />
      <WebView
        ref={web}
        source={{ uri: START }}
        style={styles.fill}
        originWhitelist={['https://*']}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}     // narration and music start without an extra tap
        allowsBackForwardNavigationGestures
        bounces={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        applicationNameForUserAgent="PartyNightPhone"
        // our own pages stay in the app; anything else opens in the browser
        onShouldStartLoadWithRequest={req => { try { if (new URL(req.url).host === HOME || req.url.startsWith('about:')) return true; } catch { return true; } Linking.openURL(req.url); return false; }}
      />
    </View>
  );
}
const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: '#0b0f2c' } });
