import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  TextInput,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/useThemeStore';
import { useDataStore } from '@/stores/useDataStore';
import { GlassCard } from '@/components/glass/GlassCard';
import { 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  AlertCircle,
  X,
  Calendar
} from 'lucide-react-native';

interface DayInfo {
  label: string;
  dayName: string;
  isoDate: string;
  dayOfWeek: number;
}

function getWeekDays(referenceDate: Date = new Date(), hasSaturdayClasses = false): DayInfo[] {
  const d = new Date(referenceDate);
  const currentDay = d.getDay(); // 0 = Sunday, 1 = Monday...
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(d);
  monday.setDate(d.getDate() + distanceToMonday);

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const fullDayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const count = hasSaturdayClasses ? 6 : 5;
  const days: DayInfo[] = [];

  for (let i = 0; i < count; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dayNum = dayDate.getDate();
    const y = dayDate.getFullYear();
    const m = String(dayDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(dayNum).padStart(2, '0');
    const isoDate = `${y}-${m}-${dayStr}`;

    days.push({
      label: `${dayNames[i]} ${dayNum}`,
      dayName: fullDayNames[i],
      isoDate,
      dayOfWeek: i + 1,
    });
  }

  return days;
}

export default function ScheduleScreen() {
  const { currentTheme } = useThemeStore();
  const { timetable, addTimetableEvent } = useDataStore();
  const [modalVisible, setModalVisible] = useState(false);

  // Determine if Saturday classes exist
  const hasSaturday = useMemo(() => {
    return timetable.some((l) => {
      if (!l.date) return false;
      const dt = new Date(l.date);
      return dt.getDay() === 6;
    });
  }, [timetable]);

  // Determine reference date for the week
  const referenceDate = useMemo(() => {
    // If timetable has dates, use the first date's week
    const firstDatedLesson = timetable.find((l) => Boolean(l.date));
    if (firstDatedLesson?.date) {
      const parsed = new Date(firstDatedLesson.date);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }, [timetable]);

  const weekDays = useMemo(() => {
    return getWeekDays(referenceDate, hasSaturday);
  }, [referenceDate, hasSaturday]);

  // Default day index to today (or Monday if weekend)
  const defaultDayIndex = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayIso = `${y}-${m}-${d}`;

    const matchIdx = weekDays.findIndex((w) => w.isoDate === todayIso);
    return matchIdx !== -1 ? matchIdx : 0;
  }, [weekDays]);

  const [selectedDayIndex, setSelectedDayIndex] = useState(defaultDayIndex);
  const selectedDay = weekDays[selectedDayIndex] || weekDays[0];

  // Filter lessons for selected day and sort chronologically
  const dayLessons = useMemo(() => {
    const filtered = timetable.filter((l) => {
      if (l.date && selectedDay) {
        return l.date === selectedDay.isoDate;
      }
      return true;
    });

    return filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [timetable, selectedDay]);

  // New personal event state
  const [eventSubject, setEventSubject] = useState('');
  const [eventRoom, setEventRoom] = useState('');
  const [eventStart, setEventStart] = useState('17:00');
  const [eventEnd, setEventEnd] = useState('18:00');

  const handleCreateEvent = () => {
    if (!eventSubject.trim()) return;
    addTimetableEvent({
      subject: eventSubject.trim(),
      room: eventRoom.trim() || 'Perso',
      teacher: 'Élève (Personnel)',
      startTime: eventStart.trim() || '17:00',
      endTime: eventEnd.trim() || '18:00',
      date: selectedDay?.isoDate,
      status: 'normal',
      color: currentTheme.colors.primary,
    });
    setEventSubject('');
    setEventRoom('');
    setModalVisible(false);
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: currentTheme.colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.subtitle, { color: currentTheme.colors.textMuted }]}>
            {selectedDay ? selectedDay.dayName.toUpperCase() : 'PLANNING HEBDOMADAIRE'}
          </Text>
          <Text style={[styles.title, { color: currentTheme.colors.text }]}>Emploi du temps</Text>
        </View>

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[styles.addButton, { backgroundColor: currentTheme.colors.primary }]}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Événement</Text>
        </TouchableOpacity>
      </View>

      {/* Days Bar */}
      <View style={styles.daysBar}>
        {weekDays.map((day, idx) => {
          const isSelected = selectedDayIndex === idx;
          return (
            <TouchableOpacity
              key={day.isoDate}
              onPress={() => setSelectedDayIndex(idx)}
              style={[
                styles.dayChip,
                {
                  backgroundColor: isSelected ? currentTheme.colors.primary : currentTheme.colors.surfaceGlass,
                  borderColor: isSelected ? currentTheme.colors.primary : currentTheme.colors.borderGlass,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  { color: isSelected ? '#FFFFFF' : currentTheme.colors.textMuted },
                ]}
              >
                {day.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Schedule Timeline */}
      <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
        {dayLessons.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Calendar size={36} color={currentTheme.colors.primary} />
            <Text style={[styles.emptyTitle, { color: currentTheme.colors.text }]}>
              Aucun cours ce jour-là
            </Text>
            <Text style={[styles.emptySubtitle, { color: currentTheme.colors.textMuted }]}>
              Profitez de votre journée ou ajoutez un créneau d'étude personnel avec le bouton "+" ci-dessus.
            </Text>
          </GlassCard>
        ) : (
          dayLessons.map((lesson) => (
            <View key={lesson.id} style={styles.timelineItem}>
              {/* Time Indicator column */}
              <View style={styles.timeCol}>
                <Text style={[styles.startTime, { color: currentTheme.colors.text }]}>
                  {lesson.startTime}
                </Text>
                <Text style={[styles.endTime, { color: currentTheme.colors.textMuted }]}>
                  {lesson.endTime}
                </Text>
              </View>

              {/* Lesson Card */}
              <View style={styles.cardCol}>
                <GlassCard
                  style={{
                    ...styles.lessonCard,
                    borderLeftWidth: 4,
                    borderLeftColor: lesson.color || currentTheme.colors.primary,
                  }}
                >
                  <View style={styles.lessonTopRow}>
                    <Text style={[styles.subjectTitle, { color: currentTheme.colors.text }]}>
                      {lesson.subject}
                    </Text>
                    {lesson.status === 'cancelled' && (
                      <View style={styles.cancelledBadge}>
                        <AlertCircle size={12} color="#EF4444" />
                        <Text style={styles.cancelledText}>Annulé</Text>
                      </View>
                    )}
                    {lesson.status === 'modified' && (
                      <View style={styles.modifiedBadge}>
                        <AlertCircle size={12} color="#F59E0B" />
                        <Text style={styles.modifiedText}>Modifié</Text>
                      </View>
                    )}
                    {lesson.isCustomEvent && (
                      <View style={styles.customBadge}>
                        <Text style={styles.customText}>Perso</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <MapPin size={13} color={currentTheme.colors.textMuted} />
                      <Text style={[styles.detailText, { color: currentTheme.colors.textMuted }]}>
                        {lesson.room}
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <User size={13} color={currentTheme.colors.textMuted} />
                      <Text style={[styles.detailText, { color: currentTheme.colors.textMuted }]}>
                        {lesson.teacher}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Custom Event Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>
                Ajouter à l'emploi du temps
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={currentTheme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Activité (ex: Séance révision, Sport...)"
              placeholderTextColor={currentTheme.colors.textMuted}
              value={eventSubject}
              onChangeText={setEventSubject}
              style={[
                styles.input,
                { color: currentTheme.colors.text, borderColor: currentTheme.colors.borderGlass },
              ]}
            />

            <TextInput
              placeholder="Lieu / Salle (ex: CDI, Maison...)"
              placeholderTextColor={currentTheme.colors.textMuted}
              value={eventRoom}
              onChangeText={setEventRoom}
              style={[
                styles.input,
                { color: currentTheme.colors.text, borderColor: currentTheme.colors.borderGlass },
              ]}
            />

            <View style={styles.rowInputs}>
              <TextInput
                placeholder="Début (17:00)"
                placeholderTextColor={currentTheme.colors.textMuted}
                value={eventStart}
                onChangeText={setEventStart}
                style={[
                  styles.input,
                  styles.halfInput,
                  { color: currentTheme.colors.text, borderColor: currentTheme.colors.borderGlass },
                ]}
              />
              <TextInput
                placeholder="Fin (18:00)"
                placeholderTextColor={currentTheme.colors.textMuted}
                value={eventEnd}
                onChangeText={setEventEnd}
                style={[
                  styles.input,
                  styles.halfInput,
                  { color: currentTheme.colors.text, borderColor: currentTheme.colors.borderGlass },
                ]}
              />
            </View>

            <TouchableOpacity
              onPress={handleCreateEvent}
              style={[styles.submitButton, { backgroundColor: currentTheme.colors.primary }]}
            >
              <Text style={styles.submitText}>Ajouter au créneau</Text>
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
  daysBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollList: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timeCol: {
    width: 48,
    alignItems: 'flex-start',
    paddingTop: 6,
  },
  startTime: {
    fontSize: 13,
    fontWeight: '700',
  },
  endTime: {
    fontSize: 11,
    marginTop: 2,
  },
  cardCol: {
    flex: 1,
  },
  lessonCard: {
    marginBottom: 0,
  },
  lessonTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subjectTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  cancelledText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  modifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  modifiedText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  customBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  customText: {
    color: '#818CF8',
    fontSize: 11,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
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
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
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
