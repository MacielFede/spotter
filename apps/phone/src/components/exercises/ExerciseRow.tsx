import type { Exercise } from '@spotter/domain';
import { LinkifiedText } from '@/components/LinkifiedText';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';

interface ExerciseRowProps {
  exercise: Exercise;
  onPress: () => void;
}

export function ExerciseRow({ exercise, onPress }: ExerciseRowProps) {
  const status = [
    exercise.usesWeight ? 'Weighted' : 'Bodyweight / unweighted',
    exercise.archived ? 'Archived' : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card>
      <ListRow onPress={onPress} subtitle={status} title={exercise.title} />
      {exercise.description ? <LinkifiedText description={exercise.description} /> : null}
    </Card>
  );
}
