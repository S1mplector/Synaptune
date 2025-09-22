export function makeClearSessions({ sessionRepo }) {
    return async function clearSessions() {
        await sessionRepo.clear();
    };
}
