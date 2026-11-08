import { router } from 'expo-router';
import { Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ListRow } from '@/components/ui/ListRow';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { type ThemePreference, useTheme } from '@/theme/ThemeProvider';

const choices = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

export default function SettingsScreen() {
  const { preference, setPreference, systemScheme, tokens } = useTheme();
  return (
    <Screen>
      <Text style={{ color: tokens.textSecondary }}>Theme, sync, and import/export.</Text>

      <Card>
        <Text style={{ color: tokens.textPrimary, fontSize: 17, fontWeight: '600' }}>
          Appearance
        </Text>
        <Text style={{ color: tokens.textSecondary }}>
          Follows the OS theme by default. Override it here.
        </Text>
        <SegmentedControl
          options={[...choices]}
          value={preference}
          onChange={(value) => setPreference(value as ThemePreference)}
        />
        {preference === 'system' && systemScheme === null ? (
          <Text accessibilityRole="alert" style={{ color: tokens.textSecondary }}>
            System appearance is unavailable, so Spotter is using a fallback theme until the OS can
            be detected.
          </Text>
        ) : null}
      </Card>

      <Card>
        <ListRow
          onPress={() => router.push('/transfer')}
          subtitle="Share Plan JSON and logs CSV, or restore from a file."
          title="Import / Export"
          trailing={<Icon name="chevron-forward" />}
        />
      </Card>

      <Card>
        <ListRow
          onPress={() => router.push('/exercises')}
          subtitle="Create, edit, and archive Exercises."
          title="Exercise library"
          trailing={<Icon name="chevron-forward" />}
        />
      </Card>
    </Screen>
  );
}
