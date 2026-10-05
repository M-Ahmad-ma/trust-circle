import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';

type CircleSearchProps = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

export function CircleSearch({ value, placeholder, onChange }: CircleSearchProps) {
  return (
    <View className="mx-4 mt-6 flex-row items-center rounded-pill border border-border bg-paper-50 px-4">
      <MaterialCommunityIcons name="magnify" size={17} color="#9a8e85" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9a8e85"
        returnKeyType="search"
        autoCorrect={false}
        className="flex-1 py-3 pl-2.5 font-body text-[12px] text-ink-800"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChange('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          className="pl-2 active:opacity-60">
          <MaterialCommunityIcons name="close-circle" size={15} color="#b8a37c" />
        </Pressable>
      )}
    </View>
  );
}
