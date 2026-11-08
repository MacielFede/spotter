import { Pressable, StyleSheet } from 'react-native';
import { Icon, type IconName } from './Icon';

type Tone = 'primary' | 'secondary' | 'danger';

interface IconButtonProps {
  name: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  tone?: Tone;
  disabled?: boolean;
}

export function IconButton({
  name,
  accessibilityLabel,
  onPress,
  tone = 'secondary',
  disabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, { opacity: disabled ? 0.45 : 1 }]}
    >
      <Icon name={name} tone={tone} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
  },
});
