import React, { useEffect, useMemo, useState } from 'react';
import {
  makeCreateSession,
  makeStartPlayback,
  makeStopPlayback,
  listPresets,
  makeCreateSessionFromPreset,
  makeListSessions,
  makeDeleteSession,
  makeClearSessions,
  makeRetuneKeepingBeat,
  computeLeftRightFromCenterBeat,
} from '@simbeat/application';
import { LocalStorageSessionRepository, WebAudioEngine } from '@simbeat/infrastructure';

export function App() {
  const sessionRepo = useMemo(() => new LocalStorageSessionRepository(), []);
  const createSession = useMemo(() => makeCreateSession({ sessionRepo }), [sessionRepo]);
  const createSessionFromPreset = useMemo(
    () => makeCreateSessionFromPreset({ sessionRepo }),
    [sessionRepo]
  );
  const listSessions = useMemo(() => makeListSessions({ sessionRepo }), [sessionRepo]);
  const deleteSession = useMemo(() => makeDeleteSession({ sessionRepo }), [sessionRepo]);
  const clearSessions = useMemo(() => makeClearSessions({ sessionRepo }), [sessionRepo]);

  const audioEngine = useMemo(() => new WebAudioEngine(), []);
  const startPlayback = useMemo(() => makeStartPlayback(audioEngine), [audioEngine]);
  const stopPlayback = useMemo(() => makeStopPlayback(audioEngine), [audioEngine]);
  const [volume, setVolume] = useState<number>(() => 0.5);
  const [pan, setPan] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const retuneKeepingBeat = useMemo(() => makeRetuneKeepingBeat(audioEngine), [audioEngine]);

  const [id, setId] = useState<string>(() => crypto.randomUUID());
  const [label, setLabel] = useState<string>('Focus Session');
  const [leftHz, setLeftHz] = useState<number>(220);
  const [rightHz, setRightHz] = useState<number>(226);
  const [lockBeat, setLockBeat] = useState<boolean>(false);
  const [centerHz, setCenterHz] = useState<number>(() => (220 + 226) / 2);
  const [beatHz, setBeatHz] = useState<number>(() => Math.abs(220 - 226));

  const [result, setResult] = useState<
    | { id: string; label?: string; leftHz: number; rightHz: number; beatHz: number; createdAt: string }
    | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<
    { id: string; label?: string; leftHz: number; rightHz: number; beatHz: number; createdAt: string }[]
  >([]);

  const presets = useMemo(() => listPresets(), []);
  const [presetName, setPresetName] = useState<string>(presets[0]?.name ?? '');

  useEffect(() => {
    // Load persisted sessions on mount
    listSessions().then(setSessions).catch(() => {});
  }, [listSessions]);

  useEffect(() => {
    // Initialize and subscribe to engine state
    try {
      setVolume(audioEngine.getVolume());
      setPan(audioEngine.getPan());
      setRunning(audioEngine.isRunning());
    } catch {}
    const unsub = audioEngine.subscribe((state) => {
      setRunning(state.running);
      setVolume(state.volume);
      setPan(state.pan);
    });
    return () => {
      try {
        unsub();
      } catch {}
    };
  }, [audioEngine]);

  useEffect(() => {
    try {
      audioEngine.setVolume(volume);
    } catch {}
  }, [audioEngine, volume]);

  useEffect(() => {
    try {
      audioEngine.setPan(pan);
    } catch {}
  }, [audioEngine, pan]);

  // When Lock Beat is enabled and center/beat change, compute left/right and retune
  useEffect(() => {
    if (!lockBeat) return;
    try {
      const { leftHz: l, rightHz: r } = retuneKeepingBeat({ centerHz, beatHz });
      setLeftHz(l);
      setRightHz(r);
    } catch (e) {
      // invalid ranges; ignore for now
    }
  }, [lockBeat, centerHz, beatHz, retuneKeepingBeat]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await createSession({ id, label, leftHz, rightHz });
      setResult(res);
      setId(crypto.randomUUID());
      setSessions(await listSessions());
    } catch (err: any) {
      setError(err?.message ?? 'Unknown error');
    }
  }

  async function onCreateFromPreset() {
    setError(null);
    try {
      const res = await createSessionFromPreset({ id: crypto.randomUUID(), presetName });
      setResult(res);
      setSessions(await listSessions());
    } catch (err: any) {
      setError(err?.message ?? 'Unknown error');
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: '2rem auto', maxWidth: 720 }}>
      <h1>SimBeat</h1>
      <p>Create a binaural beat session via the Application layer and control playback.</p>

      <form onSubmit={onCreate} style={{ display: 'grid', gap: '0.75rem', maxWidth: 640 }}>
        <label>
          <div>Session Label</div>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Focus Session"
          />
        </label>
        <label>
          <div>Preset</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select value={presetName} onChange={(e) => setPresetName(e.target.value)}>
              {presets.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} — {p.leftHz} / {p.rightHz} Hz
                </option>
              ))}
            </select>
            <button type="button" onClick={onCreateFromPreset}>
              Create From Preset
            </button>
          </div>
        </label>
        <label>
          <div>Left Frequency (Hz)</div>
          <input
            type="number"
            min={1}
            step={0.1}
            value={leftHz}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setLeftHz(v);
              if (running) audioEngine.updateFrequencies(v, rightHz);
            }}
            disabled={lockBeat}
          />
        </label>
        <label>
          <div>Right Frequency (Hz)</div>
          <input
            type="number"
            min={1}
            step={0.1}
            value={rightHz}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setRightHz(v);
              if (running) audioEngine.updateFrequencies(leftHz, v);
            }}
            disabled={lockBeat}
          />
        </label>
        <label>
          <div>
            <input
              type="checkbox"
              checked={lockBeat}
              onChange={(e) => {
                const next = e.target.checked;
                setLockBeat(next);
                if (next) {
                  // initialize center/beat from current freqs
                  const c = (leftHz + rightHz) / 2;
                  const b = Math.abs(leftHz - rightHz);
                  setCenterHz(c);
                  setBeatHz(b);
                }
              }}
            />{' '}
            Lock Beat (control via Center & Beat)
          </div>
        </label>
        {lockBeat && (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <label>
              <div>Center Frequency (Hz)</div>
              <input
                type="number"
                min={1}
                step={0.1}
                value={centerHz}
                onChange={(e) => setCenterHz(parseFloat(e.target.value))}
              />
            </label>
            <label>
              <div>Beat Frequency (Hz)</div>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={beatHz}
                onChange={(e) => setBeatHz(parseFloat(e.target.value))}
              />
            </label>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Resulting: Left {leftHz.toFixed(2)} Hz • Right {rightHz.toFixed(2)} Hz
            </div>
          </div>
        )}
        <label>
          <div>Master Volume: {(volume * 100).toFixed(0)}%</div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />
        </label>
        <label>
          <div>Stereo Pan: {pan < 0 ? `${Math.round(Math.abs(pan) * 100)}% L` : pan > 0 ? `${Math.round(pan * 100)}% R` : 'Center'}</div>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={pan}
            onChange={(e) => setPan(parseFloat(e.target.value))}
          />
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button type="submit">Create Session</button>
          <button type="button" onClick={() => startPlayback({ leftHz, rightHz })}>
            Start Playback
          </button>
          <button type="button" onClick={() => stopPlayback()} disabled={!running}>
            Stop Playback
          </button>
          <span style={{ fontSize: 12, opacity: 0.75 }}>
            Status: {running ? 'Running' : 'Stopped'}
          </span>
        </div>
      </form>

      {error && (
        <div style={{ marginTop: '1rem', color: 'crimson' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: 8 }}>
          <h2>Session Created</h2>
          <ul>
            <li>
              <strong>ID:</strong> {result.id}
            </li>
            <li>
              <strong>Label:</strong> {result.label || '—'}
            </li>
            <li>
              <strong>Left Hz:</strong> {result.leftHz}
            </li>
            <li>
              <strong>Right Hz:</strong> {result.rightHz}
            </li>
            <li>
              <strong>Beat Hz:</strong> {result.beatHz}
            </li>
            <li>
              <strong>Created At:</strong> {new Date(result.createdAt).toLocaleString()}
            </li>
          </ul>
        </div>
      )}

      {sessions.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h2>Sessions</h2>
          <div style={{ marginBottom: '0.5rem' }}>
            <button
              type="button"
              onClick={async () => {
                await clearSessions();
                setSessions(await listSessions());
              }}
            >
              Clear All
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Label</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Left</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Right</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Beat</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Created</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td style={{ padding: '0.25rem 0' }}>{s.label || '—'}</td>
                  <td>{s.leftHz} Hz</td>
                  <td>{s.rightHz} Hz</td>
                  <td>{s.beatHz} Hz</td>
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteSession(s.id);
                        setSessions(await listSessions());
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer style={{ marginTop: '2rem', opacity: 0.7 }}>
        <small>Clean Architecture: Web → Application → Domain • InMemory repo in Infrastructure</small>
      </footer>
    </div>
  );
}
