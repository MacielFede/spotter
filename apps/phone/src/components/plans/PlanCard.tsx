import type { Plan } from '@spotter/domain';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';

export function PlanCard({ plan, onPress }: { plan: Plan; onPress: () => void }) {
  return (
    <Card>
      <ListRow
        onPress={onPress}
        subtitle={`${plan.routines.length} ${plan.routines.length === 1 ? 'Routine' : 'Routines'}`}
        title={plan.name}
      />
    </Card>
  );
}
