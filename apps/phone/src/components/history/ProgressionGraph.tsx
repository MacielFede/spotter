import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { Card } from '@/components/ui/Card';
import { formatWhen } from '@/lib/formatWhen';
import type { ProgressionPoint } from '@/lib/progression';
import { useTheme } from '@/theme/ThemeProvider';

export interface ProgressionGraphSeries {
  key: string;
  label: string;
  unit: string;
  color?: string;
  formatValue?: (value: number) => string;
  points: ProgressionPoint[];
}

interface ProgressionGraphProps {
  series: ProgressionGraphSeries[];
  variant: 'compact' | 'full';
}

const viewWidth = 320;

const makeCoordinates = (points: ProgressionPoint[], height: number, compact: boolean) => {
  const horizontalPadding = compact ? 10 : 48;
  const topPadding = 8;
  const bottomPadding = 10;
  const values = points.map((point) => point.value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(1, maximum - minimum);
  const low = Math.max(0, minimum - range * 0.15);
  const high = maximum + range * 0.15;
  const plotHeight = height - topPadding - bottomPadding;
  const plotWidth = viewWidth - horizontalPadding * 2;

  const coordinates = points.map((point, index) => ({
    x:
      points.length === 1
        ? viewWidth / 2
        : horizontalPadding + (plotWidth * index) / (points.length - 1),
    y: topPadding + plotHeight - ((point.value - low) / (high - low)) * plotHeight,
  }));
  const line = coordinates
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x},${y}`)
    .join(' ');
  const last = coordinates[coordinates.length - 1];
  const first = coordinates[0];
  const area =
    first && last && points.length > 1
      ? `${line} L${last.x},${height - bottomPadding} L${first.x},${height - bottomPadding} Z`
      : '';

  return { area, coordinates, high, line, low };
};

export function ProgressionGraph({ series, variant }: ProgressionGraphProps) {
  const { tokens } = useTheme();
  const compact = variant === 'compact';
  const visibleSeries = compact ? series.slice(0, 1) : series;
  const height = compact ? 54 : 178;

  return (
    <View style={styles.graphs}>
      {visibleSeries.map((item) => {
        const points = item.points;
        if (points.length === 0) return null;
        const geometry = makeCoordinates(points, height, compact);
        const color = item.color ?? tokens.primary;

        if (compact) {
          return (
            <Svg
              key={item.key}
              height={height}
              preserveAspectRatio="none"
              viewBox={`0 0 ${viewWidth} ${height}`}
              width="100%"
            >
              {geometry.area ? <Path d={geometry.area} fill={color} fillOpacity={0.14} /> : null}
              <Path d={geometry.line} fill="none" stroke={color} strokeWidth={2.5} />
              {geometry.coordinates.map((coordinate, index) => {
                const source = points[index];
                return source ? (
                  <Circle
                    key={source.workoutId}
                    cx={coordinate.x}
                    cy={coordinate.y}
                    fill={color}
                    r={2.5}
                  />
                ) : null;
              })}
            </Svg>
          );
        }

        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        return (
          <Card key={item.key}>
            <View style={styles.chartHeading}>
              <Text style={[styles.title, { color: tokens.textPrimary }]}>{item.label}</Text>
              <Text style={[styles.current, { color: tokens.textSecondary }]}>
                {lastPoint
                  ? (item.formatValue?.(lastPoint.value) ?? `${lastPoint.value} ${item.unit}`)
                  : ''}
              </Text>
            </View>
            <Svg
              height={height}
              preserveAspectRatio="none"
              viewBox={`0 0 ${viewWidth} ${height}`}
              width="100%"
            >
              {[0, 0.5, 1].map((fraction) => {
                const y = 10 + fraction * (height - 28);
                const value = geometry.high - fraction * (geometry.high - geometry.low);
                return (
                  <Fragment key={fraction}>
                    <Line
                      stroke={tokens.border}
                      strokeDasharray="3 5"
                      strokeWidth={1}
                      x1={42}
                      x2={viewWidth - 8}
                      y1={y}
                      y2={y}
                    />
                    <SvgText fill={tokens.textSecondary} fontSize={9} x={2} y={y - 2}>
                      {item.formatValue?.(value) ?? Number(value.toFixed(1))}
                    </SvgText>
                  </Fragment>
                );
              })}
              {geometry.area ? <Path d={geometry.area} fill={color} fillOpacity={0.14} /> : null}
              <Path d={geometry.line} fill="none" stroke={color} strokeWidth={2.5} />
              {geometry.coordinates.map((coordinate, index) => {
                const source = points[index];
                return source ? (
                  <Circle
                    key={source.workoutId}
                    cx={coordinate.x}
                    cy={coordinate.y}
                    fill={color}
                    r={3}
                  />
                ) : null;
              })}
              {firstPoint ? (
                <SvgText fill={tokens.textSecondary} fontSize={9} x={44} y={height - 1}>
                  {formatWhen(firstPoint.startedAt)}
                </SvgText>
              ) : null}
              {lastPoint ? (
                <SvgText
                  fill={tokens.textSecondary}
                  fontSize={9}
                  textAnchor="end"
                  x={viewWidth - 8}
                  y={height - 1}
                >
                  {formatWhen(lastPoint.startedAt)}
                </SvgText>
              ) : null}
            </Svg>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  graphs: {
    gap: 10,
  },
  chartHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  current: {
    fontSize: 13,
    fontWeight: '600',
  },
});
