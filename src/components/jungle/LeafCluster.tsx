import React, { useId } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg from 'react-native-svg';
import { Leaf, LeafDefs, LeafSpec } from './Leaf';

export const useSvgId = (prefix: string) => `${prefix}${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

interface LeafClusterProps {
  width: number;
  height: number;
  leaves: LeafSpec[];
  color: string;
  style?: StyleProp<ViewStyle>;
}

/** A single Svg holding a group of leaves (cheap: one native view per cluster). */
export const LeafCluster: React.FC<LeafClusterProps> = React.memo(({ width, height, leaves, color, style }) => {
  const id = useSvgId('leaf');
  return (
    <Svg width={width} height={height} style={style} pointerEvents="none">
      <LeafDefs id={id} color={color} />
      {leaves.map((leaf, i) => (
        <Leaf key={i} {...leaf} gradientId={id} color={color} />
      ))}
    </Svg>
  );
});
LeafCluster.displayName = 'LeafCluster';
