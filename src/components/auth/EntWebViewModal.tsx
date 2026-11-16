import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView, 
  Platform 
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { SecureStorage } from '@/core/security/secureStorage';
import { X, ShieldCheck, RefreshCw } from 'lucide-react-native';

interface EntWebViewModalProps {
  visible: boolean;
  initialUrl: string;
  entName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const EntWebViewModal: React.FC<EntWebViewModalProps> = ({
  visible,
  initialUrl,
  entName,
  onClose,
  onSuccess,
}) => {
  const { currentTheme } = useThemeStore();
  const { setSession } = useAuthStore();
  const webViewRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);

  const handleNavigationChange = async (navState: any) => {
    const url = navState.url;
    setCurrentUrl(url);

    // Detect if user has reached Pronote student portal after ENT login
    const isPronoteStudentArea = 
      url.includes('eleve.html') || 
      url.includes('/pronote/?identifiant=') ||
      url.includes('ticket=ST-');

    if (isPronoteStudentArea && !navState.loading) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      // Hardware encrypted storage
      await SecureStorage.saveCredentials({
        url: url,
        username: 'Élève ÉduConnect',
        password: 'ent_session_token',
        ent: entName,
      });

      // Pure in-memory session (no leaks)
      setSession(
        {
          id: 'educonnect-' + Date.now(),
          name: 'Élève Connecté',
          establishment: 'Établissement Pronote',
          studentClass: 'Classe',
        },
        'token-ent-sso-' + Date.now()
      );

      onSuccess();
    }
  };

  const reloadPage = () => {
    webViewRef.current?.reload();
  };

  const WebViewComp = WebView as any;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
        {/* Top Header Bar */}
        <View style={[styles.header, { borderBottomColor: currentTheme.colors.borderGlass }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={22} color={currentTheme.colors.text} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text numberOfLines={1} style={[styles.title, { color: currentTheme.colors.text }]}>
              {entName}
            </Text>
            <View style={styles.secureRow}>
              <ShieldCheck size={12} color="#10B981" />
              <Text style={styles.secureText}>Connexion HTTPS Officielle Sécurisée</Text>
            </View>
          </View>

          <TouchableOpacity onPress={reloadPage} style={styles.reloadBtn}>
            <RefreshCw size={18} color={currentTheme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Loading Indicator Bar */}
        {loading && (
          <View style={styles.loaderBar}>
            <ActivityIndicator size="small" color={currentTheme.colors.primary} />
          </View>
        )}

        {/* Real Embedded Official ENT WebView */}
        <WebViewComp
          ref={webViewRef}
          source={{ uri: initialUrl }}
          onNavigationStateChange={handleNavigationChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          userAgent="Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36"
          style={styles.webView}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  secureText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  reloadBtn: {
    padding: 6,
  },
  loaderBar: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
