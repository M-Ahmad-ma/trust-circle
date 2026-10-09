import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

type SearchFieldProps = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onOpenFilters?: () => void;
};

export function SearchField({ value, placeholder, onChange, onOpenFilters }: SearchFieldProps) {
  return (
    <View className="mx-4 mt-4 flex-row items-center rounded-pill border border-sand-400 bg-paper-50 px-4">
      <MaterialCommunityIcons name="magnify" size={18} color="#9a8e85" />

      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9a8e85"
        returnKeyType="search"
        className="flex-1 py-3 pl-2.5 pr-3 font-body text-[12px] text-ink-800"
      />

      <View className="h-5 w-px bg-sand-400" />

      <Pressable
        onPress={onOpenFilters}
        accessibilityRole="button"
        accessibilityLabel="Open filters"
        className="flex-row items-center gap-1.5 pl-3 active:opacity-60">
        <MaterialCommunityIcons name="tune-variant" size={16} color="#8e2c39" />
        <Text className="font-body-semibold text-[12px] text-primary-600">Filter</Text>
      </Pressable>
    </View>
  );
}
