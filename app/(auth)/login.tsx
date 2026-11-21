import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal 
} from 'react-native';
import { router } from 'expo-router';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useDataStore } from '@/stores/useDataStore';
import { SecureStorage } from '@/core/security/secureStorage';
import { GlassCard } from '@/components/glass/GlassCard';
import { pronoteClient } from '@/core/pronote/client';
import { SUPPORTED_ENTS, ENTDefinition } from '@/core/pronote/constants';
import { SchoolEstablishment } from '@/core/pronote/schools';
import { SchoolFinderModal } from '@/components/auth/SchoolFinderModal';
import { EntWebViewModal } from '@/components/auth/EntWebViewModal';
import { QrCodeScannerModal } from '@/components/auth/QrCodeScannerModal';
import { PronoteBadCredentialsError, PronoteMaintenanceError, PronoteNetworkError } from '@/core/pronote/errors';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Globe, 
  ArrowRight, 
  Sparkles,
  ChevronDown,
  Check,
  X,
  ExternalLink,
  MapPin,
  Building2,
  QrCode 
} from 'lucide-react-native';

export default function LoginScreen() {
  const { currentTheme } = useThemeStore();
  const { setSession, setLoading, isLoading } = useAuthStore();

  const [selectedSchool, setSelectedSchool] = useState<SchoolEstablishment>({
    id: '0750655E',
    name: 'Lycée Condorcet',
    city: 'Paris',
    postalCode: '75009',
    pronoteUrl: 'https://0750655e.index-education.net/pronote/',
    type: 'Lycée',
  });

  const [url, setUrl] = useState('https://0750655e.index-education.net/pronote/');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedEnt, setSelectedEnt] = useState<ENTDefinition>(SUPPORTED_ENTS[1]); // Default to ÉduConnect
  const [entModalVisible, setEntModalVisible] = useState(false);
  const [schoolFinderVisible, setSchoolFinderVisible] = useState(false);
  const [webViewModalVisible, setWebViewModalVisible] = useState(false);
  const [qrScannerVisible, setQrScannerVisible] = useState(false);

  const isDirectPronote = selectedEnt.id === 'none';

  const handleSelectSchool = (school: SchoolEstablishment) => {
    setSelectedSchool(school);
    setUrl(school.pronoteUrl);
  };

  const handleLoginDirect = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Champs requis', 'Veuillez saisir votre identifiant et mot de passe Pronote.');
      return;
    }

    useDataStore.getState().clearDataForRealUser();
    setLoading(true);
    try {
      await SecureStorage.saveCredentials({
        url: url.trim(),
        username: username.trim(),
        password: password.trim(),
        ent: selectedEnt.id,
      });

      const user = await pronoteClient.login({
        url: url.trim(),
        username: username.trim(),
        password: password.trim(),
        ent: selectedEnt.id,
      });

      const session = pronoteClient.getSession();
      setSession(
        {
          ...user,
          establishment: selectedSchool.name,
        },
        session ? session.token : 'token-ram-' + Date.now()
      );

      router.replace('/(tabs)');
    } catch (err: any) {
      if (err instanceof PronoteBadCredentialsError) {
        Alert.alert('Erreur d’identification', 'Identifiant ou mot de passe invalide pour ce compte.');
      } else if (err instanceof PronoteMaintenanceError) {
        Alert.alert('Serveur en maintenance', 'L’instance Pronote de votre établissement est temporairement fermée.');
      } else if (err instanceof PronoteNetworkError) {
        Alert.alert('Connexion impossible', err.message);
      } else {
        Alert.alert('Erreur', err?.message || 'Échec de connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEntBrowser = () => {
    if (!url.trim()) {
      Alert.alert('URL requise', 'Veuillez indiquer l’adresse Pronote de votre établissement.');
      return;
    }
    useDataStore.getState().clearDataForRealUser();
    setWebViewModalVisible(true);
  };

  const handleDemoAccess = () => {
    useDataStore.getState().loadDemoData();
    setSession(
      {
        id: 'demo-student',
        name: 'Alexandre Martin',
        establishment: selectedSchool.name,
        studentClass: 'Terminale Générale',
      },
      'demo-token-ram'
    );
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: currentTheme.colors.primary }]}>
              <Lock size={28} color="#FFFFFF" />
            </View>
            <Text style={[styles.title, { color: currentTheme.colors.text }]}>
              Connexion Pronote
            </Text>
            <Text style={[styles.subtitle, { color: currentTheme.colors.textMuted }]}>
              Détection automatique des établissements & compte élève.
            </Text>
          </View>

          {/* School Selector Card (Pronote geo-detector style) */}
          <TouchableOpacity activeOpacity={0.85} onPress={() => setSchoolFinderVisible(true)}>
            <GlassCard style={styles.schoolCard}>
              <View style={styles.schoolCardRow}>
                <View style={[styles.schoolIconCircle, { backgroundColor: currentTheme.colors.surfaceGlass }]}>
                  <Building2 size={22} color={currentTheme.colors.primary} />
                </View>
                <View style={styles.schoolTextCol}>
                  <Text style={[styles.schoolLabel, { color: currentTheme.colors.textMuted }]}>
                    ÉTABLISSEMENT SÉLECTIONNÉ
                  </Text>
                  <Text numberOfLines={1} style={[styles.schoolNameText, { color: currentTheme.colors.text }]}>
                    {selectedSchool.name}
                  </Text>
                  <Text style={[styles.schoolCityText, { color: currentTheme.colors.accent }]}>
                    {selectedSchool.city} {selectedSchool.postalCode ? `(${selectedSchool.postalCode})` : ''}
                  </Text>
                </View>
                <View style={[styles.changePill, { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: currentTheme.colors.borderGlass }]}>
                  <MapPin size={12} color={currentTheme.colors.primary} />
                  <Text style={[styles.changePillText, { color: currentTheme.colors.primary }]}>Changer (GPS)</Text>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>

          {/* QR Code Quick Connect Banner (Recommended - Official Mobile Protocol) */}
          <TouchableOpacity activeOpacity={0.85} onPress={() => setQrScannerVisible(true)}>
            <GlassCard style={{ ...styles.qrHeroCard, borderColor: currentTheme.colors.primary }}>
              <View style={styles.qrHeroRow}>
                <View style={[styles.qrIconCircle, { backgroundColor: currentTheme.colors.primary }]}>
                  <QrCode size={24} color="#FFFFFF" />
                </View>
                <View style={styles.qrTextCol}>
                  <View style={styles.qrTitleRow}>
                    <Text style={[styles.qrTitle, { color: currentTheme.colors.text }]}>
                      Connexion par QR Code
                    </Text>
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Recommandé</Text>
                    </View>
                  </View>
                  <Text style={[styles.qrSubtitle, { color: currentTheme.colors.textMuted }]}>
                    Protocole mobile officiel • Affiche 100% de vos vraies notes et devoirs sans mot de passe ENT
                  </Text>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: currentTheme.colors.borderGlass }]} />
            <Text style={[styles.dividerText, { color: currentTheme.colors.textMuted }]}>
              OU VIA ÉDUCONNECT / ENT
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: currentTheme.colors.borderGlass }]} />
          </View>

          {/* Login Card */}
          <GlassCard style={styles.card}>
            {/* ENT Selector Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: currentTheme.colors.textMuted }]}>
                ESPACE NUMÉRIQUE DE TRAVAIL (ENT)
              </Text>
              <TouchableOpacity
                onPress={() => setEntModalVisible(true)}
                style={[styles.inputBox, { borderColor: currentTheme.colors.borderGlass }]}
              >
                <Text numberOfLines={1} style={[styles.entSelectText, { color: currentTheme.colors.text }]}>
                  {selectedEnt.name}
                </Text>
                <ChevronDown size={18} color={currentTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Pronote URL (Auto filled) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: currentTheme.colors.textMuted }]}>
                URL PRONOTE (AUTO-DÉTECTÉE)
              </Text>
              <View style={[styles.inputBox, { borderColor: currentTheme.colors.borderGlass }]}>
                <Globe size={18} color={currentTheme.colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: currentTheme.colors.text }]}
                  placeholder="https://..."
                  placeholderTextColor={currentTheme.colors.textMuted}
                  value={url}
                  onChangeText={setUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* ENT SSO Mode vs Direct Pronote Mode */}
            {!isDirectPronote ? (
              <View style={styles.entNoticeBox}>
                <Text style={[styles.entNoticeText, { color: currentTheme.colors.textMuted }]}>
                  Connexion officielle via <Text style={{ color: currentTheme.colors.text, fontWeight: '700' }}>{selectedEnt.name}</Text>. La page d'authentification de votre académie s'ouvre pour synchroniser votre compte.
                </Text>

                <TouchableOpacity
                  onPress={handleOpenEntBrowser}
                  style={[styles.entLaunchButton, { backgroundColor: currentTheme.colors.primary }]}
                >
                  <ExternalLink size={18} color="#FFFFFF" />
                  <Text style={styles.loginButtonText}>Se Connecter via {selectedEnt.name}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Username */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: currentTheme.colors.textMuted }]}>
                    IDENTIFIANT PRONOTE DIRECT
                  </Text>
                  <View style={[styles.inputBox, { borderColor: currentTheme.colors.borderGlass }]}>
                    <User size={18} color={currentTheme.colors.textMuted} />
                    <TextInput
                      style={[styles.input, { color: currentTheme.colors.text }]}
                      placeholder="prenom.nom"
                      placeholderTextColor={currentTheme.colors.textMuted}
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: currentTheme.colors.textMuted }]}>
                    MOT DE PASSE
                  </Text>
                  <View style={[styles.inputBox, { borderColor: currentTheme.colors.borderGlass }]}>
                    <Lock size={18} color={currentTheme.colors.textMuted} />
                    <TextInput
                      style={[styles.input, { color: currentTheme.colors.text }]}
                      placeholder="••••••••••••"
                      placeholderTextColor={currentTheme.colors.textMuted}
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleLoginDirect}
                  disabled={isLoading}
                  style={[styles.loginButton, { backgroundColor: currentTheme.colors.primary }]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Se Connecter à Pronote</Text>
                      <ArrowRight size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </GlassCard>

          {/* Demo Button to inspect app immediately */}
          <TouchableOpacity onPress={handleDemoAccess} style={styles.demoButton}>
            <Sparkles size={16} color={currentTheme.colors.accent} />
            <Text style={[styles.demoText, { color: currentTheme.colors.accent }]}>
              Explorer avec un compte Démo
            </Text>
          </TouchableOpacity>

          {/* Privacy Footnote */}
          <View style={styles.privacyNote}>
            <ShieldCheck size={16} color="#10B981" />
            <Text style={[styles.privacyNoteText, { color: currentTheme.colors.textMuted }]}>
              Zero-Trust : Chiffrement matériel local AES-256. Aucun serveur tiers, aucun tracking.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Nearby School Finder Modal (GPS + Search) */}
      <SchoolFinderModal
        visible={schoolFinderVisible}
        onClose={() => setSchoolFinderVisible(false)}
        onSelectSchool={handleSelectSchool}
      />

      {/* ENT Selection Modal */}
      <Modal visible={entModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>
                Choisir votre ENT
              </Text>
              <TouchableOpacity onPress={() => setEntModalVisible(false)}>
                <X size={20} color={currentTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.entList}>
              {SUPPORTED_ENTS.map((ent) => {
                const isSelected = selectedEnt.id === ent.id;
                return (
                  <TouchableOpacity
                    key={ent.id}
                    onPress={() => {
                      setSelectedEnt(ent);
                      setEntModalVisible(false);
                    }}
                    style={[
                      styles.entOptionRow,
                      {
                        backgroundColor: isSelected ? currentTheme.colors.surfaceGlass : 'transparent',
                        borderColor: isSelected ? currentTheme.colors.primary : currentTheme.colors.borderGlass,
                      },
                    ]}
                  >
                    <View style={styles.entOptionTextCol}>
                      <Text style={[styles.entName, { color: currentTheme.colors.text }]}>
                        {ent.name}
                      </Text>
                      <Text style={[styles.entRegion, { color: currentTheme.colors.textMuted }]}>
                        {ent.region}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color={currentTheme.colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>

      {/* Real In-App WebView for Official ÉduConnect / ENT Login */}
      <EntWebViewModal
        visible={webViewModalVisible}
        initialUrl={url.trim()}
        entName={selectedEnt.name}
        onClose={() => setWebViewModalVisible(false)}
        onSuccess={() => {
          setWebViewModalVisible(false);
          router.replace('/(tabs)');
        }}
      />

      {/* Official Pronote Mobile QR Code Scanner */}
      <QrCodeScannerModal
        visible={qrScannerVisible}
        onClose={() => setQrScannerVisible(false)}
        onSuccess={() => {
          setQrScannerVisible(false);
          router.replace('/(tabs)');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
    gap: 14,
  },
  header: {
    alignItems: 'center',
    marginBottom: 6,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  schoolCard: {
    marginBottom: 0,
    padding: 14,
  },
  schoolCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  schoolIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  schoolTextCol: {
    flex: 1,
  },
  schoolLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  schoolNameText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  schoolCityText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  changePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  qrHeroCard: {
    marginBottom: 0,
    padding: 16,
    borderWidth: 1.5,
  },
  qrHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  qrIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrTextCol: {
    flex: 1,
  },
  qrTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  qrTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  recommendedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  recommendedText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  qrSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  card: {
    padding: 18,
    gap: 12,
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    gap: 10,
  },
  entSelectText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 13,
  },
  entNoticeBox: {
    paddingTop: 4,
    gap: 12,
  },
  entNoticeText: {
    fontSize: 12,
    lineHeight: 18,
  },
  entLaunchButton: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loginButton: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  demoButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  demoText: {
    fontSize: 13,
    fontWeight: '700',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  privacyNoteText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
  },
  modalCard: {
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  entList: {
    marginTop: 4,
  },
  entOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  entOptionTextCol: {
    flex: 1,
  },
  entName: {
    fontSize: 14,
    fontWeight: '700',
  },
  entRegion: {
    fontSize: 11,
    marginTop: 2,
  },
});
