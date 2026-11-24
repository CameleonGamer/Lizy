import React, { useState, useRef, useEffect } from 'react';
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
import { GlassButton } from '@/components/glass/GlassButton';
import { useAuthStore } from '@/stores/useAuthStore';
import { useDataStore } from '@/stores/useDataStore';
import { PronoteParser } from '@/core/pronote/parser';
import { formatPronoteStudentUrl } from '@/core/pronote/schools';
import { PronoteUser } from '@/types';
import { X, ShieldCheck, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react-native';

interface EntWebViewModalProps {
  visible: boolean;
  initialUrl: string;
  entName: string;
  schoolName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Script injected inside the WebView to intercept raw Pronote RPC responses
 * and monitor DOM / Window state for student identity.
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
          if (text && (text.includes('donnees') || text.includes('listeDevoirs') || text.includes('listeServices') || text.includes('listeNotes') || text.includes('moyenneGenerale') || text.includes('donneesSecurite'))) {
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

    // 2. Monkey-patch window.fetch
    if (window.fetch) {
      var origFetch = window.fetch;
      window.fetch = function() {
        var args = arguments;
        var requestUrl = (typeof args[0] === 'string') ? args[0] : (args[0] && args[0].url) || '';
        return origFetch.apply(this, args).then(function(response) {
          try {
            var clone = response.clone();
            clone.text().then(function(text) {
              if (text && (text.includes('donnees') || text.includes('listeDevoirs') || text.includes('listeServices') || text.includes('listeNotes') || text.includes('moyenneGenerale') || text.includes('donneesSecurite'))) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'PRONOTE_RPC_RESPONSE',
                  url: requestUrl,
                  data: JSON.parse(text)
                }));
              }
            }).catch(function() {});
          } catch(e) {}
          return response;
        });
      };
    }

    // 3. Continuous DOM observer for student name and class
    function scanDomIdentity() {
      try {
        var studentName = '';
        var studentClass = '';
        var schoolName = '';

        if (window.GExportation && window.GExportation.donneesSecurite) {
          studentName = window.GExportation.donneesSecurite.nomUtilisateur || '';
          studentClass = window.GExportation.donneesSecurite.libelleClasse || '';
          schoolName = window.GExportation.donneesSecurite.libelleEtablissement || '';
        }

        if (!studentName) {
          var nameSelectors = [
            '.ibe_util_texte',
            '.ibe_utilisateur_nom',
            '.ibe_nom_utilisateur',
            '.GIdentite',
            '[id*="GIdentite"]',
            '.nom-etudiant',
            '[id*="header_user"]',
            '.user-name',
            '.identite',
            '.ibe_util'
          ];
          for (var i = 0; i < nameSelectors.length; i++) {
            var el = document.querySelector(nameSelectors[i]);
            if (el && el.innerText && el.innerText.trim()) {
              studentName = el.innerText.trim();
              break;
            }
          }
        }

        if (!studentClass) {
          var classSelectors = ['.ibe_classe', '.classe-etudiant', '[id*="header_classe"]', '.user-class'];
          for (var j = 0; j < classSelectors.length; j++) {
            var elC = document.querySelector(classSelectors[j]);
            if (elC && elC.innerText && elC.innerText.trim()) {
              studentClass = elC.innerText.trim();
              break;
            }
          }
        }

        if (!studentName && document.title && document.title.includes('PRONOTE')) {
          var parts = document.title.split('-');
          if (parts.length >= 2) {
            studentName = parts[1].trim();
            if (parts.length >= 3) {
              schoolName = schoolName || parts[2].trim();
            }
          }
        }

        var isPronote = window.location.href.includes('index-education.net') || window.location.href.includes('pronote') || window.location.href.includes('eleve.html');

        if (studentName || isPronote) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PRONOTE_IDENTITY_FOUND',
            name: studentName,
            studentClass: studentClass,
            schoolName: schoolName || document.title,
            url: window.location.href,
            isPronote: isPronote
          }));
        }
      } catch(e) {}
    }

    setInterval(scanDomIdentity, 1200);
    setTimeout(scanDomIdentity, 600);
  })();
  true;
