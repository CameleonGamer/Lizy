import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/useThemeStore';
import { JungleBackground } from '@/components/jungle/JungleBackground';
import { useDataStore } from '@/stores/useDataStore';
import { GlassCard } from '@/components/glass/GlassCard';
import { PronoteMessage } from '@/types';
import { 
  Mail, 
  MailOpen, 
  ShieldCheck, 
  ChevronRight, 
  X, 
  User 
} from 'lucide-react-native';

export default function MessagesScreen() {
  const { currentTheme } = useThemeStore();
  const { messages } = useDataStore();
  const [selectedMessage, setSelectedMessage] = useState<PronoteMessage | null>(null);

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: currentTheme.colors.background }]}>
      <JungleBackground density="light" />
      <View style={styles.header}>
        <View>
          <Text style={[styles.subtitle, { color: currentTheme.colors.textMuted }]}>
            COMMUNICATIONS ÉTABLISSEMENT
          </Text>
          <Text style={[styles.title, { color: currentTheme.colors.text }]}>Messages</Text>
        </View>

        <View style={[styles.securityBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
          <ShieldCheck size={14} color="#10B981" />
          <Text style={styles.securityText}>Chiffré Local</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
        {messages.map((msg) => (
          <TouchableOpacity
            key={msg.id}
            activeOpacity={0.8}
            onPress={() => setSelectedMessage(msg)}
          >
            <GlassCard style={styles.msgCard}>
              <View style={styles.msgHeader}>
                <View style={styles.authorRow}>
                  {msg.read ? (
                    <MailOpen size={18} color={currentTheme.colors.textMuted} />
                  ) : (
                    <Mail size={18} color={currentTheme.colors.primary} />
                  )}
                  <Text style={[styles.authorText, { color: currentTheme.colors.text }]}>
                    {msg.author}
                  </Text>
                </View>

                <Text style={[styles.dateText, { color: currentTheme.colors.textMuted }]}>
                  {msg.date}
                </Text>
              </View>

              <Text style={[styles.subjectText, { color: currentTheme.colors.text }]}>
                {msg.subject}
              </Text>

              <Text
                numberOfLines={2}
                style={[styles.previewText, { color: currentTheme.colors.textMuted }]}
              >
                {msg.content}
              </Text>

              <View style={styles.readMoreRow}>
                <Text style={[styles.readMoreText, { color: currentTheme.colors.primary }]}>
                  Lire le message
                </Text>
                <ChevronRight size={14} color={currentTheme.colors.primary} />
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Message Reader Modal */}
      <Modal visible={Boolean(selectedMessage)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard} foliage="vine">
            <View style={styles.modalHeader}>
              <View style={styles.authorModalHeader}>
                <User size={18} color={currentTheme.colors.accent} />
                <Text style={[styles.modalAuthor, { color: currentTheme.colors.text }]}>
                  {selectedMessage?.author}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedMessage(null)}>
                <X size={20} color={currentTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDate, { color: currentTheme.colors.textMuted }]}>
              Reçu {selectedMessage?.date}
            </Text>

            <Text style={[styles.modalSubject, { color: currentTheme.colors.text }]}>
              {selectedMessage?.subject}
            </Text>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.modalContent, { color: currentTheme.colors.text }]}>
                {selectedMessage?.content}
              </Text>
            </ScrollView>
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
  scrollList: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 12,
  },
  msgCard: {
    marginBottom: 0,
  },
  msgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
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
    maxHeight: '75%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalAuthor: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalDate: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  modalSubject: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  modalBody: {
    marginTop: 4,
  },
  modalContent: {
    fontSize: 14,
    lineHeight: 22,
  },
});
