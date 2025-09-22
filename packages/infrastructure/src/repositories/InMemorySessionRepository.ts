import { Session, SessionRepository } from '@simbeat/domain';

export class InMemorySessionRepository implements SessionRepository {
  private store = new Map<string, Session>();

  async save(session: Session): Promise<void> {
    this.store.set(session.id, session);
  }

  async findById(id: string): Promise<Session | null> {
    return this.store.get(id) ?? null;
  }

  async list(): Promise<Session[]> {
    return Array.from(this.store.values());
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
