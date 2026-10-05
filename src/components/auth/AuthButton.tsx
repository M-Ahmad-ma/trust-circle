import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

/** Primary action — filled berry, warm shadow, disabled until the form is valid. */
type AuthButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

export function AuthButton({ label, onPress, disabled, busy, icon }: AuthButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || busy), busy: Boolean(busy) }}
      className="flex-row items-center justify-center gap-2 rounded-card active:opacity-90"
      style={{
        height: 52,
        backgroundColor: disabled ? '#d9cbb2' : '#a03246',
        shadowColor: '#7e2534',
        shadowOpacity: disabled ? 0 : 0.28,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
        elevation: disabled ? 0 : 4,
      }}>
      <Text
        className="font-body-semibold text-[15px]"
        style={{ color: disabled ? '#f3ecdd' : '#fdfaf4' }}>
        {busy ? 'One moment…' : label}
      </Text>
      {!busy && icon && (
        <MaterialCommunityIcons name={icon} size={17} color={disabled ? '#f3ecdd' : '#fdfaf4'} />
      )}
    </Pressable>
  );
}

type AuthLinkProps = {
  children: string;
  onPress: () => void;
};

/** Quiet text link used for "create an account" / "forgot password". */
export function AuthLink({ children, onPress }: AuthLinkProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" className="self-center active:opacity-60">
      <Text className="font-body-semibold text-[13px] text-primary-600">{children}</Text>
    </Pressable>
  );
}

/** Small caps step marker, e.g. "01 / 02". */
export function StepMarker({ current, total }: { current: number; total: number }) {
  return (
    <Text className="font-body-semibold text-3xs uppercase text-ink-300">
      {String(current).padStart(2, '0')}
      <Text className="text-ink-300"> / </Text>
      {String(total).padStart(2, '0')}
    </Text>
  );
}
