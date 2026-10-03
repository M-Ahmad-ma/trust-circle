import { ScrollView, Pressable, Text, View } from 'react-native';

type Category = {
  id: string;
  label: string;
  count: number;
};

type CategoryRailProps = {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function CategoryRail({ categories, selectedId, onSelect }: CategoryRailProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-4 shrink-0 grow-0"
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
      {categories.map((category) => {
        const active = category.id === selectedId;

        return (
          <Pressable
            key={category.id}
            onPress={() => onSelect(category.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className="flex h-8 items-center justify-center rounded-pill border px-4 active:opacity-70"
            style={{
              borderColor: active ? '#8e2c39' : '#e0d2b4',
              backgroundColor: active ? '#8e2c39' : '#fdfaf4',
            }}>
            <Text
              className={
                active
                  ? 'font-body-semibold text-[12px] text-primary-fg'
                  : 'font-body-medium text-[12px] text-ink-700'
              }>
              {category.label}
            </Text>
          </Pressable>
        );
      })}
      <View className="w-1" />
    </ScrollView>
  );
}
