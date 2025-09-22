const KEY = 'simbeat:sessions:v1';
export class LocalStorageSessionRepository {
    get storage() {
        if (typeof window === 'undefined' || !window.localStorage)
            return null;
        return window.localStorage;
    }
    read() {
        const s = this.storage;
        if (!s)
            return [];
        try {
            const raw = s.getItem(KEY);
            if (!raw)
                return [];
            const parsed = JSON.parse(raw);
            // rehydrate dates if any
            return parsed.map((sess) => ({
                ...sess,
                beat: {
                    ...sess.beat,
                    createdAt: new Date(sess.beat.createdAt),
                },
            }));
        }
        catch {
            return [];
        }
    }
    write(list) {
        const s = this.storage;
        if (!s)
            return;
        s.setItem(KEY, JSON.stringify(list));
    }
    async save(session) {
        const list = this.read();
        const idx = list.findIndex((s) => s.id === session.id);
        if (idx >= 0)
            list[idx] = session;
        else
            list.unshift(session);
        this.write(list);
    }
    async findById(id) {
        const list = this.read();
        return list.find((s) => s.id === id) ?? null;
    }
    async list() {
        return this.read();
    }
}
