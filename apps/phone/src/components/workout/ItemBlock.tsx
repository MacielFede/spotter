import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinkifiedText } from '@/components/LinkifiedText';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { useTheme } from '@/theme/ThemeProvider';

interface ItemBlockProps {
  title: string;
  subtitle?: string;
  description?: string;
  expanded: boolean;
  completed: boolean;
  accent?: boolean;
  onToggle: () => void;
  doneLabel?: string;
  onDone?: () => void;
  onOptions: () => void;
  children?: ReactNode;
}

export function ItemBlock({
  title,
  subtitle,
  description,
  expanded,
  completed,
  accent = false,
  doneLabel = 'Done',
  onToggle,
  onDone,
  onOptions,
  children,
}: ItemBlockProps) {
  const { tokens } = useTheme();
  const [rotation] = useState(() => new Animated.Value(expanded ? 1 : 0));

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [expanded, rotation]);

  return (
    <View style={[styles.block, { opacity: completed && !expanded ? 0.58 : 1 }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={onToggle}
          style={styles.titleButton}
        >
          <Animated.View
            style={{
              transform: [
                {
                  rotate: rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '90deg'],
                  }),
                },
              ],
            }}
          >
            <Icon name="chevron-forward" />
          </Animated.View>
          <View style={styles.titleText}>
            <Text style={[styles.title, { color: tokens.textPrimary }]}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: tokens.textSecondary }]}>{subtitle}</Text>
            ) : null}
          </View>
          {completed ? (
            <Text style={[styles.done, { color: tokens.textSecondary }]}>Done</Text>
          ) : null}
        </Pressable>
        <IconButton
          accessibilityLabel={`Options for ${title}`}
          name="ellipsis-vertical"
          onPress={onOptions}
          tone="secondary"
        />
      </View>
      {expanded ? (
        <View
          style={[styles.content, accent && [styles.accent, { borderLeftColor: tokens.primary }]]}
        >
          {description?.trim() ? <LinkifiedText description={description} /> : null}
          {children}
          {onDone ? (
            <Pressable
              accessibilityRole="button"
              onPress={onDone}
              style={[styles.doneButton, { borderColor: tokens.primary }]}
            >
              <Text style={[styles.doneLabel, { color: tokens.primary }]}>{doneLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
  },
  titleButton: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
  },
  titleText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  done: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  content: {
    gap: 12,
    paddingBottom: 4,
  },
  accent: {
    borderLeftWidth: 2,
    paddingLeft: 12,
  },
  doneButton: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  doneLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
});
