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
import { SecureStorage } from '@/core/security/secureStorage';
import { GlassCard } from '@/components/glass/GlassCard';
import { pronoteClient } from '@/core/pronote/client';
import { SUPPORTED_ENTS, ENTDefinition } from '@/core/pronote/constants';
import { EntWebViewModal } from '@/components/auth/EntWebViewModal';
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
  ExternalLink 
} from 'lucide-react-native';

export default function LoginScreen() {
  const { currentTheme } = useThemeStore();
  const { setSession, setLoading, isLoading } = useAuthStore();

  const [url, setUrl] = useState('https://demo.index-education.net/pronote/');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedEnt, setSelectedEnt] = useState<ENTDefinition>(SUPPORTED_ENTS[1]); // Default to ÉduConnect
  const [entModalVisible, setEntModalVisible] = useState(false);
  const [webViewModalVisible, setWebViewModalVisible] = useState(false);

  const isDirectPronote = selectedEnt.id === 'none';

  const handleLoginDirect = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Champs requis', 'Veuillez saisir votre identifiant et mot de passe Pronote.');
      return;
    }

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
      setSession(user, session ? session.token : 'token-ram-' + Date.now());

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
    setWebViewModalVisible(true);
  };

  const handleDemoAccess = () => {
    setSession(
      {
        id: 'demo-student',
        name: 'Alexandre Martin',
        establishment: 'Lycée Condorcet',
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
              Authentification 100% locale sécurisée.
            </Text>
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

            {/* Pronote URL */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: currentTheme.colors.textMuted }]}>
                URL DU SERVEUR PRONOTE DE L'ÉTABLISSEMENT
              </Text>
              <View style={[styles.inputBox, { borderColor: currentTheme.colors.borderGlass }]}>
                <Globe size={18} color={currentTheme.colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: currentTheme.colors.text }]}
                  placeholder="https://0000000x.index-education.net/pronote/"
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
                  Pour vous connecter via <Text style={{ color: currentTheme.colors.text, fontWeight: '700' }}>{selectedEnt.name}</Text>, une fenêtre sécurisée officielle s'ouvre pour saisir vos identifiants ministériels.
                </Text>

                <TouchableOpacity
                  onPress={handleOpenEntBrowser}
                  style={[styles.entLaunchButton, { backgroundColor: currentTheme.colors.primary }]}
                >
                  <ExternalLink size={18} color="#FFFFFF" />
                  <Text style={styles.loginButtonText}>Continuer vers {selectedEnt.name}</Text>
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  card: {
    padding: 20,
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    gap: 10,
  },
  entSelectText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  entNoticeBox: {
    paddingTop: 8,
    gap: 14,
  },
  entNoticeText: {
    fontSize: 13,
    lineHeight: 18,
  },
  entLaunchButton: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loginButton: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  demoButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  demoText: {
    fontSize: 14,
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
