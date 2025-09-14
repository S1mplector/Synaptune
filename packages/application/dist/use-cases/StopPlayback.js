export function makeStopPlayback(engine) {
    return async function stopPlayback() {
        await engine.stop();
    };
}
