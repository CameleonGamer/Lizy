import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  Platform,
  TextInput,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores/useThemeStore';
import { JungleBackground } from '@/components/jungle/JungleBackground';
import { useDataStore } from '@/stores/useDataStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { PronoteMessage } from '@/types';
import { 
  Mail, 
  MailOpen, 
  ShieldCheck, 
  ChevronRight, 
  X, 
  User, 
  Search, 
  Inbox, 
  CheckCircle2, 
  RefreshCw,
  Sparkles,
  Building2,
  GraduationCap
} from 'lucide-react-native';

type FilterCategory = 'all' | 'unread' | 'Vie Scolaire' | 'Professeur' | 'Direction';

export default function MessagesScreen() {
  const { currentTheme } = useThemeStore();
  const { messages, markMessageAsRead } = useDataStore();
  const { authType } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedMessage, setSelectedMessage] = useState<PronoteMessage | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const unreadCount = useMemo(() => {
    return messages.filter((m) => !m.read).length;
  }, [messages]);

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      // 1. Category Filter
      if (selectedCategory === 'unread' && msg.read) return false;
      if (selectedCategory !== 'all' && selectedCategory !== 'unread') {
        const cat = msg.category || (msg.author.toLowerCase().includes('prof') ? 'Professeur' : 'Vie Scolaire');
        if (cat !== selectedCategory) return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesAuthor = msg.author.toLowerCase().includes(q);
        const matchesSubject = msg.subject.toLowerCase().includes(q);
        const matchesContent = msg.content.toLowerCase().includes(q);
        return matchesAuthor || matchesSubject || matchesContent;
      }

      return true;
    });
  }, [messages, selectedCategory, searchQuery]);

  const handleOpenMessage = (msg: PronoteMessage) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedMessage(msg);
    if (!msg.read) {
      markMessageAsRead(msg.id);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    // Simulated refresh delay or live reload
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const getCategoryBadge = (msg: PronoteMessage) => {
    const cat = msg.category || (msg.author.toLowerCase().includes('prof') ? 'Professeur' : 'Vie Scolaire');
    let color = '#10B981';
    let Icon = Building2;

    if (cat === 'Professeur') {
      color = '#38BDF8';
      Icon = GraduationCap;
    } else if (cat === 'Direction') {
      color = '#F59E0B';
      Icon = Building2;
    }

    return { label: cat, color, Icon };
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: currentTheme.colors.background }]}>
      <JungleBackground density="light" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.subtitle, { color: currentTheme.colors.textMuted }]}>
            COMMUNICATIONS ÉTABLISSEMENT
          </Text>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: currentTheme.colors.text }]}>Messages</Text>
            {unreadCount > 0 && (
              <View style={[styles.unreadBadgePill, { backgroundColor: currentTheme.colors.primary }]}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.securityBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
          <ShieldCheck size={14} color="#10B981" />
          <Text style={styles.securityText}>Chiffré Local</Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBox, { borderColor: currentTheme.colors.borderGlass, backgroundColor: currentTheme.colors.surfaceGlass }]}>
          <Search size={16} color={currentTheme.colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: currentTheme.colors.text }]}
            placeholder="Rechercher par auteur, objet ou mot-clé..."
            placeholderTextColor={currentTheme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={currentTheme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterBarWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
          <TouchableOpacity
            onPress={() => setSelectedCategory('all')}
            style={[
              styles.filterChip,
              selectedCategory === 'all'
                ? { backgroundColor: currentTheme.colors.primary, borderColor: currentTheme.colors.primary }
                : { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass },
            ]}
          >
            <Text style={[styles.filterChipText, { color: selectedCategory === 'all' ? '#FFFFFF' : currentTheme.colors.textMuted }]}>
              Tous ({messages.length})
            </Text>
          </TouchableOpacity>

          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={() => setSelectedCategory('unread')}
              style={[
                styles.filterChip,
                selectedCategory === 'unread'
                  ? { backgroundColor: currentTheme.colors.primary, borderColor: currentTheme.colors.primary }
                  : { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass },
              ]}
            >
              <Text style={[styles.filterChipText, { color: selectedCategory === 'unread' ? '#FFFFFF' : currentTheme.colors.primary }]}>
                Non lus ({unreadCount})
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setSelectedCategory('Vie Scolaire')}
            style={[
              styles.filterChip,
              selectedCategory === 'Vie Scolaire'
                ? { backgroundColor: currentTheme.colors.primary, borderColor: currentTheme.colors.primary }
                : { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass },
            ]}
          >
            <Text style={[styles.filterChipText, { color: selectedCategory === 'Vie Scolaire' ? '#FFFFFF' : currentTheme.colors.textMuted }]}>
              Vie Scolaire
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedCategory('Professeur')}
            style={[
              styles.filterChip,
              selectedCategory === 'Professeur'
                ? { backgroundColor: currentTheme.colors.primary, borderColor: currentTheme.colors.primary }
                : { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass },
            ]}
          >
            <Text style={[styles.filterChipText, { color: selectedCategory === 'Professeur' ? '#FFFFFF' : currentTheme.colors.textMuted }]}>
              Professeurs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedCategory('Direction')}
            style={[
              styles.filterChip,
              selectedCategory === 'Direction'
                ? { backgroundColor: currentTheme.colors.primary, borderColor: currentTheme.colors.primary }
                : { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass },
            ]}
          >
            <Text style={[styles.filterChipText, { color: selectedCategory === 'Direction' ? '#FFFFFF' : currentTheme.colors.textMuted }]}>
              Direction
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Messages List & Empty State */}
      <ScrollView
        contentContainerStyle={styles.scrollList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={currentTheme.colors.primary}
          />
        }
      >
        {filteredMessages.length === 0 ? (
          <GlassCard style={styles.emptyCard} foliage="vine">
            <View style={[styles.emptyIconCircle, { backgroundColor: currentTheme.colors.surfaceGlass }]}>
              <Inbox size={32} color={currentTheme.colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: currentTheme.colors.text }]}>
              {searchQuery ? 'Aucun résultat trouvé' : 'Aucun message pour le moment'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: currentTheme.colors.textMuted }]}>
              {searchQuery
                ? 'Essayez avec un autre mot-clé ou effacez la recherche.'
                : 'Toutes les communications officielles de votre établissement (Vie Scolaire, Direction, Enseignants) apparaîtront automatiquement ici.'}
            </Text>
            <GlassButton
              onPress={handleRefresh}
              style={[styles.emptyBtn, { backgroundColor: currentTheme.colors.primary }]}
            >
              <RefreshCw size={14} color="#FFFFFF" />
              <Text style={styles.emptyBtnText}>Vérifier les messages</Text>
            </GlassButton>
          </GlassCard>
        ) : (
          filteredMessages.map((msg) => {
            const badge = getCategoryBadge(msg);
            const BadgeIcon = badge.Icon;

            return (
              <TouchableOpacity
                key={msg.id}
                activeOpacity={0.8}
                onPress={() => handleOpenMessage(msg)}
              >
                <GlassCard style={[styles.msgCard, !msg.read && { borderColor: currentTheme.colors.primary }]}>
                  {/* Top Row: Author & Date */}
                  <View style={styles.msgHeader}>
                    <View style={styles.authorRow}>
                      <View style={[styles.authorIconBox, { backgroundColor: msg.read ? 'rgba(255,255,255,0.06)' : `${currentTheme.colors.primary}22` }]}>
                        {msg.read ? (
                          <MailOpen size={16} color={currentTheme.colors.textMuted} />
                        ) : (
                          <Mail size={16} color={currentTheme.colors.primary} />
                        )}
                      </View>
                      <View>
                        <View style={styles.authorTitleRow}>
                          <Text numberOfLines={1} style={[styles.authorText, { color: currentTheme.colors.text }]}>
                            {msg.author}
                          </Text>
                          {!msg.read && (
                            <View style={[styles.unreadDot, { backgroundColor: currentTheme.colors.primary }]} />
                          )}
                        </View>
                        <View style={styles.categoryPillRow}>
                          <BadgeIcon size={11} color={badge.color} />
                          <Text style={[styles.categoryPillText, { color: badge.color }]}>
                            {badge.label}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={[styles.dateText, { color: currentTheme.colors.textMuted }]}>
                      {msg.date}
                    </Text>
                  </View>

                  {/* Subject */}
                  <Text style={[styles.subjectText, { color: currentTheme.colors.text }]}>
                    {msg.subject}
                  </Text>

                  {/* Body Preview */}
                  <Text
                    numberOfLines={2}
                    style={[styles.previewText, { color: currentTheme.colors.textMuted }]}
                  >
                    {msg.content}
                  </Text>

                  {/* Bottom Action Footer */}
                  <View style={styles.readMoreRow}>
                    <Text style={[styles.readMoreText, { color: currentTheme.colors.primary }]}>
                      Lire le message
                    </Text>
                    <ChevronRight size={14} color={currentTheme.colors.primary} />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Detailed Full Message Reader Modal */}
      <Modal visible={Boolean(selectedMessage)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard} foliage="vine">
            <View style={styles.modalHeader}>
              <View style={styles.authorModalHeader}>
                <View style={[styles.authorAvatarCircle, { backgroundColor: selectedMessage?.avatarColor || currentTheme.colors.primary }]}>
                  <User size={16} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text numberOfLines={1} style={[styles.modalAuthor, { color: currentTheme.colors.text }]}>
                    {selectedMessage?.author}
                  </Text>
                  <Text style={[styles.modalDate, { color: currentTheme.colors.textMuted }]}>
                    Reçu le {selectedMessage?.date}
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setSelectedMessage(null)} style={styles.modalCloseBtn}>
                <X size={20} color={currentTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSubjectContainer}>
              <Text style={[styles.modalSubject, { color: currentTheme.colors.text }]}>
                {selectedMessage?.subject}
              </Text>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalContent, { color: currentTheme.colors.text }]}>
                {selectedMessage?.content}
              </Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <GlassButton
                onPress={() => setSelectedMessage(null)}
                style={[styles.modalActionBtn, { backgroundColor: currentTheme.colors.primary }]}
              >
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text style={styles.modalActionBtnText}>Fermer</Text>
              </GlassButton>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  unreadBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  securityText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 12,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  filterBarWrapper: {
    marginBottom: 12,
  },
  filterChipsRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollList: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 12,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 28,
    borderRadius: 20,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 18,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  msgCard: {
    marginBottom: 0,
    borderWidth: 1,
  },
  msgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  authorIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorText: {
    fontSize: 14,
    fontWeight: '700',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  categoryPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  subjectText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  previewText: {
    fontSize: 13,
    lineHeight: 18,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 20,
  },
  modalCard: {
    maxHeight: '82%',
    padding: 20,
    borderRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  authorAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAuthor: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalDate: {
    fontSize: 11,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalSubjectContainer: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  modalSubject: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalBody: {
    maxHeight: 280,
  },
  modalContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  modalFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
