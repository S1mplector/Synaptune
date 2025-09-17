import type { Session, SessionRepository } from '@simbeat/domain';

const KEY = 'simbeat:sessions:v1';

export class LocalStorageSessionRepository implements SessionRepository {
  private get storage(): Storage | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  }

  private read(): Session[] {
    const s = this.storage;
    if (!s) return [];
    try {
      const raw = s.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Session[];
      // rehydrate dates if any
      return parsed.map((sess) => ({
        ...sess,
        beat: {
          ...sess.beat,
          createdAt: new Date(sess.beat.createdAt as unknown as string),
        } as any,
      }));
    } catch {
      return [];
    }
  }

  private write(list: Session[]): void {
    const s = this.storage;
    if (!s) return;
    s.setItem(KEY, JSON.stringify(list));
  }

  async save(session: Session): Promise<void> {
    const list = this.read();
    const idx = list.findIndex((s) => s.id === session.id);
    if (idx >= 0) list[idx] = session;
    else list.unshift(session);
    this.write(list);
  }

  async findById(id: string): Promise<Session | null> {
    const list = this.read();
    return list.find((s) => s.id === id) ?? null;
  }

  async list(): Promise<Session[]> {
    return this.read();
  }
}