`;

export const EntWebViewModal: React.FC<EntWebViewModalProps> = ({
  visible,
  initialUrl,
  entName,
  schoolName,
  onClose,
  onSuccess,
}) => {
  const { currentTheme } = useThemeStore();
  const { setSession } = useAuthStore();
  const { syncRealData } = useDataStore();
  const webViewRef = useRef<any>(null);

  const targetUrl = formatPronoteStudentUrl(initialUrl);

  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(targetUrl);
  const [canSyncNow, setCanSyncNow] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const detectedUserRef = useRef<PronoteUser | null>(null);

  useEffect(() => {
    if (visible) {
      setCanSyncNow(false);
      setIsFinishing(false);
      detectedUserRef.current = null;
    }
  }, [visible]);

  const handleMessage = async (event: any) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);

      if (payload.type === 'PRONOTE_RPC_RESPONSE') {
        const rawRpc = payload.data;
        setCanSyncNow(true);

        // 1. Parse identity
        const userParsed = PronoteParser.parseUser(rawRpc);
        if (userParsed) {
          detectedUserRef.current = {
            id: 'user-ent-' + Date.now(),
            name: userParsed.name,
            establishment: userParsed.establishment || schoolName || entName,
            studentClass: userParsed.studentClass,
          };
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
        if (payload.name) {
          detectedUserRef.current = {
            id: 'user-ent-' + Date.now(),
            name: payload.name,
            establishment: payload.schoolName || schoolName || entName,
            studentClass: payload.studentClass,
          };
        }
      }
    } catch {}
  };

  const handleNavigationChange = (navState: any) => {
    const url = navState.url;
    setCurrentUrl(url);

    const isPronoteStudentArea = 
      url.includes('eleve.html') || 
      url.includes('index-education.net') ||
      url.includes('/pronote/?identifiant=') ||
      url.includes('ticket=ST-');

    if (isPronoteStudentArea) {
      setCanSyncNow(true);
      webViewRef.current?.injectJavaScript(INJECTED_RPC_SNIFFER);
    }
  };

  const forceSync = async () => {
    if (isFinishing) return;
    setIsFinishing(true);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    webViewRef.current?.injectJavaScript(INJECTED_RPC_SNIFFER);

    // Resolve student identity
    const finalUser: PronoteUser = detectedUserRef.current || {
      id: 'user-ent-' + Date.now(),
      name: 'Élève Pronote',
      establishment: schoolName || entName,
      studentClass: '',
    };

    // Save persistent session in SecureStorage
    await setSession(
      finalUser,
      'token-ent-' + Date.now(),
      'ent',
      targetUrl
    );

    setTimeout(() => {
      onSuccess();
    }, 400);
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
            <GlassButton
              onPress={forceSync}
              disabled={isFinishing}
              style={[
                styles.syncBtn, 
                { 
                  backgroundColor: canSyncNow ? currentTheme.colors.primary : 'rgba(99, 102, 241, 0.4)',
                  borderColor: canSyncNow ? '#FFFFFF' : 'transparent',
                }
              ]}
            >
              {isFinishing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={14} color="#FFFFFF" />
                  <Text style={styles.syncBtnText}>Valider</Text>
                </>
              )}
            </GlassButton>
            <TouchableOpacity onPress={reloadPage} style={styles.reloadBtn}>
              <RefreshCw size={17} color={currentTheme.colors.textMuted} />
            </TouchableOpacity>
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
          source={{ uri: targetUrl }}
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
          setSupportMultipleWindows={false}
          javaScriptCanOpenWindowsAutomatically={true}
          mixedContentMode="always"
          originWhitelist={['*']}
          userAgent="Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36"
          style={styles.webView}
        />

        {/* Floating Quick Action Banner when on Pronote */}
        {canSyncNow && (
          <View style={[styles.floatingBanner, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.primary }]}>
            <View style={styles.floatingBannerTextCol}>
              <Text style={[styles.floatingBannerTitle, { color: currentTheme.colors.text }]}>
                Connexion réussie ?
              </Text>
              <Text style={[styles.floatingBannerSubtitle, { color: currentTheme.colors.textMuted }]}>
                {detectedUserRef.current?.name ? `Bonjour ${detectedUserRef.current.name}` : 'Appuyez pour synchroniser et ouvrir Lizy'}
              </Text>
            </View>
            <GlassButton
              onPress={forceSync}
              disabled={isFinishing}
              style={[styles.floatingBannerBtn, { backgroundColor: currentTheme.colors.primary }]}
            >
              {isFinishing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.floatingBannerBtnText}>Terminer</Text>
                  <ArrowRight size={14} color="#FFFFFF" />
                </>
              )}
            </GlassButton>
          </View>
        )}
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
    gap: 8,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
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
  floatingBanner: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingBannerTextCol: {
    flex: 1,
    marginRight: 12,
  },
  floatingBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  floatingBannerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  floatingBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  floatingBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
