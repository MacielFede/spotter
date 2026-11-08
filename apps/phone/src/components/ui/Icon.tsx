import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

export type IconName =
  | 'ellipsis-vertical'
  | 'chevron-down'
  | 'chevron-forward'
  | 'chevron-up'
  | 'arrow-up'
  | 'arrow-down'
  | 'close'
  | 'checkmark-circle'
  | 'add-circle-outline';

type Tone = 'primary' | 'secondary' | 'danger';

export function Icon({
  name,
  tone = 'secondary',
  size = 20,
}: {
  name: IconName;
  tone?: Tone;
  size?: number;
}) {
  const { tokens } = useTheme();
  const color =
    tone === 'danger' ? tokens.danger : tone === 'primary' ? tokens.primary : tokens.textSecondary;
  const strokeProps = {
    fill: 'none',
    stroke: color,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
  };

  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      {name === 'ellipsis-vertical' ? (
        <>
          <Circle cx={12} cy={5} fill={color} r={1.6} />
          <Circle cx={12} cy={12} fill={color} r={1.6} />
          <Circle cx={12} cy={19} fill={color} r={1.6} />
        </>
      ) : null}
      {name === 'chevron-down' ? <Path {...strokeProps} d="m6 9 6 6 6-6" /> : null}
      {name === 'chevron-forward' ? <Path {...strokeProps} d="m9 6 6 6-6 6" /> : null}
      {name === 'chevron-up' ? <Path {...strokeProps} d="m6 15 6-6 6 6" /> : null}
      {name === 'arrow-up' ? <Path {...strokeProps} d="M12 19V5m-7 7 7-7 7 7" /> : null}
      {name === 'arrow-down' ? <Path {...strokeProps} d="M12 5v14m7-7-7 7-7-7" /> : null}
      {name === 'close' ? <Path {...strokeProps} d="m6 6 12 12M18 6 6 18" /> : null}
      {name === 'checkmark-circle' ? (
        <>
          <Circle cx={12} cy={12} r={9} {...strokeProps} />
          <Path {...strokeProps} d="m8 12 2.5 2.5L16 9" />
        </>
      ) : null}
      {name === 'add-circle-outline' ? (
        <>
          <Circle cx={12} cy={12} r={9} {...strokeProps} />
          <Path {...strokeProps} d="M12 8v8m-4-4h8" />
        </>
      ) : null}
    </Svg>
  );
}
