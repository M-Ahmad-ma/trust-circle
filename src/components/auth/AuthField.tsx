import { useState } from 'react';
import type { TextInputProps } from 'react-native';
import { Text, TextInput, View } from 'react-native';

/**
 * Underline-only field. The label is letterspaced small caps that sit *above* the
 * value, and the rule turns berry on focus — an editorial treatment rather than
 * the usual rounded grey box.
 */
type AuthFieldProps = Omit<TextInputProps, 'className' | 'style'> & {
  label: string;
  error?: string | null;
  /** Shown under the rule when there is no error — e.g. a live strength note. */
  hint?: string | null;
};

export function AuthField({ label, error, hint, onFocus, onBlur, ...props }: AuthFieldProps) {
  const [focused, setFocused] = useState(false);
  const invalid = Boolean(error);

  return (
    <View>
      <Text
        className="font-body-semibold text-3xs uppercase"
        style={{ color: invalid ? '#a03246' : focused ? '#a03246' : '#9a8e85' }}>
        {label}
      </Text>

      <TextInput
        {...props}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className="pb-2 pt-1.5 font-body text-[15px] text-ink-900"
        style={{ borderBottomWidth: focused || invalid ? 1.5 : 1 }}
        placeholderTextColor="#b8a37c"
        accessibilityLabel={label}
        accessibilityHint={error ?? undefined}
      />

      <View
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: focused || invalid ? 1.5 : 1,
          backgroundColor: invalid ? '#a03246' : focused ? '#a03246' : '#d9cbb2',
        }}
      />

      {(invalid || hint) && (
        <Text
          className="mt-1.5 font-body text-[11px]"
          style={{ color: invalid ? '#a03246' : '#9a8e85' }}>
          {error ?? hint}
        </Text>
      )}
    </View>
  );
}
