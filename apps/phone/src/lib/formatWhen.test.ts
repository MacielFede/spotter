import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatTimer, formatWhen, formatWorkoutDuration, parseTimerInput } from './formatWhen';

afterEach(() => vi.unstubAllGlobals());

describe('human-readable time formatting', () => {
  it('uses relative labels for recent dates and an absolute date otherwise', () => {
    const now = new Date(2026, 9, 28, 12, 0);
    const today = new Date(2026, 9, 28, 18, 42);
    const yesterday = new Date(2026, 9, 27, 10, 0);
    const thisWeek = new Date(2026, 9, 25, 10, 0);
    const older = new Date(2026, 9, 1, 10, 0);

    expect(formatWhen(today, now, 'en-US')).toMatch(/^Today,/);
    expect(formatWhen(yesterday, now, 'en-US')).toBe('Yesterday');
    expect(formatWhen(thisWeek, now, 'en-US')).toMatch(/Sun/);
    expect(formatWhen(older, now, 'en-US')).toMatch(/2026/);
  });

  it('uses a localized date when RelativeTimeFormat is unavailable', () => {
    const nativeIntl = Intl;
    vi.stubGlobal('Intl', {
      DateTimeFormat: nativeIntl.DateTimeFormat,
      NumberFormat: nativeIntl.NumberFormat,
      RelativeTimeFormat: undefined,
    });

    const now = new Date(2026, 9, 28, 12, 0);
    expect(formatWhen(new Date(2026, 9, 28, 18, 42), now, 'en-US')).toMatch(/^Wed, Oct 28,/);
    expect(formatWhen(new Date(2026, 9, 27, 10, 0), now, 'en-US')).toBe('Tue, Oct 27');
  });

  it('formats timer and workout durations accessibly', () => {
    expect(formatTimer(45, 'en-US')).toBe('45s');
    expect(formatTimer(600, 'en-US')).toBe('10:00');
    expect(formatWorkoutDuration(3900, 'en-US')).toBe('1 hr 5 min');
  });

  it('parses timer input without accepting invalid seconds', () => {
    expect(parseTimerInput('10:00')).toBe(600);
    expect(parseTimerInput('45')).toBe(45);
    expect(parseTimerInput('1:60')).toBeNull();
    expect(parseTimerInput('')).toBeNull();
  });
});
