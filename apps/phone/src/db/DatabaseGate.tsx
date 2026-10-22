import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import migrations from '../../drizzle/migrations';
import { db } from './client';

/**
 * Local DB migrations run on app start and are independent of the file
 * `schemaVersion` (ADR 0043). The app never refuses its own database.
 */
export function DatabaseGate({ children }: { children: ReactNode }) {
  const { tokens } = useTheme();
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: tokens.background }]}>
        <Text style={{ color: tokens.danger }}>Database migration failed: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={[styles.center, { backgroundColor: tokens.background }]}>
        <ActivityIndicator color={tokens.primary} />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
