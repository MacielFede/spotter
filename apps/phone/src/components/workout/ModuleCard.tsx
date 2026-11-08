import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { PressableText } from '@/components/ui/PressableText';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface ModuleCardProps {
  title: string;
  onAddExercise: () => void;
  onAddSuperset: () => void;
  onRemove: () => void;
  children?: ReactNode;
}

export function ModuleCard({
  title,
  onAddExercise,
  onAddSuperset,
  onRemove,
  children,
}: ModuleCardProps) {
  return (
    <Card padded={false}>
      <View style={styles.header}>
        <View style={styles.title}>
          <SectionHeader title={title} />
        </View>
        <IconButton
          accessibilityLabel={`Remove ${title} section from workout`}
          name="ellipsis-vertical"
          onPress={onRemove}
          tone="secondary"
        />
      </View>
      <View style={styles.items}>{children}</View>
      <View style={styles.actions}>
        <PressableText label="+ Add exercise" onPress={onAddExercise} />
        <PressableText label="+ Superset" onPress={onAddSuperset} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingStart: 14,
    paddingTop: 8,
  },
  title: {
    flex: 1,
  },
  items: {
    gap: 0,
    paddingHorizontal: 14,
  },
  actions: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 10,
  },
});
