import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView 
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/components/glass/GlassCard';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useDataStore } from '@/stores/useDataStore';
import { SecureStorage } from '@/core/security/secureStorage';
import { PronoteQrAuth, PronoteQrPayload } from '@/core/pronote/qrAuth';
import { 
  QrCode, 
  X, 
  KeyRound, 
  Camera, 
  ClipboardPaste, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react-native';

interface QrCodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QrCodeScannerModal: React.FC<QrCodeScannerModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { currentTheme } = useThemeStore();
  const { setSession } = useAuthStore();
  const { syncRealData, clearDataForRealUser } = useDataStore();

  const [permission, requestPermission] = useCameraPermissions();
  const [pinCode, setPinCode] = useState('');
  const [scannedPayload, setScannedPayload] = useState<PronoteQrPayload | null>(null);
  const [manualJsonText, setManualJsonText] = useState('');
  const [useManualInput, setUseManualInput] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scannedPayload) return;
    try {
      const parsed = PronoteQrAuth.parseScannedString(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScannedPayload(parsed);
    } catch {
      // Ignored if invalid QR
    }
  };

  const handleManualParse = () => {
    try {
      const parsed = PronoteQrAuth.parseScannedString(manualJsonText);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setScannedPayload(parsed);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'JSON du QR code invalide.');
    }
  };

  const handleConnectWithPin = async () => {
    if (!scannedPayload) {
      Alert.alert('QR code manquant', 'Veuillez scanner ou coller votre QR code Pronote.');
      return;
    }
    if (pinCode.length < 4) {
      Alert.alert('Code PIN requis', 'Veuillez saisir le code PIN à 4 chiffres défini dans Pronote.');
      return;
    }

    setIsAuthenticating(true);
    clearDataForRealUser();

    try {
      const result = await PronoteQrAuth.loginWithQr(scannedPayload, pinCode.trim());

      // Save encrypted credentials
      await SecureStorage.saveCredentials({
        url: scannedPayload.url,
        username: result.user.name,
        password: pinCode.trim(),
        ent: 'PRONOTE_QR_CODE',
      });

      // Set user session
      setSession(result.user, 'qr-token-session-' + Date.now());

      // Sync real grades, averages, homework, timetable
      syncRealData({
        grades: result.grades,
        averages: result.averages,
        generalAverage: result.generalAverage,
        homework: result.homework,
        timetable: result.timetable,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('expiré') || msg.includes('7')) {
        Alert.alert(
          'QR Code expiré ou PIN incorrect',
          'Le QR Code Pronote n’est valable que 10 minutes. Sur Pronote Web, fermez la fenêtre "Application mobile", regénérez un nouveau QR code avec votre code PIN à 4 chiffres, et rescannex-le.'
        );
      } else {
        Alert.alert('Échec de connexion', msg || 'Vérifiez votre connexion internet ou votre code PIN.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const resetAll = () => {
    setScannedPayload(null);
    setPinCode('');
    setManualJsonText('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: currentTheme.colors.borderGlass }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={currentTheme.colors.text} />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: currentTheme.colors.text }]}>
                Connexion par QR Code
              </Text>
              <View style={styles.secureRow}>
                <ShieldCheck size={12} color="#10B981" />
                <Text style={styles.secureText}>Protocole Officiel Mobile (Recommandé)</Text>
              </View>
            </View>

            <View style={{ width: 22 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Guide Step Banner */}
            <GlassCard style={styles.guideCard}>
              <Text style={[styles.guideTitle, { color: currentTheme.colors.text }]}>
                Comment obtenir le QR Code ?
              </Text>
              <Text style={[styles.guideText, { color: currentTheme.colors.textMuted }]}>
                1. Ouvre Pronote sur ton ordinateur ou navigateur.{'\n'}
                2. Clique sur l’icône QR code en haut à côté de ton nom.{'\n'}
                3. Choisis un code PIN à 4 chiffres (ex: 1234).{'\n'}
                4. Scanne le QR code affiché à l’écran ci-dessous.
              </Text>
            </GlassCard>

            {/* Mode switch */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                onPress={() => setUseManualInput(false)}
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: !useManualInput ? currentTheme.colors.primary : currentTheme.colors.surfaceGlass,
                    borderColor: currentTheme.colors.borderGlass,
                  },
                ]}
              >
                <Camera size={16} color={!useManualInput ? '#FFFFFF' : currentTheme.colors.textMuted} />
                <Text style={[styles.tabBtnText, { color: !useManualInput ? '#FFFFFF' : currentTheme.colors.textMuted }]}>
                  Caméra
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setUseManualInput(true)}
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: useManualInput ? currentTheme.colors.primary : currentTheme.colors.surfaceGlass,
                    borderColor: currentTheme.colors.borderGlass,
                  },
                ]}
              >
                <ClipboardPaste size={16} color={useManualInput ? '#FFFFFF' : currentTheme.colors.textMuted} />
                <Text style={[styles.tabBtnText, { color: useManualInput ? '#FFFFFF' : currentTheme.colors.textMuted }]}>
                  Coller le texte
                </Text>
              </TouchableOpacity>
            </View>

            {/* Scanner / Input Area */}
            {!scannedPayload ? (
              !useManualInput ? (
                <View style={styles.cameraContainer}>
                  {!permission?.granted ? (
                    <View style={styles.permissionBox}>
                      <Camera size={36} color={currentTheme.colors.primary} />
                      <Text style={[styles.permissionText, { color: currentTheme.colors.text }]}>
                        Autorisation requise pour scanner le QR Code
                      </Text>
                      <TouchableOpacity
                        onPress={requestPermission}
                        style={[styles.grantBtn, { backgroundColor: currentTheme.colors.primary }]}
                      >
                        <Text style={styles.grantBtnText}>Autoriser la Caméra</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.cameraWrapper}>
                      <CameraView
                        style={styles.cameraView}
                        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                        onBarcodeScanned={handleBarcodeScanned}
                      />
                      <View pointerEvents="none" style={styles.qrTargetOverlay}>
                        <View style={[styles.qrFrame, { borderColor: currentTheme.colors.primary }]} />
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <GlassCard style={styles.manualCard}>
                  <Text style={[styles.inputLabel, { color: currentTheme.colors.textMuted }]}>
                    COLLER LE CONTENU DU QR CODE (JSON)
                  </Text>
                  <TextInput
                    style={[styles.textArea, { color: currentTheme.colors.text, borderColor: currentTheme.colors.borderGlass }]}
                    placeholder='{"login": "...", "jeton": "...", "url": "..."}'
                    placeholderTextColor={currentTheme.colors.textMuted}
                    multiline
                    value={manualJsonText}
                    onChangeText={setManualJsonText}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={handleManualParse}
                    style={[styles.parseBtn, { backgroundColor: currentTheme.colors.primary }]}
                  >
                    <Text style={styles.parseBtnText}>Valider le QR Code</Text>
                  </TouchableOpacity>
                </GlassCard>
              )
            ) : (
              /* QR Code Detected -> Ask for 4-digit PIN */
              <GlassCard style={styles.pinCard}>
                <View style={styles.detectedBadge}>
                  <CheckCircle2 size={20} color="#10B981" />
                  <Text style={styles.detectedText}>QR Code Pronote Détecté !</Text>
                </View>

                <Text numberOfLines={1} style={[styles.urlMeta, { color: currentTheme.colors.textMuted }]}>
                  Serveur : {scannedPayload.url}
                </Text>

                <View style={styles.pinSection}>
                  <Text style={[styles.pinLabel, { color: currentTheme.colors.text }]}>
                    Entrez le code PIN à 4 chiffres :
                  </Text>
                  <View style={styles.pinInputRow}>
                    <KeyRound size={20} color={currentTheme.colors.primary} />
                    <TextInput
                      style={[styles.pinInput, { color: currentTheme.colors.text, borderColor: currentTheme.colors.primary }]}
                      placeholder="1234"
                      placeholderTextColor={currentTheme.colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={4}
                      secureTextEntry
                      value={pinCode}
                      onChangeText={setPinCode}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleConnectWithPin}
                  disabled={isAuthenticating}
                  style={[styles.connectBtn, { backgroundColor: currentTheme.colors.primary }]}
                >
                  {isAuthenticating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.connectBtnText}>Se connecter</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={resetAll} style={styles.rescanBtn}>
                  <Text style={[styles.rescanText, { color: currentTheme.colors.textMuted }]}>
                    Recommencer / Scanner à nouveau
                  </Text>
                </TouchableOpacity>
              </GlassCard>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
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
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  guideCard: {
    padding: 16,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  guideText: {
    fontSize: 12,
    lineHeight: 18,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cameraContainer: {
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  cameraView: {
    flex: 1,
  },
  qrTargetOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  permissionText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  grantBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  manualCard: {
    padding: 16,
    gap: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 12,
    textAlignVertical: 'top',
  },
  parseBtn: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parseBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  pinCard: {
    padding: 20,
    alignItems: 'center',
    gap: 14,
  },
  detectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  detectedText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 13,
  },
  urlMeta: {
    fontSize: 11,
    maxWidth: '90%',
  },
  pinSection: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  pinLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  pinInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pinInput: {
    width: 140,
    height: 50,
    borderWidth: 2,
    borderRadius: 14,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
  },
  connectBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  rescanBtn: {
    padding: 8,
  },
  rescanText: {
    fontSize: 12,
  },
});
