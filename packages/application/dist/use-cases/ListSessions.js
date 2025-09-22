export function makeListSessions({ sessionRepo }) {
    return async function listSessions() {
        const sessions = await sessionRepo.list();
        return sessions.map((s) => ({
            id: s.id,
            label: s.label,
            leftHz: s.beat.left.hz,
            rightHz: s.beat.right.hz,
            beatHz: s.beat.beatFrequency,
            createdAt: s.beat.createdAt.toISOString(),
        }));
    };
}
