import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { type ThemePreference, useTheme } from '@/theme/ThemeProvider';

const choices: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const { preference, setPreference, tokens } = useTheme();
  return (
    <Screen title="Settings" subtitle="Theme, sync, and import/export.">
      <View style={styles.group}>
        <Text style={[styles.label, { color: tokens.textPrimary }]}>Appearance</Text>
        <Text style={[styles.hint, { color: tokens.textSecondary }]}>
          Follows the OS theme by default. Override it here.
        </Text>
        <View style={[styles.row, { borderColor: tokens.border }]}>
          {choices.map(({ value, label }) => {
            const selected = preference === value;
            return (
              <Pressable
                key={value}
                onPress={() => setPreference(value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[
                  styles.choice,
                  { backgroundColor: selected ? tokens.primary : tokens.surface },
                ]}
              >
                <Text
                  style={{
                    color: selected ? tokens.onPrimary : tokens.textPrimary,
                    fontWeight: selected ? '700' : '500',
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.group}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/transfer')}
          style={[styles.link, { borderColor: tokens.border, backgroundColor: tokens.surface }]}
        >
          <View style={styles.linkText}>
            <Text style={[styles.label, { color: tokens.textPrimary }]}>Import / Export</Text>
            <Text style={[styles.hint, { color: tokens.textSecondary }]}>
              Share Plan JSON and logs CSV, or restore from a file.
            </Text>
          </View>
          <Text style={{ color: tokens.textSecondary }}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/exercises')}
          style={[styles.link, { borderColor: tokens.border, backgroundColor: tokens.surface }]}
        >
          <View style={styles.linkText}>
            <Text style={[styles.label, { color: tokens.textPrimary }]}>Exercise library</Text>
            <Text style={[styles.hint, { color: tokens.textSecondary }]}>
              Create, edit, and archive Exercises.
            </Text>
          </View>
          <Text style={{ color: tokens.textSecondary }}>›</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  choice: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 12,
  },
  link: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  linkText: {
    flex: 1,
    gap: 2,
  },
});
