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
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useDataStore } from '@/stores/useDataStore';
import { SecureStorage } from '@/core/security/secureStorage';
import { PronoteParser } from '@/core/pronote/parser';
import { X, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react-native';

interface EntWebViewModalProps {
  visible: boolean;
  initialUrl: string;
  entName: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Script injected inside the WebView to intercept raw Pronote RPC responses
 */
const INJECTED_RPC_SNIFFER = `
  (function() {
    if (window.__LIZY_SNIFFER_ATTACHED__) return;
    window.__LIZY_SNIFFER_ATTACHED__ = true;

    // 1. Monkey-patch XMLHttpRequest to capture all Pronote JSON-RPC calls
    var origOpen = XMLHttpRequest.prototype.open;
    var origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
      this._targetUrl = url;
      return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function() {
      this.addEventListener('load', function() {
        try {
          var text = this.responseText;
          if (text && (text.includes('donnees') || text.includes('listeDevoirs') || text.includes('listeServices') || text.includes('listeNotes') || text.includes('moyenneGenerale'))) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PRONOTE_RPC_RESPONSE',
              url: this._targetUrl,
              data: JSON.parse(text)
            }));
          }
        } catch(e) {}
      });
      return origSend.apply(this, arguments);
    };

    // 2. Continuous DOM observer for student name and class
    function scanDomIdentity() {
      try {
        var studentName = '';
        var studentClass = '';
        var schoolName = '';

        var nameSelectors = ['.ibe_utilisateur_nom', '.nom-etudiant', '[id*="header_user"]', '.user-name', '.identite'];
        for (var i = 0; i < nameSelectors.length; i++) {
          var el = document.querySelector(nameSelectors[i]);
          if (el && el.innerText && el.innerText.trim()) {
            studentName = el.innerText.trim();
            break;
          }
        }

        var classSelectors = ['.ibe_classe', '.classe-etudiant', '[id*="header_classe"]', '.user-class'];
        for (var j = 0; j < classSelectors.length; j++) {
          var elC = document.querySelector(classSelectors[j]);
          if (elC && elC.innerText && elC.innerText.trim()) {
            studentClass = elC.innerText.trim();
            break;
          }
        }

        if (window.GExportation && window.GExportation.donneesSecurite) {
          if (window.GExportation.donneesSecurite.nomUtilisateur) {
            studentName = studentName || window.GExportation.donneesSecurite.nomUtilisateur;
          }
          if (window.GExportation.donneesSecurite.libelleClasse) {
            studentClass = studentClass || window.GExportation.donneesSecurite.libelleClasse;
          }
          if (window.GExportation.donneesSecurite.libelleEtablissement) {
            schoolName = schoolName || window.GExportation.donneesSecurite.libelleEtablissement;
          }
        }

        if (studentName) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PRONOTE_IDENTITY_FOUND',
            name: studentName,
            studentClass: studentClass,
            schoolName: schoolName || document.title,
            url: window.location.href
          }));
        }
      } catch(e) {}
    }

    setInterval(scanDomIdentity, 1500);
    setTimeout(scanDomIdentity, 800);
  })();
  true;
`;

export const EntWebViewModal: React.FC<EntWebViewModalProps> = ({
  visible,
  initialUrl,
  entName,
  onClose,
  onSuccess,
}) => {
  const { currentTheme } = useThemeStore();
  const { setSession } = useAuthStore();
  const { syncRealData } = useDataStore();
  const webViewRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [canSyncNow, setCanSyncNow] = useState(false);

  const handleMessage = async (event: any) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);

      if (payload.type === 'PRONOTE_RPC_RESPONSE') {
        const rawRpc = payload.data;
        setCanSyncNow(true);

        // 1. Parse identity
        const userParsed = PronoteParser.parseUser(rawRpc);
        if (userParsed) {
          setSession(
            {
              id: 'user-' + Date.now(),
              name: userParsed.name,
              establishment: userParsed.establishment || entName,
              studentClass: userParsed.studentClass,
            },
            'token-live-' + Date.now()
          );
        }

        // 2. Parse grades and averages
        const gradesData = PronoteParser.parseGrades(rawRpc);
        if (gradesData.grades.length > 0 || gradesData.averages.length > 0 || gradesData.generalAverage > 0) {
          syncRealData({
            grades: gradesData.grades.length > 0 ? gradesData.grades : undefined,
            averages: gradesData.averages.length > 0 ? gradesData.averages : undefined,
            generalAverage: gradesData.generalAverage > 0 ? gradesData.generalAverage : undefined,
          });
        }

        // 3. Parse homework
        const hwList = PronoteParser.parseHomework(rawRpc);
        if (hwList.length > 0) {
          syncRealData({ homework: hwList });
        }

        // 4. Parse timetable
        const ttList = PronoteParser.parseTimetable(rawRpc);
        if (ttList.length > 0) {
          syncRealData({ timetable: ttList });
        }
      } else if (payload.type === 'PRONOTE_IDENTITY_FOUND') {
        setCanSyncNow(true);
        setSession(
          {
            id: 'user-' + Date.now(),
            name: payload.name,
            establishment: payload.schoolName || entName,
            studentClass: payload.studentClass,
          },
          'token-live-' + Date.now()
        );
      }
    } catch {}
  };

  const handleNavigationChange = async (navState: any) => {
    const url = navState.url;
    setCurrentUrl(url);

    const isPronoteStudentArea = 
      url.includes('eleve.html') || 
      url.includes('/pronote/?identifiant=') ||
      url.includes('ticket=ST-');

    if (isPronoteStudentArea) {
      setCanSyncNow(true);
      webViewRef.current?.injectJavaScript(INJECTED_RPC_SNIFFER);
    }
  };

  const forceSync = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    webViewRef.current?.injectJavaScript(INJECTED_RPC_SNIFFER);
    setTimeout(() => {
      onSuccess();
    }, 800);
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
              <Text style={styles.secureText}>Connexion HTTPS Officielle</Text>
            </View>
          </View>

          <View style={styles.rightActions}>
            {canSyncNow ? (
              <TouchableOpacity
                onPress={forceSync}
                style={[styles.syncBtn, { backgroundColor: currentTheme.colors.primary }]}
              >
                <CheckCircle2 size={14} color="#FFFFFF" />
                <Text style={styles.syncBtnText}>Valider</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={reloadPage} style={styles.reloadBtn}>
                <RefreshCw size={18} color={currentTheme.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
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
          onMessage={handleMessage}
          injectedJavaScriptBeforeContentLoaded={INJECTED_RPC_SNIFFER}
          injectedJavaScript={INJECTED_RPC_SNIFFER}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => {
            setLoading(false);
            webViewRef.current?.injectJavaScript(INJECTED_RPC_SNIFFER);
          }}
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
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
