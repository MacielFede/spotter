import type { Workout } from '@spotter/domain';
import { Pressable, Text, View } from 'react-native';
import {
  ProgressionGraph,
  type ProgressionGraphSeries,
} from '@/components/history/ProgressionGraph';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ListRow } from '@/components/ui/ListRow';
import { formatTimer, formatWhen } from '@/lib/formatWhen';
import {
  type ExerciseOption,
  exerciseLogs,
  repsSeries,
  timeSeries,
  weightSeries,
} from '@/lib/progression';
import { useTheme } from '@/theme/ThemeProvider';

interface ExerciseAccordionItemProps {
  option: ExerciseOption;
  workouts: Workout[];
  expanded: boolean;
  onToggle: () => void;
  onOpenDetails: () => void;
}

export function ExerciseAccordionItem({
  option,
  workouts,
  expanded,
  onToggle,
  onOpenDetails,
}: ExerciseAccordionItemProps) {
  const { tokens } = useTheme();
  const primary = option.usesWeight
    ? weightSeries(workouts, option.exerciseId)
    : option.mode === 'time'
      ? timeSeries(workouts, option.exerciseId)
      : repsSeries(workouts, option.exerciseId);
  const graphSeries: ProgressionGraphSeries[] = [
    {
      key: 'primary',
      label: option.usesWeight ? 'Weight' : option.mode === 'time' ? 'Time' : 'Reps',
      unit: option.usesWeight ? 'kg' : option.mode === 'time' ? 'time' : 'reps',
      points: primary,
    },
  ];
  const logs = exerciseLogs(workouts, option.exerciseId).slice(0, 2);

  return (
    <Card padded={false}>
      <ListRow
        accessibilityState={{ expanded }}
        onPress={onToggle}
        subtitle={`${option.workoutCount} ${option.workoutCount === 1 ? 'log' : 'logs'}`}
        title={option.title}
        trailing={<Icon name={expanded ? 'chevron-up' : 'chevron-down'} />}
      />
      {expanded ? (
        <View style={{ gap: 10, paddingHorizontal: 14, paddingBottom: 14 }}>
          {primary.length > 0 ? (
            <Pressable
              accessibilityHint="Opens the full progression chart"
              accessibilityRole="button"
              onPress={onOpenDetails}
            >
              <ProgressionGraph series={graphSeries} variant="compact" />
            </Pressable>
          ) : (
            <Text style={{ color: tokens.textSecondary }}>No completed sets to chart yet.</Text>
          )}
          {logs.length > 0 ? (
            <View style={{ gap: 6 }}>
              <Text style={{ color: tokens.textPrimary, fontWeight: '600' }}>Recent sets</Text>
              {logs.map((log) => (
                <Text key={log.workoutId} style={{ color: tokens.textSecondary }}>
                  {formatWhen(log.startedAt)} ·{' '}
                  {log.sets
                    .map((set) => {
                      const actual =
                        set.mode === 'reps'
                          ? `${set.actualReps ?? '—'} reps`
                          : set.actualSeconds === null
                            ? '—'
                            : formatTimer(set.actualSeconds);
                      return set.usesWeight && set.actualWeightKg !== null
                        ? `${actual} @ ${set.actualWeightKg} kg`
                        : actual;
                    })
                    .join(' · ')}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
