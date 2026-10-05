import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AuthField } from './AuthField';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  hint?: string | null;
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
  textContentType?: 'password' | 'newPassword';
};

/** AuthField plus a reveal toggle, so a mistyped password is recoverable. */
export function PasswordField({
  label,
  value,
  onChange,
  error,
  hint,
  onSubmitEditing,
  autoFocus,
  textContentType = 'password',
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <AuthField
        label={label}
        value={value}
        onChangeText={onChange}
        error={error}
        hint={hint}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        textContentType={textContentType}
        returnKeyType="go"
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
      />

      <Pressable
        onPress={() => setVisible((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        hitSlop={10}
        className="absolute right-0 top-0 h-6 w-8 items-center justify-end active:opacity-60">
        <MaterialCommunityIcons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={17}
          color="#7b6f66"
        />
      </Pressable>
    </View>
  );
}
