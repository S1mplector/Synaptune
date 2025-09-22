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
import './styles.css';
import { PlaybackBar } from './components/PlaybackBar';
import { ToneControls } from './components/ToneControls';
import { AudioControls } from './components/AudioControls';
import { PresetsPanel } from './components/PresetsPanel';
import { SessionsPanel } from './components/SessionsPanel';

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
    <div className="container">
      <div className="header">
        <h1>Synaptune</h1>
        <span className="muted">Binaural beat simulator</span>
      </div>

      <form onSubmit={onCreate} className="col">
        <PresetsPanel
          presets={presets}
          selectedName={presetName}
          onSelect={setPresetName}
          onCreateFromPreset={onCreateFromPreset}
        />

        <div className="panel col">
          <label>
            <div>Session Label</div>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Focus Session"
            />
          </label>
        </div>

        <ToneControls
          lockBeat={lockBeat}
          leftHz={leftHz}
          rightHz={rightHz}
          centerHz={centerHz}
          beatHz={beatHz}
          minFreq={MIN_FREQUENCY_HZ}
          maxFreq={MAX_FREQUENCY_HZ}
          minBeat={MIN_BEAT_FREQUENCY_HZ}
          maxBeat={MAX_BEAT_FREQUENCY_HZ}
          errors={fieldErrors}
          onToggleLockBeat={(next) => {
            setLockBeat(next);
            if (next) {
              const c = (leftHz + rightHz) / 2;
              const b = Math.abs(leftHz - rightHz);
              setCenterHz(c);
              setBeatHz(b);
            }
          }}
          onLeftChange={(v) => {
            const next = clamp(v, MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ);
            setLeftHz(next);
            if (running) audioEngine.updateFrequencies(next, rightHz);
          }}
          onRightChange={(v) => {
            const next = clamp(v, MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ);
            setRightHz(next);
            if (running) audioEngine.updateFrequencies(leftHz, next);
          }}
          onCenterChange={(v) => setCenterHz(clamp(v, MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ))}
          onBeatChange={(v) => setBeatHz(clamp(v, MIN_BEAT_FREQUENCY_HZ, MAX_BEAT_FREQUENCY_HZ))}
          running={running}
        />

        <AudioControls
          volume={volume}
          pan={pan}
          onVolume={(v) => setVolume(v)}
          onPan={(v) => setPan(v)}
        />

        {fieldErrors.global && <div className="panel error-text">{fieldErrors.global}</div>}

        <PlaybackBar
          running={running}
          onStart={() => startPlayback({ leftHz, rightHz })}
          onStop={() => stopPlayback()}
        />

        <div className="panel col">
          <button type="submit" disabled={Boolean(fieldErrors.global) || Boolean(fieldErrors.left) || Boolean(fieldErrors.right)}>
            Create Session
          </button>
        </div>
      </form>

      {error && (
        <div className="panel" style={{ borderColor: 'var(--error)' }}>
          <strong style={{ color: 'var(--error)' }}>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="panel">
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

      <SessionsPanel
        sessions={sessions}
        onDelete={async (id) => {
          await deleteSession(id);
          setSessions(await listSessions());
        }}
        onClear={async () => {
          await clearSessions();
          setSessions(await listSessions());
        }}
      />

      <div className="muted" style={{ marginTop: '1rem' }}>
        Clean Architecture: Web → Application → Domain
      </div>
    </div>
  );
}
