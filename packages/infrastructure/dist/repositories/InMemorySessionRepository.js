export class InMemorySessionRepository {
    store = new Map();
    async save(session) {
        this.store.set(session.id, session);
    }
    async findById(id) {
        return this.store.get(id) ?? null;
    }
    async list() {
        return Array.from(this.store.values());
    }
}
