import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import Svg, { 
  Polygon, 
  Line, 
  Circle, 
  Text as SvgText, 
  G, 
  Defs, 
  LinearGradient as SvgLinearGradient, 
  Stop 
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores/useThemeStore';
import { GlassCard } from '@/components/glass/GlassCard';
import { SubjectAverage } from '@/types';
import { Award, Users, TrendingUp, Info } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface KiviatRadarChartProps {
  averages: SubjectAverage[];
  selectedSubject?: string | null;
  onSelectSubject?: (subject: string) => void;
  size?: number;
  showCardWrapper?: boolean;
}

export const KiviatRadarChart: React.FC<KiviatRadarChartProps> = ({
  averages,
  selectedSubject: externalSelectedSubject,
  onSelectSubject,
  size = Math.min(SCREEN_WIDTH - 48, 340),
  showCardWrapper = true,
}) => {
  const { currentTheme } = useThemeStore();
  const [internalSelected, setInternalSelected] = useState<string | null>(null);

  const selectedSubject = externalSelectedSubject !== undefined ? externalSelectedSubject : internalSelected;

  if (!averages || averages.length < 3) {
    return (
      <GlassCard style={styles.emptyContainer}>
        <Info size={28} color={currentTheme.colors.textMuted} />
        <Text style={[styles.emptyText, { color: currentTheme.colors.textMuted }]}>
          Au moins 3 matières avec notes sont requises pour générer le diagramme de Kiviat.
        </Text>
      </GlassCard>
    );
  }

  // Filter out any duplicate subject names or limit to 8 main subjects for optimal readability
  const displayAverages = averages.slice(0, 8);
  const numPoints = displayAverages.length;

  const center = size / 2;
  const radius = center - 42; // Leave room for labels
  const angleStep = (2 * Math.PI) / numPoints;

  // Grid levels (5, 10, 15, 20/20)
  const levels = [5, 10, 15, 20];

  // Helper to convert polar to cartesian
  const getCoordinates = (value: number, index: number, maxVal = 20) => {
    const clampedVal = Math.max(0, Math.min(value, maxVal));
    const r = (clampedVal / maxVal) * radius;
    const angle = index * angleStep - Math.PI / 2; // Start from 12 o'clock
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Student Polygon points string
  const studentPoints = displayAverages
    .map((item, idx) => {
      const { x, y } = getCoordinates(item.average, idx);
      return `${x},${y}`;
    })
    .join(' ');

  // Class Polygon points string
  const classPoints = displayAverages
    .map((item, idx) => {
      const classAvg = item.classAverage ?? item.average;
      const { x, y } = getCoordinates(classAvg, idx);
      return `${x},${y}`;
    })
    .join(' ');

  const handleSelect = (subject: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setInternalSelected(subject);
    if (onSelectSubject) {
      onSelectSubject(subject);
    }
  };

  const selectedItem = displayAverages.find((a) => a.subject === selectedSubject);

  const content = (
    <View style={styles.container}>
      {/* Chart Header & Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: currentTheme.colors.primary }]} />
          <Text style={[styles.legendLabel, { color: currentTheme.colors.text }]}>Vos notes</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDotDashed, { borderColor: '#F59E0B' }]} />
          <Text style={[styles.legendLabel, { color: currentTheme.colors.textMuted }]}>Moy. Classe</Text>
        </View>
      </View>

      {/* Floating Active Info Bubble */}
      {selectedItem && (
        <View style={[styles.infoBubble, { backgroundColor: currentTheme.colors.surfaceGlass, borderColor: currentTheme.colors.borderGlass }]}>
          <Text numberOfLines={1} style={[styles.bubbleSubject, { color: currentTheme.colors.primary }]}>
            {selectedItem.subject}
          </Text>
          <View style={styles.bubbleStatsRow}>
            <Text style={[styles.bubbleGrade, { color: currentTheme.colors.text }]}>
              {selectedItem.average.toFixed(1)}/20
            </Text>
            {selectedItem.classAverage !== undefined && (
              <Text style={[styles.bubbleClass, { color: currentTheme.colors.textMuted }]}>
                (Classe : {selectedItem.classAverage.toFixed(1)})
              </Text>
            )}
            {selectedItem.classAverage !== undefined && (
              <View style={[styles.deltaBadge, { backgroundColor: selectedItem.average >= selectedItem.classAverage ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: selectedItem.average >= selectedItem.classAverage ? '#10B981' : '#EF4444' }}>
                  {selectedItem.average >= selectedItem.classAverage ? '+' : ''}
                  {(selectedItem.average - selectedItem.classAverage).toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Radar SVG */}
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <SvgLinearGradient id="studentGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={currentTheme.colors.primary} stopOpacity="0.45" />
            <Stop offset="1" stopColor={currentTheme.colors.secondary || currentTheme.colors.primary} stopOpacity="0.15" />
          </SvgLinearGradient>
          <SvgLinearGradient id="classGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F59E0B" stopOpacity="0.12" />
            <Stop offset="1" stopColor="#F59E0B" stopOpacity="0.03" />
          </SvgLinearGradient>
        </Defs>

        {/* Concentric Reference Webs */}
        {levels.map((lvl) => {
          const webPoints = displayAverages
            .map((_, idx) => {
              const { x, y } = getCoordinates(lvl, idx);
              return `${x},${y}`;
            })
            .join(' ');

          const isMoyenne = lvl === 10;
          return (
            <Polygon
              key={`web-${lvl}`}
              points={webPoints}
              fill="none"
              stroke={isMoyenne ? 'rgba(245, 158, 11, 0.45)' : 'rgba(255, 255, 255, 0.10)'}
              strokeWidth={isMoyenne ? 1.2 : 0.8}
              strokeDasharray={isMoyenne ? '3, 3' : undefined}
            />
          );
        })}

        {/* Radial Spokes / Axes */}
        {displayAverages.map((item, idx) => {
          const { x, y } = getCoordinates(20, idx);
          return (
            <Line
              key={`spoke-${idx}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth={1}
            />
          );
        })}

        {/* 1. Class Average Polygon */}
        <Polygon
          points={classPoints}
          fill="url(#classGrad)"
          stroke="#F59E0B"
          strokeWidth={1.8}
          strokeDasharray="4, 4"
        />

        {/* 2. Student Average Polygon */}
        <Polygon
          points={studentPoints}
          fill="url(#studentGrad)"
          stroke={currentTheme.colors.primary}
          strokeWidth={2.4}
        />

        {/* Clickable Vertices & Highlight Dots */}
        {displayAverages.map((item, idx) => {
          const { x, y } = getCoordinates(item.average, idx);
          const isSelected = item.subject === selectedSubject;

          return (
            <G key={`vertex-${idx}`}>
              <Circle
                cx={x}
                cy={y}
                r={isSelected ? 7 : 4.5}
                fill={isSelected ? '#FFFFFF' : currentTheme.colors.primary}
                stroke={currentTheme.colors.background}
                strokeWidth={2}
              />
              {/* Invisible larger hit box for comfortable finger touch */}
              <Circle
                cx={x}
                cy={y}
                r={24}
                fill="transparent"
                onPress={() => handleSelect(item.subject)}
              />
            </G>
          );
        })}

        {/* Subject Labels along the perimeter */}
        {displayAverages.map((item, idx) => {
          const angle = idx * angleStep - Math.PI / 2;
          const labelDist = radius + 22;
          const x = center + labelDist * Math.cos(angle);
          const y = center + labelDist * Math.sin(angle) + 4;

          const isSelected = item.subject === selectedSubject;
          // Abbreviate if subject title is too long
          const label = item.subject.length > 9 ? item.subject.substring(0, 8) + '…' : item.subject;

          return (
            <SvgText
              key={`label-${idx}`}
              x={x}
              y={y}
              fill={isSelected ? currentTheme.colors.primary : currentTheme.colors.textMuted}
              fontSize={10.5}
              fontWeight={isSelected ? 'bold' : '600'}
              textAnchor="middle"
              onPress={() => handleSelect(item.subject)}
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>

      <Text style={[styles.helpHint, { color: currentTheme.colors.textMuted }]}>
        Touchez une matière sur le radar pour afficher les détails et pistes de progression
      </Text>
    </View>
  );

  if (showCardWrapper) {
    return <GlassCard style={styles.card}>{content}</GlassCard>;
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    width: '100%',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 8,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendDotDashed: {
    width: 12,
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoBubble: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  bubbleSubject: {
    fontSize: 13,
    fontWeight: '700',
  },
  bubbleStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bubbleGrade: {
    fontSize: 14,
    fontWeight: '800',
  },
  bubbleClass: {
    fontSize: 12,
  },
  deltaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  svg: {
    alignSelf: 'center',
    marginVertical: 4,
  },
  helpHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
});
