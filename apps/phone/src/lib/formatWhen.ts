const dayInMilliseconds = 24 * 60 * 60 * 1000;

const localDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const localeFor = (locale?: string): string =>
  locale ?? Intl.DateTimeFormat().resolvedOptions().locale;

const capitalize = (value: string, locale: string): string =>
  value.length === 0 ? value : `${value[0]?.toLocaleUpperCase(locale)}${value.slice(1)}`;

const relativeDayLabel = (date: Date, dayDifference: number, locale: string): string => {
  if (typeof Intl.RelativeTimeFormat === 'function') {
    const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
      -dayDifference,
      'day',
    );
    return capitalize(relative, locale);
  }

  // Some React Native JS runtimes do not include RelativeTimeFormat.
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
};

/** Relative for this week, an explicit localized date for older timestamps. */
export const formatWhen = (value: string | Date, now = new Date(), locale?: string): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';

  const resolvedLocale = localeFor(locale);
  const dayDifference = Math.round((localDay(now) - localDay(date)) / dayInMilliseconds);
  const time = new Intl.DateTimeFormat(resolvedLocale, { timeStyle: 'short' }).format(date);

  if (dayDifference === 0 || dayDifference === 1) {
    const label = relativeDayLabel(date, dayDifference, resolvedLocale);
    return dayDifference === 0 ? `${label}, ${time}` : label;
  }

  if (dayDifference > 1 && dayDifference < 7) {
    return new Intl.DateTimeFormat(resolvedLocale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date);
  }

  return new Intl.DateTimeFormat(resolvedLocale, { dateStyle: 'medium' }).format(date);
};

/** Clock-style duration for exercise targets and rest periods. */
export const formatTimer = (seconds: number, locale?: string): string => {
  const value = Math.max(0, Math.round(seconds));
  if (value < 60) {
    return new Intl.NumberFormat(localeFor(locale), {
      style: 'unit',
      unit: 'second',
      unitDisplay: 'narrow',
    }).format(value);
  }
  const minutes = Math.floor(value / 60);
  const remainder = String(value % 60).padStart(2, '0');
  return `${minutes}:${remainder}`;
};

/** Compact human-readable duration for a complete workout. */
export const formatWorkoutDuration = (seconds: number, locale?: string): string => {
  const resolvedLocale = localeFor(locale);
  const minutes = Math.max(0, Math.round(seconds / 60));
  if (minutes < 1) {
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'unit',
      unit: 'second',
      unitDisplay: 'short',
    }).format(Math.max(0, Math.round(seconds)));
  }

  const number = new Intl.NumberFormat(resolvedLocale, {
    style: 'unit',
    unit: 'minute',
    unitDisplay: 'short',
  });
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return number.format(minutes);

  const hourNumber = new Intl.NumberFormat(resolvedLocale, {
    style: 'unit',
    unit: 'hour',
    unitDisplay: 'short',
  });
  return remainder === 0
    ? hourNumber.format(hours)
    : `${hourNumber.format(hours)} ${number.format(remainder)}`;
};

/** Accept seconds or mm:ss while preserving null for empty/incomplete input. */
export const parseTimerInput = (raw: string): number | null => {
  const value = raw.trim();
  if (!value) return null;
  const clock = /^(\d+):(\d{1,2})$/.exec(value);
  if (clock) {
    const minutes = Number(clock[1]);
    const seconds = Number(clock[2]);
    return seconds < 60 ? minutes * 60 + seconds : null;
  }
  const seconds = Number(value.replace(/\s*s$/i, ''));
  return Number.isInteger(seconds) && seconds >= 0 ? seconds : null;
};
