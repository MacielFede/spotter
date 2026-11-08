import { PressableText } from '@/components/ui/PressableText';

export function WorkoutHeaderActions({ onCancel }: { onCancel: () => void }) {
  return (
    <PressableText
      accessibilityHint="Discards the active workout draft"
      label="Cancel"
      onPress={onCancel}
      tone="danger"
    />
  );
}
