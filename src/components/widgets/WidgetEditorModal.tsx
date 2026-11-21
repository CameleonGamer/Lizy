import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  ScrollView 
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/components/glass/GlassCard';
import { useThemeStore } from '@/stores/useThemeStore';
import { GlassButton } from '@/components/glass/GlassButton';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { WidgetConfig, WidgetType, WidgetSize } from '@/types';
import { 
  SlidersHorizontal, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Plus, 
  Check, 
  Eye, 
  Maximize2 
} from 'lucide-react-native';

interface WidgetEditorModalProps {
  visible: boolean;
  onClose: () => void;
}

const AVAILABLE_WIDGET_CATALOG: { type: WidgetType; title: string; defaultSize: WidgetSize }[] = [
  { type: 'timetable', title: 'Planning du Jour', defaultSize: '4x2' },
  { type: 'homework', title: 'Devoirs & Sous-tâches', defaultSize: '4x2' },
  { type: 'general_average', title: 'Moyenne Générale', defaultSize: '2x1' },
  { type: 'grade_chart', title: 'Évolution des Notes', defaultSize: '4x2' },
  { type: 'performance_radar', title: 'Radar Points Forts/Faibles', defaultSize: '4x2' },
  { type: 'gaming_stats', title: 'Niveau XP & Streaks', defaultSize: '2x1' },
  { type: 'quick_focus', title: 'Bouton Focus Rapide', defaultSize: '4x2' },
];

export const WidgetEditorModal: React.FC<WidgetEditorModalProps> = ({ visible, onClose }) => {
  const { currentTheme } = useThemeStore();
  const { widgets, updateWidget, reorderWidgets, removeWidget, addWidget } = useWidgetStore();

  const [activeTab, setActiveTab] = useState<'manage' | 'add'>('manage');

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const newWidgets = [...widgets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newWidgets.length) return;

    const temp = newWidgets[index];
    newWidgets[index] = newWidgets[targetIndex];
    newWidgets[targetIndex] = temp;

    reorderWidgets(newWidgets);
  };

  const handleAddWidget = (item: typeof AVAILABLE_WIDGET_CATALOG[0]) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    const newConfig: WidgetConfig = {
      id: `w-${item.type}-${Date.now()}`,
      type: item.type,
      title: item.title,
      size: item.defaultSize,
      order: widgets.length,
      showGlass: true,
      customBorderRadius: currentTheme.borderRadius,
    };
    addWidget(newConfig);
    setActiveTab('manage');
  };

  const cycleSize = (w: WidgetConfig) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const sizes: WidgetSize[] = ['2x1', '2x2', '4x2', '4x4'];
    const nextIdx = (sizes.indexOf(w.size) + 1) % sizes.length;
    updateWidget(w.id, { size: sizes[nextIdx] });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <GlassCard style={styles.editorCard} foliage="vine">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <SlidersHorizontal size={20} color={currentTheme.colors.primary} />
              <Text style={[styles.title, { color: currentTheme.colors.text }]}>
                Personnaliser les Widgets
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={currentTheme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Sub Header Switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => setActiveTab('manage')}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: activeTab === 'manage' ? currentTheme.colors.surfaceGlass : 'transparent',
                  borderColor: activeTab === 'manage' ? currentTheme.colors.primary : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'manage' ? currentTheme.colors.primary : currentTheme.colors.textMuted },
                ]}
              >
                Actifs ({widgets.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('add')}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: activeTab === 'add' ? currentTheme.colors.surfaceGlass : 'transparent',
                  borderColor: activeTab === 'add' ? currentTheme.colors.primary : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'add' ? currentTheme.colors.primary : currentTheme.colors.textMuted },
                ]}
              >
                + Ajouter un Widget
              </Text>
            </TouchableOpacity>
          </View>

          {/* List Content */}
          <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
            {activeTab === 'manage' ? (
              widgets.map((w, index) => (
                <View
                  key={w.id}
                  style={[
                    styles.widgetRow,
                    {
                      borderColor: currentTheme.colors.borderGlass,
                      backgroundColor: currentTheme.colors.surfaceGlass,
                    },
                  ]}
                >
                  <View style={styles.widgetInfo}>
                    <Text style={[styles.widgetName, { color: currentTheme.colors.text }]}>
                      {w.title || w.type}
                    </Text>
                    <View style={styles.metaRow}>
                      <TouchableOpacity onPress={() => cycleSize(w)} style={styles.sizeTag}>
                        <Maximize2 size={12} color={currentTheme.colors.accent} />
                        <Text style={[styles.sizeText, { color: currentTheme.colors.accent }]}>
                          Taille: {w.size}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => updateWidget(w.id, { showGlass: !w.showGlass })}
                        style={styles.glassTag}
                      >
                        <Text style={[styles.glassText, { color: currentTheme.colors.textMuted }]}>
                          Verre: {w.showGlass ? 'Oui' : 'Non'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.actionButtons}>
                    {/* Reordering */}
                    <TouchableOpacity
                      disabled={index === 0}
                      onPress={() => moveWidget(index, 'up')}
                      style={[styles.iconBtn, { opacity: index === 0 ? 0.3 : 1 }]}
                    >
                      <ArrowUp size={16} color={currentTheme.colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={index === widgets.length - 1}
                      onPress={() => moveWidget(index, 'down')}
                      style={[styles.iconBtn, { opacity: index === widgets.length - 1 ? 0.3 : 1 }]}
                    >
                      <ArrowDown size={16} color={currentTheme.colors.text} />
                    </TouchableOpacity>

                    {/* Delete */}
                    <TouchableOpacity
                      onPress={() => {
                        try {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        } catch {}
                        removeWidget(w.id);
                      }}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={16} color={currentTheme.colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              AVAILABLE_WIDGET_CATALOG.map((cat) => (
                <View
                  key={cat.type}
                  style={[
                    styles.catalogRow,
                    {
                      borderColor: currentTheme.colors.borderGlass,
                      backgroundColor: currentTheme.colors.surfaceGlass,
                    },
                  ]}
                >
                  <View style={styles.catalogInfo}>
                    <Text style={[styles.catalogTitle, { color: currentTheme.colors.text }]}>
                      {cat.title}
                    </Text>
                    <Text style={[styles.catalogMeta, { color: currentTheme.colors.textMuted }]}>
                      Taille par défaut : {cat.defaultSize}
                    </Text>
                  </View>

                  <GlassButton
                    onPress={() => handleAddWidget(cat)}
                    style={[styles.addCatalogBtn, { backgroundColor: currentTheme.colors.primary }]}
                  >
                    <Plus size={16} color="#FFFFFF" />
                    <Text style={styles.addCatalogText}>Ajouter</Text>
                  </GlassButton>
                </View>
              ))
            )}
          </ScrollView>

          {/* Close / Apply button */}
          <GlassButton
            onPress={onClose}
            style={[styles.applyBtn, { backgroundColor: currentTheme.colors.primary }]}
          >
            <Check size={18} color="#FFFFFF" />
            <Text style={styles.applyBtnText}>Terminer la Personnalisation</Text>
          </GlassButton>
        </GlassCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 20,
  },
  editorCard: {
    maxHeight: '85%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listScroll: {
    maxHeight: 380,
  },
  widgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  widgetInfo: {
    flex: 1,
  },
  widgetName: {
    fontSize: 14,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  sizeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  sizeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  glassTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  glassText: {
    fontSize: 11,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    marginLeft: 4,
  },
  catalogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  catalogInfo: {
    flex: 1,
  },
  catalogTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  catalogMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  addCatalogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addCatalogText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  applyBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
