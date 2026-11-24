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
  ActivityIndicator,
  Alert
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
  ChevronRight, 
  X, 
  User, 
  Search, 
  Inbox, 
  CheckCircle2, 
  RefreshCw,
  Sparkles,
  Building2,
  GraduationCap,
  BarChart2,
  FileCheck2,
  Paperclip,
  Vote,
  Check
} from 'lucide-react-native';

type FilterCategory = 'all' | 'unread' | 'sondages' | 'Vie Scolaire' | 'Professeur' | 'Direction';

export default function MessagesScreen() {
  const { currentTheme } = useThemeStore();
  const { messages, markMessageAsRead, answerSurvey, acknowledgeMessage } = useDataStore();
  const { authType } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedMessage, setSelectedMessage] = useState<PronoteMessage | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const unreadCount = useMemo(() => {
    return messages.filter((m) => !m.read).length;
  }, [messages]);

  const surveyCount = useMemo(() => {
    return messages.filter((m) => m.isSurvey).length;
  }, [messages]);

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      // 1. Category Filter
      if (selectedCategory === 'unread' && msg.read) return false;
      if (selectedCategory === 'sondages' && !msg.isSurvey) return false;
      if (selectedCategory !== 'all' && selectedCategory !== 'unread' && selectedCategory !== 'sondages') {
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
    
    // Pre-populate survey choices if any
    const initialAnswers: Record<string, string> = {};
    if (msg.surveyQuestions) {
      msg.surveyQuestions.forEach((q) => {
        if (q.selectedChoice) {
          initialAnswers[q.id] = q.selectedChoice;
        }
      });
    }
    setSelectedAnswers(initialAnswers);
    setSelectedMessage(msg);

    if (!msg.read) {
      markMessageAsRead(msg.id);
    }
  };

  const handleSelectChoice = (questionId: string, choice: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: choice,
    }));
  };

  const handleSubmitVote = (msg: PronoteMessage) => {
    if (!msg.surveyQuestions || msg.surveyQuestions.length === 0) return;

    // Check that at least one question has an answer
    const answeredIds = Object.keys(selectedAnswers);
    if (answeredIds.length === 0) {
      Alert.alert('Choix requis', 'Veuillez sélectionner au moins une option pour valider votre réponse.');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    for (const q of msg.surveyQuestions) {
      const choice = selectedAnswers[q.id];
      if (choice) {
        answerSurvey(msg.id, q.id, choice);
      }
    }

    // Update local modal state
    setSelectedMessage((prev) => (prev ? { ...prev, surveyAnswered: true } : null));
    Alert.alert('Vote enregistré ! 🗳️', 'Votre réponse a été transmise avec succès à l’établissement.');
  };

  const handleAcknowledge = (msg: PronoteMessage) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    acknowledgeMessage(msg.id);
    setSelectedMessage((prev) => (prev ? { ...prev, acknowledged: true } : null));
    Alert.alert('Accusé de réception validé ✍️', 'Vous avez formellement émargé et pris connaissance de ce document officiel.');
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
    if (msg.isSurvey) {
      return { label: 'Sondage', color: '#8B5CF6', Icon: BarChart2 };
    }
    if (msg.requiresAck) {
      return { label: 'Information', color: '#10B981', Icon: FileCheck2 };
    }
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

          {surveyCount > 0 && (
            <TouchableOpacity
              onPress={() => setSelectedCategory('sondages')}
              style={[
                styles.filterChip,
                selectedCategory === 'sondages'
                  ? { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }
                  : { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass },
              ]}
            >
              <Text style={[styles.filterChipText, { color: selectedCategory === 'sondages' ? '#FFFFFF' : '#8B5CF6' }]}>
                Sondages 📊 ({surveyCount})
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

                  {/* Survey or Ack status tag */}
                  {(msg.isSurvey || msg.requiresAck) && (
                    <View style={styles.msgStatusTagsRow}>
                      {msg.isSurvey && (
                        <View style={[
                          styles.statusTag, 
                          { 
                            backgroundColor: msg.surveyAnswered ? 'rgba(16, 185, 129, 0.12)' : 'rgba(139, 92, 246, 0.14)', 
                            borderColor: msg.surveyAnswered ? '#10B981' : '#8B5CF6' 
                          }
                        ]}>
                          <BarChart2 size={11} color={msg.surveyAnswered ? '#10B981' : '#8B5CF6'} />
                          <Text style={[styles.statusTagText, { color: msg.surveyAnswered ? '#10B981' : '#8B5CF6' }]}>
                            {msg.surveyAnswered ? 'Sondage complété' : 'Sondage en attente de réponse'}
                          </Text>
                        </View>
                      )}
                      {msg.requiresAck && (
                        <View style={[
                          styles.statusTag, 
                          { 
                            backgroundColor: msg.acknowledged ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.14)', 
                            borderColor: msg.acknowledged ? '#10B981' : '#F59E0B' 
                          }
                        ]}>
                          <FileCheck2 size={11} color={msg.acknowledged ? '#10B981' : '#F59E0B'} />
                          <Text style={[styles.statusTagText, { color: msg.acknowledged ? '#10B981' : '#F59E0B' }]}>
                            {msg.acknowledged ? 'Accusé validé' : 'Accusé de réception requis'}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

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
                      {msg.isSurvey ? 'Ouvrir le sondage' : msg.requiresAck ? 'Lire et émarger' : 'Lire le message'}
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

              {/* Attachments Section */}
              {selectedMessage?.attachments && selectedMessage.attachments.length > 0 && (
                <View style={styles.attachmentsSection}>
                  <Text style={[styles.sectionMiniTitle, { color: currentTheme.colors.textMuted }]}>
                    PIÈCES JOINTES ({selectedMessage.attachments.length})
                  </Text>
                  {selectedMessage.attachments.map((att) => (
                    <View key={att.id} style={[styles.attachmentItem, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass }]}>
                      <Paperclip size={14} color={currentTheme.colors.primary} />
                      <Text numberOfLines={1} style={[styles.attachmentName, { color: currentTheme.colors.text }]}>
                        {att.name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Interactive Survey Voting Box */}
              {selectedMessage?.isSurvey && selectedMessage.surveyQuestions && selectedMessage.surveyQuestions.length > 0 && (
                <View style={[styles.surveyBox, { backgroundColor: 'rgba(139, 92, 246, 0.08)', borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
                  <View style={styles.surveyBoxHeader}>
                    <BarChart2 size={18} color="#8B5CF6" />
                    <Text style={[styles.surveyBoxTitle, { color: currentTheme.colors.text }]}>
                      Sondage officiel de l'établissement
                    </Text>
                  </View>

                  {selectedMessage.surveyAnswered && (
                    <View style={styles.surveySuccessBadge}>
                      <Check size={14} color="#10B981" />
                      <Text style={styles.surveySuccessText}>Votre vote a été validé</Text>
                    </View>
                  )}

                  {selectedMessage.surveyQuestions.map((q) => (
                    <View key={q.id} style={styles.questionBlock}>
                      <Text style={[styles.questionTitle, { color: currentTheme.colors.text }]}>
                        {q.title}
                      </Text>
                      <View style={styles.choicesList}>
                        {q.choices.map((choice, idx) => {
                          const isSelected = selectedAnswers[q.id] === choice;
                          return (
                            <TouchableOpacity
                              key={idx}
                              activeOpacity={0.7}
                              onPress={() => handleSelectChoice(q.id, choice)}
                              style={[
                                styles.choiceRow,
                                {
                                  backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.2)' : currentTheme.colors.surfaceGlass,
                                  borderColor: isSelected ? '#8B5CF6' : currentTheme.colors.borderGlass,
                                },
                              ]}
                            >
                              <View style={[styles.radioCircle, isSelected && { borderColor: '#8B5CF6' }]}>
                                {isSelected && <View style={styles.radioInner} />}
                              </View>
                              <Text style={[styles.choiceText, { color: isSelected ? '#FFFFFF' : currentTheme.colors.text }]}>
                                {choice}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => selectedMessage && handleSubmitVote(selectedMessage)}
                    style={[styles.voteButton, { backgroundColor: '#8B5CF6' }]}
                  >
                    <Vote size={16} color="#FFFFFF" />
                    <Text style={styles.voteButtonText}>
                      {selectedMessage.surveyAnswered ? 'Modifier mon vote 🗳️' : 'Valider mon vote 🗳️'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Interactive Accusé de Réception Box */}
              {selectedMessage?.requiresAck && (
                <View style={[
                  styles.ackBox, 
                  { 
                    backgroundColor: selectedMessage.acknowledged ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)', 
                    borderColor: selectedMessage.acknowledged ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)' 
                  }
                ]}>
                  <View style={styles.ackBoxHeader}>
                    <FileCheck2 size={18} color={selectedMessage.acknowledged ? '#10B981' : '#F59E0B'} />
                    <Text style={[styles.ackBoxTitle, { color: currentTheme.colors.text }]}>
                      Accusé de réception officiel
                    </Text>
                  </View>
                  <Text style={[styles.ackBoxDesc, { color: currentTheme.colors.textMuted }]}>
                    {selectedMessage.acknowledged
                      ? 'Vous avez formellement attesté de la bonne réception et prise de connaissance de cette communication.'
                      : 'L’établissement demande une signature attestant que vous avez lu ce document.'}
                  </Text>
                  {!selectedMessage.acknowledged ? (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => selectedMessage && handleAcknowledge(selectedMessage)}
                      style={[styles.ackButton, { backgroundColor: '#10B981' }]}
                    >
                      <CheckCircle2 size={16} color="#FFFFFF" />
                      <Text style={styles.ackButtonText}>Confirmer la lecture (Émarger) ✍️</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.ackConfirmedRow}>
                      <Check size={14} color="#10B981" />
                      <Text style={styles.ackConfirmedText}>Émargé avec succès par l’élève</Text>
                    </View>
                  )}
                </View>
              )}
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
    maxHeight: '85%',
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
    maxHeight: 420,
  },
  modalContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  msgStatusTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  attachmentsSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  sectionMiniTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  surveyBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  surveyBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  surveyBoxTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  surveySuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  surveySuccessText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  questionBlock: {
    marginTop: 8,
    marginBottom: 12,
  },
  questionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  choicesList: {
    gap: 8,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  choiceText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 6,
  },
  voteButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  ackBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  ackBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  ackBoxTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  ackBoxDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  ackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
  },
  ackButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  ackConfirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  ackConfirmedText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
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
