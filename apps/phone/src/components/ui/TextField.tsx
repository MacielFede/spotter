import type { ElementRef, ReactNode, Ref } from 'react';
import {
  type StyleProp,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  hint?: string;
  invalid?: boolean;
  unit?: ReactNode;
  inputRef?: Ref<TextInputRef>;
  wrapperStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export type TextInputRef = ElementRef<typeof TextInput>;

export function TextField({
  label,
  hint,
  invalid = false,
  unit,
  inputRef,
  wrapperStyle,
  inputStyle,
  placeholderTextColor,
  accessibilityLabel,
  ...props
}: TextFieldProps) {
  const { tokens } = useTheme();
  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      {label ? <Text style={[styles.label, { color: tokens.textSecondary }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: tokens.surface,
            borderColor: invalid ? tokens.danger : tokens.border,
          },
        ]}
      >
        <TextInput
          {...props}
          accessibilityLabel={accessibilityLabel ?? label}
          placeholderTextColor={placeholderTextColor ?? tokens.textSecondary}
          ref={inputRef}
          textAlignVertical={props.multiline ? 'top' : props.textAlignVertical}
          style={[
            styles.input,
            props.multiline && styles.multiline,
            { color: tokens.textPrimary },
            inputStyle,
          ]}
        />
        {unit ? <View style={styles.unit}>{unit}</View> : null}
      </View>
      {hint ? <Text style={[styles.hint, { color: tokens.textSecondary }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputShell: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multiline: {
    minHeight: 120,
  },
  unit: {
    paddingEnd: 12,
  },
  hint: {
    fontSize: 12,
  },
});
