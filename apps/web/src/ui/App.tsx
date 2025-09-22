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
import {
  MIN_FREQUENCY_HZ,
  MAX_FREQUENCY_HZ,
  MIN_BEAT_FREQUENCY_HZ,
  MAX_BEAT_FREQUENCY_HZ,
} from '@simbeat/domain';
import { LocalStorageSessionRepository, WebAudioEngine } from '@simbeat/infrastructure';

export function App() {
  // util
  const clamp = (n: number, min: number, max: number) =>
    Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;

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
  const [fieldErrors, setFieldErrors] = useState<{
    left?: string;
    right?: string;
    center?: string;
    beat?: string;
    global?: string;
  }>({});
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

  // Persist UI/audio settings to LocalStorage
  useEffect(() => {
    const key = 'simbeat:ui-settings:v1';
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const s = JSON.parse(saved) as any;
        if (typeof s.volume === 'number') setVolume(clamp(s.volume, 0, 1));
        if (typeof s.pan === 'number') setPan(clamp(s.pan, -1, 1));
        if (typeof s.lockBeat === 'boolean') setLockBeat(s.lockBeat);
        if (typeof s.centerHz === 'number') setCenterHz(clamp(s.centerHz, MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ));
        if (typeof s.beatHz === 'number') setBeatHz(clamp(s.beatHz, MIN_BEAT_FREQUENCY_HZ, MAX_BEAT_FREQUENCY_HZ));
        if (typeof s.leftHz === 'number') setLeftHz(clamp(s.leftHz, MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ));
        if (typeof s.rightHz === 'number') setRightHz(clamp(s.rightHz, MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const key = 'simbeat:ui-settings:v1';
    try {
      const payload = {
        volume,
        pan,
        lockBeat,
        centerHz,
        beatHz,
        leftHz,
        rightHz,
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {}
  }, [volume, pan, lockBeat, centerHz, beatHz, leftHz, rightHz]);

  // Stop audio on unmount and when page is hidden
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        try {
          stopPlayback();
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      try {
        stopPlayback();
      } catch {}
    };
  }, [stopPlayback]);

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

  // Validate inputs and set inline messages
  useEffect(() => {
    const errs: typeof fieldErrors = {};
    if (!lockBeat) {
      // Free mode: check beat range
      const beat = Math.abs(leftHz - rightHz);
      if (beat < MIN_BEAT_FREQUENCY_HZ || beat > MAX_BEAT_FREQUENCY_HZ) {
        errs.global = `Beat must be between ${MIN_BEAT_FREQUENCY_HZ} and ${MAX_BEAT_FREQUENCY_HZ} Hz (currently ${beat.toFixed(
          2,
        )} Hz).`;
      }
      if (leftHz < MIN_FREQUENCY_HZ || leftHz > MAX_FREQUENCY_HZ) {
        errs.left = `Left must be between ${MIN_FREQUENCY_HZ}-${MAX_FREQUENCY_HZ} Hz.`;
      }
      if (rightHz < MIN_FREQUENCY_HZ || rightHz > MAX_FREQUENCY_HZ) {
        errs.right = `Right must be between ${MIN_FREQUENCY_HZ}-${MAX_FREQUENCY_HZ} Hz.`;
      }
    } else {
      // Lock-beat mode: validate center/beat and derived left/right
      if (centerHz < MIN_FREQUENCY_HZ || centerHz > MAX_FREQUENCY_HZ) {
        errs.center = `Center must be between ${MIN_FREQUENCY_HZ}-${MAX_FREQUENCY_HZ} Hz.`;
      }
      if (beatHz < MIN_BEAT_FREQUENCY_HZ || beatHz > MAX_BEAT_FREQUENCY_HZ) {
        errs.beat = `Beat must be between ${MIN_BEAT_FREQUENCY_HZ}-${MAX_BEAT_FREQUENCY_HZ} Hz.`;
      }
      const l = centerHz - beatHz / 2;
      const r = centerHz + beatHz / 2;
      if (l < MIN_FREQUENCY_HZ || l > MAX_FREQUENCY_HZ || r < MIN_FREQUENCY_HZ || r > MAX_FREQUENCY_HZ) {
        errs.global = `Derived frequencies must be within ${MIN_FREQUENCY_HZ}-${MAX_FREQUENCY_HZ} Hz.`;
      }
    }
    setFieldErrors(errs);
  }, [lockBeat, leftHz, rightHz, centerHz, beatHz]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      // Validate/clamp before creating
      const l = clamp(leftHz, MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ);
      const r = clamp(rightHz, MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ);
      const res = await createSession({ id, label, leftHz: l, rightHz: r });
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
            min={MIN_FREQUENCY_HZ}
            max={MAX_FREQUENCY_HZ}
            step={0.1}
            value={leftHz}
            onChange={(e) => {
              const v = clamp(parseFloat(e.target.value), MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ);
              setLeftHz(v);
              if (running) audioEngine.updateFrequencies(v, rightHz);
            }}
            disabled={lockBeat}
          />
          {fieldErrors.left && (
            <div style={{ color: 'crimson', fontSize: 12 }}>{fieldErrors.left}</div>
          )}
        </label>
        <label>
          <div>Right Frequency (Hz)</div>
          <input
            type="number"
            min={MIN_FREQUENCY_HZ}
            max={MAX_FREQUENCY_HZ}
            step={0.1}
            value={rightHz}
            onChange={(e) => {
              const v = clamp(parseFloat(e.target.value), MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ);
              setRightHz(v);
              if (running) audioEngine.updateFrequencies(leftHz, v);
            }}
            disabled={lockBeat}
          />
          {fieldErrors.right && (
            <div style={{ color: 'crimson', fontSize: 12 }}>{fieldErrors.right}</div>
          )}
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
                min={MIN_FREQUENCY_HZ}
                max={MAX_FREQUENCY_HZ}
                step={0.1}
                value={centerHz}
                onChange={(e) => setCenterHz(parseFloat(e.target.value))}
              />
              {fieldErrors.center && (
                <div style={{ color: 'crimson', fontSize: 12 }}>{fieldErrors.center}</div>
              )}
            </label>
            <label>
              <div>Beat Frequency (Hz)</div>
              <input
                type="number"
                min={MIN_BEAT_FREQUENCY_HZ}
                max={MAX_BEAT_FREQUENCY_HZ}
                step={0.1}
                value={beatHz}
                onChange={(e) => setBeatHz(parseFloat(e.target.value))}
              />
              {fieldErrors.beat && (
                <div style={{ color: 'crimson', fontSize: 12 }}>{fieldErrors.beat}</div>
              )}
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
        {fieldErrors.global && (
          <div style={{ color: 'crimson' }}>{fieldErrors.global}</div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button type="submit" disabled={Boolean(fieldErrors.global) || Boolean(fieldErrors.left) || Boolean(fieldErrors.right)}>
            Create Session
          </button>
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
