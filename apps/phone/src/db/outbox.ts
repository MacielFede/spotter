import {
  ackOutbox,
  enqueueOutbox,
  failOutbox,
  type OutboxItem,
  type OutboxStore,
  pendingOutbox,
  pendingOutboxCount,
} from '@spotter/domain';
import { eq } from 'drizzle-orm';
import { isoWithOffset } from '../lib/workout';
import { outbox } from './schema';
import type { AppDatabase } from './types';

const rowToItem = (row: typeof outbox.$inferSelect): OutboxItem => ({
  id: row.id,
  kind: row.kind,
  payload: row.payload,
  createdAt: row.createdAt,
  attempts: row.attempts,
  lastError: row.lastError,
});

/** Durable store behind the shared outbox API: survives restarts. */
export const createOutboxStore = (db: AppDatabase): OutboxStore => ({
  all: () => db.select().from(outbox).all().map(rowToItem),
  get: (id) => {
    const row = db.select().from(outbox).where(eq(outbox.id, id)).get();
    return row ? rowToItem(row) : undefined;
  },
  put: (item) => {
    db.insert(outbox).values(item).onConflictDoUpdate({ target: outbox.id, set: item }).run();
  },
  delete: (id) => {
    db.delete(outbox).where(eq(outbox.id, id)).run();
  },
});

export const enqueuePersistedOutbox = (
  db: AppDatabase,
  entry: { id: string; kind: string; payload: string; createdAt?: string },
): OutboxItem =>
  enqueueOutbox(createOutboxStore(db), {
    ...entry,
    createdAt: entry.createdAt ?? isoWithOffset(),
  });

export const pendingPersistedOutbox = (db: AppDatabase, kind?: string): OutboxItem[] =>
  pendingOutbox(createOutboxStore(db), kind);

export const pendingPersistedOutboxCount = (db: AppDatabase, kind?: string): number =>
  pendingOutboxCount(createOutboxStore(db), kind);

export const failPersistedOutbox = (db: AppDatabase, id: string, error: string): void => {
  failOutbox(createOutboxStore(db), id, error);
};

export const ackPersistedOutbox = (db: AppDatabase, id: string): void => {
  ackOutbox(createOutboxStore(db), id);
};
