import React, { useMemo, useState } from 'react';
import { makeCreateSession } from '@simbeat/application';
import { InMemorySessionRepository } from '@simbeat/infrastructure';

export function App() {
  const sessionRepo = useMemo(() => new InMemorySessionRepository(), []);
  const createSession = useMemo(() => makeCreateSession({ sessionRepo }), [sessionRepo]);

  const [id, setId] = useState<string>(() => crypto.randomUUID());
  const [label, setLabel] = useState<string>('Focus Session');
  const [leftHz, setLeftHz] = useState<number>(220);
  const [rightHz, setRightHz] = useState<number>(226);

  const [result, setResult] = useState<
    | { id: string; label?: string; leftHz: number; rightHz: number; beatHz: number; createdAt: string }
    | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await createSession({ id, label, leftHz, rightHz });
      setResult(res);
      setId(crypto.randomUUID());
    } catch (err: any) {
      setError(err?.message ?? 'Unknown error');
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: '2rem auto', maxWidth: 720 }}>
      <h1>SimBeat</h1>
      <p>Create a binaural beat session via the Application layer.</p>

      <form onSubmit={onCreate} style={{ display: 'grid', gap: '0.75rem', maxWidth: 480 }}>
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
          <div>Left Frequency (Hz)</div>
          <input
            type="number"
            min={1}
            step={0.1}
            value={leftHz}
            onChange={(e) => setLeftHz(parseFloat(e.target.value))}
          />
        </label>
        <label>
          <div>Right Frequency (Hz)</div>
          <input
            type="number"
            min={1}
            step={0.1}
            value={rightHz}
            onChange={(e) => setRightHz(parseFloat(e.target.value))}
          />
        </label>
        <button type="submit">Create Session</button>
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

      <footer style={{ marginTop: '2rem', opacity: 0.7 }}>
        <small>Clean Architecture: Web → Application → Domain • InMemory repo in Infrastructure</small>
      </footer>
    </div>
  );
}
