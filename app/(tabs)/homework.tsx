import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput,
  Modal,
  Platform 
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores/useThemeStore';
import { useDataStore } from '@/stores/useDataStore';
import { useGamingStore } from '@/stores/useGamingStore';
import { GlassCard } from '@/components/glass/GlassCard';
import { cleanPronoteHtml } from '@/core/utils/htmlSanitizer';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Calendar, 
  Clock, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react-native';

export default function HomeworkScreen() {
  const { currentTheme } = useThemeStore();
  const { homework, toggleHomework, toggleSubtask, addPersonalHomework } = useDataStore();
  const addXp = useGamingStore((s) => s.addXp);

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // New personal homework form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newMinutes, setNewMinutes] = useState('30');

  const filtered = homework.filter((h) => {
    if (filter === 'pending') return !h.completed;
    if (filter === 'completed') return h.completed;
    return true;
  });

  const handleToggle = (id: string, currentlyCompleted: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    toggleHomework(id);
    if (!currentlyCompleted) {
      addXp(10); // +10 XP for completing homework
    }
  };

  const handleCreatePersonalHomework = () => {
    if (!newTitle.trim()) return;
    addPersonalHomework({
      title: newTitle.trim(),
      subject: newSubject.trim() || 'Personnel',
      description: 'Devoir personnel ajouté par l’élève',
      dueDate: newDueDate.trim() || 'Bientôt',
      estimatedMinutes: parseInt(newMinutes, 10) || 30,
    });
    setNewTitle('');
    setNewSubject('');
    setNewDueDate('');
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.subtitle, { color: currentTheme.colors.textMuted }]}>GESTION DU TRAVAIL</Text>
          <Text style={[styles.title, { color: currentTheme.colors.text }]}>Devoirs</Text>
        </View>

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[styles.addButton, { backgroundColor: currentTheme.colors.primary }]}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'completed'] as const).map((f) => {
          const isSelected = filter === f;
          const label = f === 'all' ? 'Tous' : f === 'pending' ? 'À faire' : 'Terminés';
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterTab,
                {
                  backgroundColor: isSelected ? currentTheme.colors.surfaceGlass : 'transparent',
                  borderColor: isSelected ? currentTheme.colors.borderGlass : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isSelected ? currentTheme.colors.primary : currentTheme.colors.textMuted },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Homework List */}
      <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
        {filtered.map((hw) => {
          const isExpanded = expandedId === hw.id;
          return (
            <GlassCard key={hw.id} style={styles.hwCard}>
              <View style={styles.cardTopRow}>
                <TouchableOpacity
                  onPress={() => handleToggle(hw.id, hw.completed)}
                  style={styles.checkTouch}
                >
                  {hw.completed ? (
                    <CheckCircle2 size={24} color={currentTheme.colors.success} />
                  ) : (
                    <Circle size={24} color={currentTheme.colors.textMuted} />
                  )}
                </TouchableOpacity>

                <View style={styles.cardHeaderInfo}>
                  <View style={styles.badgeLine}>
                    <Text style={[styles.subjectTag, { color: currentTheme.colors.accent }]}>
                      {hw.subject}
                    </Text>
                    {hw.isPersonal && (
                      <View style={styles.persoBadge}>
                        <Text style={styles.persoText}>Devoir Personnel</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.hwTitle,
                      {
                        color: currentTheme.colors.text,
                        textDecorationLine: hw.completed ? 'line-through' : 'none',
                        opacity: hw.completed ? 0.6 : 1,
                      },
                    ]}
                  >
                    {cleanPronoteHtml(hw.title)}
                  </Text>
                </View>

                {hw.subtasks.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setExpandedId(isExpanded ? null : hw.id)}
                    style={styles.expandButton}
                  >
                    {isExpanded ? (
                      <ChevronUp size={20} color={currentTheme.colors.textMuted} />
                    ) : (
                      <ChevronDown size={20} color={currentTheme.colors.textMuted} />
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.hwDesc, { color: currentTheme.colors.textMuted }]}>
                {cleanPronoteHtml(hw.description)}
              </Text>

              {/* Meta bar */}
              <View style={styles.metaBar}>
                <View style={styles.metaItem}>
                  <Calendar size={13} color={currentTheme.colors.textMuted} />
                  <Text style={[styles.metaText, { color: currentTheme.colors.textMuted }]}>
                    Pour {hw.dueDate}
                  </Text>
                </View>

                {hw.estimatedMinutes && (
                  <View style={styles.metaItem}>
                    <Clock size={13} color={currentTheme.colors.textMuted} />
                    <Text style={[styles.metaText, { color: currentTheme.colors.textMuted }]}>
                      ~{hw.estimatedMinutes} min
                    </Text>
                  </View>
                )}

                <View style={styles.xpReward}>
                  <Sparkles size={12} color="#F59E0B" />
                  <Text style={styles.xpRewardText}>+10 XP</Text>
                </View>
              </View>

              {/* Subtasks breakdown */}
              {isExpanded && hw.subtasks.length > 0 && (
                <View style={styles.subtaskContainer}>
                  <Text style={[styles.subtaskSectionTitle, { color: currentTheme.colors.textMuted }]}>
                    DÉCOUPAGE DU DEVOIR ({hw.subtasks.filter((s) => s.completed).length}/{hw.subtasks.length})
                  </Text>
                  {hw.subtasks.map((st) => (
                    <TouchableOpacity
                      key={st.id}
                      onPress={() => toggleSubtask(hw.id, st.id)}
                      style={styles.subtaskRow}
                    >
                      {st.completed ? (
                        <CheckCircle2 size={16} color={currentTheme.colors.success} />
                      ) : (
                        <Circle size={16} color={currentTheme.colors.textMuted} />
                      )}
                      <Text
                        style={[
                          styles.subtaskTitle,
                          {
                            color: currentTheme.colors.text,
                            textDecorationLine: st.completed ? 'line-through' : 'none',
                            opacity: st.completed ? 0.6 : 1,
                          },
                        ]}
                      >
                        {st.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </GlassCard>
          );
        })}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>
                Nouveau devoir personnel
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={currentTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Titre du devoir..."
              placeholderTextColor={currentTheme.colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
              style={[
                styles.input,
                { color: currentTheme.colors.text, borderColor: currentTheme.colors.borderGlass },
              ]}
            />

            <TextInput
              placeholder="Matière (ex: SVT, Maths...)"
              placeholderTextColor={currentTheme.colors.textMuted}
              value={newSubject}
              onChangeText={setNewSubject}
              style={[
                styles.input,
                { color: currentTheme.colors.text, borderColor: currentTheme.colors.borderGlass },
              ]}
            />

            <TextInput
              placeholder="Échéance (ex: Demain, Vendredi...)"
              placeholderTextColor={currentTheme.colors.textMuted}
              value={newDueDate}
              onChangeText={setNewDueDate}
              style={[
                styles.input,
                { color: currentTheme.colors.text, borderColor: currentTheme.colors.borderGlass },
              ]}
            />

            <TouchableOpacity
              onPress={handleCreatePersonalHomework}
              style={[styles.submitButton, { backgroundColor: currentTheme.colors.primary }]}
            >
              <Text style={styles.submitText}>Enregistrer le devoir</Text>
            </TouchableOpacity>
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
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollList: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 14,
  },
  hwCard: {
    marginBottom: 0,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkTouch: {
    marginTop: 2,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  badgeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  subjectTag: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  persoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  persoText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  hwTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  expandButton: {
    padding: 4,
  },
  hwDesc: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  metaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  xpReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  xpRewardText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  subtaskContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  subtaskSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  subtaskTitle: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 20,
  },
  modalCard: {
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
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 14,
  },
  submitButton: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
