export function makeDeleteSession({ sessionRepo }) {
    return async function deleteSession(id) {
        await sessionRepo.delete(id);
    };
}
