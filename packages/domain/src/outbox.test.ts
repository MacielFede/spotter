import { describe, expect, it } from 'vitest';
import {
  ackOutbox,
  createMemoryOutbox,
  enqueueOutbox,
  failOutbox,
  pendingOutbox,
  pendingOutboxCount,
} from './outbox.js';

const item = (id: string, kind = 'workout-upload', createdAt = '2026-10-12T18:30:00+02:00') => ({
  id,
  kind,
  payload: '{}',
  createdAt,
});

describe('shared outbox (issue #39)', () => {
  it('queues items and dedupes by id', () => {
    const store = createMemoryOutbox();
    enqueueOutbox(store, item('a'));
    enqueueOutbox(store, item('a'));
    expect(pendingOutboxCount(store)).toBe(1);
  });

  it('keeps failed items queued and counts attempts', () => {
    const store = createMemoryOutbox();
    enqueueOutbox(store, item('a'));
    failOutbox(store, 'a', 'transport down');
    const pending = pendingOutbox(store);
    expect(pending).toHaveLength(1);
    expect(pending[0]?.attempts).toBe(1);
    expect(pending[0]?.lastError).toBe('transport down');
  });

  it('removes only on ack (persisted), then re-enqueue works for a new session', () => {
    const store = createMemoryOutbox();
    enqueueOutbox(store, item('a'));
    ackOutbox(store, 'a');
    expect(pendingOutboxCount(store)).toBe(0);
    enqueueOutbox(store, item('a'));
    expect(pendingOutboxCount(store)).toBe(1);
  });

  it('orders pending items and filters by kind', () => {
    const store = createMemoryOutbox();
    enqueueOutbox(store, item('b', 'plan-push', '2026-10-12T19:00:00+02:00'));
    enqueueOutbox(store, item('a', 'workout-upload', '2026-10-12T18:00:00+02:00'));
    expect(pendingOutbox(store).map((entry) => entry.id)).toEqual(['a', 'b']);
    expect(pendingOutbox(store, 'plan-push').map((entry) => entry.id)).toEqual(['b']);
  });
});
