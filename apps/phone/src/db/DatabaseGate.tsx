import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSnackbar } from '@/components/ui/SnackbarProvider';
import { useTheme } from '@/theme/ThemeProvider';
import migrations from '../../drizzle/migrations';
import { db } from './client';

/**
 * Local DB migrations run on app start and are independent of the file
 * `schemaVersion` (ADR 0043). The app never refuses its own database.
 */
export function DatabaseGate({ children }: { children: ReactNode }) {
  const { tokens } = useTheme();
  const { showError } = useSnackbar();
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (error) showError(`Database migration failed: ${error.message}`);
  }, [error, showError]);

  if (error) {
    return <View style={[styles.center, { backgroundColor: tokens.background }]} />;
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
