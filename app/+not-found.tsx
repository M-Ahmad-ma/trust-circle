import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center gap-2 bg-paper-100 p-6">
        <Text className="text-center font-display text-[22px] text-ink-800">
          This screen does not exist.
        </Text>
        <Link href="/" className="font-body-semibold text-[12px] text-primary-600">
          Go to home
        </Link>
      </View>
    </>
  );
}
