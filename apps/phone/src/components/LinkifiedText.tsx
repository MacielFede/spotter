import { Linking, Text } from 'react-native';
import { linkifyDescription } from '@/lib/linkify';
import { useTheme } from '@/theme/ThemeProvider';

/** Renders a free-text description with tappable links (ADR 0021). */
export function LinkifiedText({ description }: { description: string }) {
  const { tokens } = useTheme();
  let offset = 0;

  return (
    <Text style={{ color: tokens.textPrimary }}>
      {linkifyDescription(description).map((segment) => {
        const key = `${segment.type}-${offset}`;
        offset += segment.text.length;
        return segment.type === 'link' ? (
          <Text
            key={key}
            accessibilityRole="link"
            style={{ color: tokens.primary, textDecorationLine: 'underline' }}
            onPress={() => {
              Linking.openURL(segment.href).catch(() => undefined);
            }}
          >
            {segment.text}
          </Text>
        ) : (
          <Text key={key}>{segment.text}</Text>
        );
      })}
    </Text>
  );
}
