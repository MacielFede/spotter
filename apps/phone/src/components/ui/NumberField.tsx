import { Text, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { TextField, type TextFieldProps } from './TextField';

interface NumberFieldProps extends Omit<TextFieldProps, 'keyboardType' | 'unit'> {
  decimal?: boolean;
  unit?: string;
  keyboardType?: TextInputProps['keyboardType'];
  onSubmitNext?: () => void;
}

export function NumberField({
  decimal = false,
  unit,
  keyboardType,
  onSubmitNext,
  ...props
}: NumberFieldProps) {
  const { tokens } = useTheme();
  return (
    <TextField
      {...props}
      keyboardType={keyboardType ?? (decimal ? 'decimal-pad' : 'number-pad')}
      onSubmitEditing={onSubmitNext ?? props.onSubmitEditing}
      returnKeyType={onSubmitNext ? 'next' : props.returnKeyType}
      submitBehavior={onSubmitNext ? 'submit' : props.submitBehavior}
      inputRef={props.inputRef}
      unit={
        unit ? <Text style={{ color: tokens.textSecondary, fontSize: 13 }}>{unit}</Text> : undefined
      }
    />
  );
}
