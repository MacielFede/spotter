import type { Workout } from '@spotter/domain';
import { Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { formatWhen, formatWorkoutDuration } from '@/lib/formatWhen';
import { workoutDurationSeconds, workoutSetCount, workoutVolumeKg } from '@/lib/workout';
import { useTheme } from '@/theme/ThemeProvider';

export function WorkoutRow({ workout, onPress }: { workout: Workout; onPress: () => void }) {
  const { tokens } = useTheme();
  const summary = `${formatWorkoutDuration(workoutDurationSeconds(workout))} · ${workoutSetCount(workout)} sets · ${workoutVolumeKg(workout)} kg`;
  return (
    <Card>
      <ListRow
        onPress={onPress}
        subtitle={`${workout.planName} · ${formatWhen(workout.startedAt)}`}
        title={workout.routineName}
      />
      <Text style={{ color: tokens.textSecondary }}>{summary}</Text>
    </Card>
  );
}
