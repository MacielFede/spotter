import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';

interface RoutineCardProps {
  title: string;
  subtitle: string;
  onPress?: () => void;
  trailing?: ReactNode;
  children?: ReactNode;
}

export function RoutineCard({ title, subtitle, onPress, trailing, children }: RoutineCardProps) {
  return (
    <Card>
      {onPress && trailing ? (
        <View style={styles.row}>
          <View style={styles.main}>
            <ListRow title={title} subtitle={subtitle} onPress={onPress} />
          </View>
          {trailing}
        </View>
      ) : (
        <ListRow title={title} subtitle={subtitle} onPress={onPress} trailing={trailing} />
      )}
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  main: {
    flex: 1,
  },
});
