import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  ActivityIndicator, 
  SafeAreaView 
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/components/glass/GlassCard';
import { useThemeStore } from '@/stores/useThemeStore';
import { SchoolDirectory, SchoolEstablishment } from '@/core/pronote/schools';
import { 
  MapPin, 
  Search, 
  Navigation, 
  X, 
  Building2, 
  ChevronRight 
} from 'lucide-react-native';

interface SchoolFinderModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSchool: (school: SchoolEstablishment) => void;
}

export const SchoolFinderModal: React.FC<SchoolFinderModalProps> = ({
  visible,
  onClose,
  onSelectSchool,
}) => {
  const { currentTheme } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [schools, setSchools] = useState<SchoolEstablishment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (visible) {
      handleDetectLocation();
    }
  }, [visible]);

  const handleDetectLocation = async () => {
    setIsLocating(true);
    setLoading(true);
    try {
      const results = await SchoolDirectory.getNearbySchools();
      setSchools(results);
    } finally {
      setIsLocating(false);
      setLoading(false);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      handleDetectLocation();
      return;
    }
    setLoading(true);
    try {
      const results = await SchoolDirectory.searchSchools(text);
      setSchools(results);
    } finally {
      setLoading(false);
    }
  };

  const handlePickSchool = (school: SchoolEstablishment) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onSelectSchool(school);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: currentTheme.colors.borderGlass }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={22} color={currentTheme.colors.text} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: currentTheme.colors.text }]}>
            Trouver mon établissement
          </Text>

          <View style={{ width: 22 }} />
        </View>

        <View style={styles.searchSection}>
          {/* Search bar */}
          <View style={[styles.searchBox, { borderColor: currentTheme.colors.borderGlass, backgroundColor: currentTheme.colors.surfaceGlass }]}>
            <Search size={18} color={currentTheme.colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: currentTheme.colors.text }]}
              placeholder="Nom, ville, code postal (ex: 75009, Condorcet)..."
              placeholderTextColor={currentTheme.colors.textMuted}
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <X size={16} color={currentTheme.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* GPS Quick Action */}
          <TouchableOpacity
            onPress={handleDetectLocation}
            disabled={isLocating}
            style={[styles.gpsButton, { borderColor: currentTheme.colors.primary, backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={currentTheme.colors.primary} />
            ) : (
              <Navigation size={16} color={currentTheme.colors.primary} />
            )}
            <Text style={[styles.gpsText, { color: currentTheme.colors.primary }]}>
              {isLocating ? 'Géolocalisation en cours...' : 'Détecter les établissements autour de moi (GPS)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results list */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={currentTheme.colors.primary} />
            <Text style={[styles.loadingText, { color: currentTheme.colors.textMuted }]}>
              Recherche des collèges et lycées...
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {schools.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Building2 size={36} color={currentTheme.colors.textMuted} />
                <Text style={[styles.emptyText, { color: currentTheme.colors.textMuted }]}>
                  Aucun établissement trouvé. Essayez avec le nom de votre ville ou code postal.
                </Text>
              </View>
            ) : (
              schools.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  activeOpacity={0.8}
                  onPress={() => handlePickSchool(s)}
                >
                  <GlassCard style={styles.schoolCard}>
                    <View style={styles.schoolRow}>
                      <View style={[styles.iconCircle, { backgroundColor: currentTheme.colors.surfaceGlass }]}>
                        <Building2 size={20} color={currentTheme.colors.primary} />
                      </View>

                      <View style={styles.schoolInfoCol}>
                        <Text style={[styles.schoolName, { color: currentTheme.colors.text }]}>
                          {s.name}
                        </Text>
                        <Text style={[styles.schoolCity, { color: currentTheme.colors.textMuted }]}>
                          {s.city} {s.postalCode ? `(${s.postalCode})` : ''} • {s.type}
                        </Text>
                      </View>

                      {s.distanceKm !== undefined && (
                        <View style={styles.distanceBadge}>
                          <MapPin size={11} color="#10B981" />
                          <Text style={styles.distanceText}>{s.distanceKm} km</Text>
                        </View>
                      )}

                      <ChevronRight size={18} color={currentTheme.colors.textMuted} />
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  gpsText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  schoolCard: {
    marginBottom: 0,
    padding: 14,
  },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  schoolInfoCol: {
    flex: 1,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '700',
  },
  schoolCity: {
    fontSize: 12,
    marginTop: 2,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  distanceText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
});
