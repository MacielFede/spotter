/**
 * The single durable-outbox abstraction for both sync directions (ADR 0005,
 * ADR 0028, ADR 0041). Transport code only ever enqueues, sends pending items,
 * records failures, and acknowledges **persisted** items.
 */
export interface OutboxItem {
  /** Idempotency key: the workoutId or plan push id. Enqueueing the same id is a no-op. */
  id: string;
  kind: string;
  payload: string;
  createdAt: string;
  attempts: number;
  lastError: string | null;
}

export interface OutboxStore {
  all(): OutboxItem[];
  get(id: string): OutboxItem | undefined;
  put(item: OutboxItem): void;
  delete(id: string): void;
}

/** Add an item unless its id is already queued or already acknowledged. */
export const enqueueOutbox = (
  store: OutboxStore,
  item: { id: string; kind: string; payload: string; createdAt: string },
): OutboxItem => {
  const existing = store.get(item.id);
  if (existing) return existing;
  const queued: OutboxItem = { ...item, attempts: 0, lastError: null };
  store.put(queued);
  return queued;
};

/** Pending items in creation order, optionally for one kind. */
export const pendingOutbox = (store: OutboxStore, kind?: string): OutboxItem[] =>
  store
    .all()
    .filter((item) => !kind || item.kind === kind)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

/** Record a failed attempt; the item stays queued. */
export const failOutbox = (store: OutboxStore, id: string, error: string): void => {
  const item = store.get(id);
  if (!item) return;
  store.put({ ...item, attempts: item.attempts + 1, lastError: error });
};

/** Ack means persisted, not merely received (ADR 0041): only now is it removed. */
export const ackOutbox = (store: OutboxStore, id: string): void => {
  store.delete(id);
};

export const pendingOutboxCount = (store: OutboxStore, kind?: string): number =>
  pendingOutbox(store, kind).length;

/** In-memory store for tests and for surfaces that don't persist yet. */
export const createMemoryOutbox = (): OutboxStore => {
  const items = new Map<string, OutboxItem>();
  return {
    all: () => [...items.values()],
    get: (id) => items.get(id),
    put: (item) => {
      items.set(item.id, item);
    },
    delete: (id) => {
      items.delete(id);
    },
  };
};
