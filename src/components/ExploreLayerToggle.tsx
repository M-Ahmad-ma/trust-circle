import { Pressable, Text, View } from 'react-native';

import type { ExploreLayer } from '@/components/ExploreMap';

const LAYERS: ExploreLayer[] = ['places', 'experiences'];

type ExploreLayerToggleProps = {
  layer: ExploreLayer;
  onLayerChange: (layer: ExploreLayer) => void;
  placesLabel: string;
  experiencesLabel: string;
};

/**
 * README §9 and §30 put experiences on the map, but places are what a user
 * searches for and what a write flow needs to attach to. Both sets of markers
 * share one coordinate space and would overlap into noise if drawn together, so
 * they are layers rather than a merged set.
 */
export function ExploreLayerToggle({
  layer,
  onLayerChange,
  placesLabel,
  experiencesLabel,
}: ExploreLayerToggleProps) {
  const labels: Record<ExploreLayer, string> = {
    places: placesLabel,
    experiences: experiencesLabel,
  };

  return (
    <View
      className="absolute left-3 top-16 rounded-xl bg-paper-50 p-1"
      style={{
        shadowColor: '#1c1815',
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }}>
      {LAYERS.map((value) => {
        const active = layer === value;

        return (
          <Pressable
            key={value}
            onPress={() => onLayerChange(value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={labels[value]}
            className="rounded-xl px-3 py-1.5"
            style={{ backgroundColor: active ? '#1c1815' : 'transparent' }}>
            <Text
              className={
                active
                  ? 'font-body-semibold text-[11px] text-paper-50'
                  : 'font-body-medium text-[11px] text-ink-500'
              }>
              {labels[value]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
