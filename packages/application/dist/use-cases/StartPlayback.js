export function makeStartPlayback(engine) {
    return async function startPlayback(req) {
        await engine.start(req.leftHz, req.rightHz);
    };
}
