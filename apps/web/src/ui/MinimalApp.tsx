import React, { useEffect, useMemo, useState } from 'react';
import { makeStartPlayback, makeStopPlayback, computeLeftRightFromCenterBeat } from '@simbeat/application';
import { MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ, MIN_BEAT_FREQUENCY_HZ, MAX_BEAT_FREQUENCY_HZ } from '@simbeat/domain';
import { WebAudioEngine } from '@simbeat/infrastructure';
import './styles.css';
import { Visualizer } from './components/Visualizer';

export function MinimalApp() {
  const clamp = (n: number, min: number, max: number) =>
    Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;

  const audioEngine = useMemo(() => new WebAudioEngine(), []);
  const startPlayback = useMemo(() => makeStartPlayback(audioEngine), [audioEngine]);
  const stopPlayback = useMemo(() => makeStopPlayback(audioEngine), [audioEngine]);

  const [running, setRunning] = useState<boolean>(false);
  const [leftHz, setLeftHz] = useState<number>(220);
  const [rightHz, setRightHz] = useState<number>(226);
  const [leftText, setLeftText] = useState<string>('220');
  const [rightText, setRightText] = useState<string>('226');
  const [volume, setVolume] = useState<number>(0.5);
  const [pan, setPan] = useState<number>(0);

  // Optional Lock-Beat mini-mode
  const [lockBeat, setLockBeat] = useState<boolean>(false);
  const [centerHz, setCenterHz] = useState<number>(() => (220 + 226) / 2);
  const [beatHz, setBeatHz] = useState<number>(() => Math.abs(220 - 226));

  useEffect(() => {
    try {
      setRunning(audioEngine.isRunning());
      setVolume(audioEngine.getVolume());
      setPan(audioEngine.getPan());
    } catch {}
    const unsub = audioEngine.subscribe((state) => {
      setRunning(state.running);
      setVolume(state.volume);
      setPan(state.pan);
    });
    return () => {
      try { unsub(); } catch {}
    };
  }, [audioEngine]);

  // Stop audio on unmount and when page is hidden
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        try { stopPlayback(); } catch {}
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      try { stopPlayback(); } catch {}
    };
  }, [stopPlayback]);

  const onLeftChange = (v: number) => {
    const next = clamp(v, MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ);
    setLeftHz(next);
    setLeftText(String(Number.isFinite(next) ? next : ''));
    if (running) audioEngine.updateFrequencies(next, rightHz);
    if (lockBeat) {
      const c = (next + rightHz) / 2;
      const b = Math.abs(next - rightHz);
      setCenterHz(c);
      setBeatHz(b);
    }
  };

  const onRightChange = (v: number) => {
    const next = clamp(v, MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ);
    setRightHz(next);
    setRightText(String(Number.isFinite(next) ? next : ''));
    if (running) audioEngine.updateFrequencies(leftHz, next);
    if (lockBeat) {
      const c = (leftHz + next) / 2;
      const b = Math.abs(leftHz - next);
      setCenterHz(c);
      setBeatHz(b);
    }
  };

  // Lock-beat retune from center/beat
  useEffect(() => {
    if (!lockBeat) return;
    try {
      const { leftHz: l, rightHz: r } = computeLeftRightFromCenterBeat({ centerHz, beatHz });
      setLeftHz(l);
      setRightHz(r);
      setLeftText(String(l));
      setRightText(String(r));
      if (running) audioEngine.updateFrequencies(l, r);
    } catch {}
  }, [lockBeat, centerHz, beatHz]);

  // Persist minimal UX state
  useEffect(() => {
    const key = 'simbeat:minux:v1';
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const s = JSON.parse(raw) as any;
        if (typeof s.leftHz === 'number') { const v = clamp(s.leftHz, MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ); setLeftHz(v); setLeftText(String(v)); }
        if (typeof s.rightHz === 'number') { const v = clamp(s.rightHz, MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ); setRightHz(v); setRightText(String(v)); }
        if (typeof s.volume === 'number') setVolume(Math.min(1, Math.max(0, s.volume)));
        if (typeof s.pan === 'number') setPan(Math.min(1, Math.max(-1, s.pan)));
        if (typeof s.lockBeat === 'boolean') setLockBeat(s.lockBeat);
        if (typeof s.centerHz === 'number') setCenterHz(clamp(s.centerHz, MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ));
        if (typeof s.beatHz === 'number') setBeatHz(clamp(s.beatHz, MIN_BEAT_FREQUENCY_HZ, MAX_BEAT_FREQUENCY_HZ));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const key = 'simbeat:minux:v1';
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ leftHz, rightHz, volume, pan, lockBeat, centerHz, beatHz })
      );
    } catch {}
  }, [leftHz, rightHz, volume, pan, lockBeat, centerHz, beatHz]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        running ? stopPlayback() : startPlayback({ leftHz, rightHz });
        return;
      }
      const stepBase = e.shiftKey ? 1 : e.altKey ? 5 : 0.1;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onLeftChange(leftHz - stepBase);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onRightChange(rightHz + stepBase);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onLeftChange(leftHz + stepBase);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onRightChange(rightHz - stepBase);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [leftHz, rightHz, running]);

  // Commit helpers for text inputs
  const commitLeftFromText = () => {
    const v = parseFloat(leftText);
    if (Number.isFinite(v)) onLeftChange(v);
    else setLeftText(String(leftHz));
  };
  const commitRightFromText = () => {
    const v = parseFloat(rightText);
    if (Number.isFinite(v)) onRightChange(v);
    else setRightText(String(rightHz));
  };

  return (
    <div className="minux-root">
      <div className="topbar">
        <div className="topbar-inner">
          {/* Left: brand (vertically centered, aligned left) */}
          <div className="topbar-left">
            <div className="brand">Synaptune</div>
          </div>

          {/* Center: micro mixer (centered horizontally) */}
          <div className="topbar-center">
            <div className="micro-mixer">
              <label title="Volume">
                <span>Vol</span>
                <input
                  className="micro-slider"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => {
                    const v = Math.min(1, Math.max(0, parseFloat(e.target.value)));
                    setVolume(v);
                    try { audioEngine.setVolume(v); } catch {}
                  }}
                />
              </label>
              <label title="Pan">
                <span>Pan</span>
                <input
                  className="micro-slider"
                  type="range"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={pan}
                  onChange={(e) => {
                    const p = Math.min(1, Math.max(-1, parseFloat(e.target.value)));
                    setPan(p);
                    try { audioEngine.setPan(p); } catch {}
                  }}
                />
              </label>
            </div>
          </div>

          {/* Right: transport button */}
          <div className="topbar-right">
            <button
              className="playbtn"
              onClick={() => (running ? stopPlayback() : startPlayback({ leftHz, rightHz }))}
            >
              {running ? 'Stop' : 'Play'}
            </button>
          </div>
        </div>
      </div>

      {/* Centered visualizer overlay */}
      <Visualizer leftHz={leftHz} rightHz={rightHz} running={running} />

      <div className="minux-content">
        {/* Left */}
        <div className="ear-panel left-ear">
          <div className="ear-title"><span className="badge">L</span> Left Ear</div>
          <div className="ear-value">{leftHz.toFixed(2)} Hz</div>
          <input
            className="hz-input no-spin"
            type="text"
            inputMode="decimal"
            value={leftText}
            onChange={(e) => setLeftText(e.target.value)}
            onBlur={commitLeftFromText}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
            placeholder={`${MIN_FREQUENCY_HZ} - ${MAX_FREQUENCY_HZ}`}
          />
        </div>

        {/* Right */}
        <div className="ear-panel right-ear">
          <div className="ear-title">Right Ear <span className="badge">R</span></div>
          <div className="ear-value">{rightHz.toFixed(2)} Hz</div>
          <input
            className="hz-input no-spin"
            type="text"
            inputMode="decimal"
            value={rightText}
            onChange={(e) => setRightText(e.target.value)}
            onBlur={commitRightFromText}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
            placeholder={`${MIN_FREQUENCY_HZ} - ${MAX_FREQUENCY_HZ}`}
          />
        </div>
      </div>

      {/* Beat + Lock-beat controls */}
      <div className="minux-footer muted">
        <div className="beat-chip" aria-label="Beat frequency">
          Beat {Math.abs(leftHz - rightHz).toFixed(2)} Hz
        </div>
        <label className="lockbeat">
          <input type="checkbox" checked={lockBeat} onChange={(e) => setLockBeat(e.target.checked)} /> Lock Beat
        </label>
        {lockBeat && (
          <div className="lockbeat-row">
            <label>
              <span>Center</span>
              <input
                type="number"
                min={MIN_FREQUENCY_HZ}
                max={MAX_FREQUENCY_HZ}
                step={0.1}
                value={centerHz}
                onChange={(e) => setCenterHz(clamp(parseFloat(e.target.value), MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ))}
              />
            </label>
            <label>
              <span>Beat</span>
              <input
                type="number"
                min={MIN_BEAT_FREQUENCY_HZ}
                max={MAX_BEAT_FREQUENCY_HZ}
                step={0.1}
                value={beatHz}
                onChange={(e) => setBeatHz(clamp(parseFloat(e.target.value), MIN_BEAT_FREQUENCY_HZ, MAX_BEAT_FREQUENCY_HZ))}
              />
            </label>
          </div>
        )}
        <div>Range {MIN_FREQUENCY_HZ}-{MAX_FREQUENCY_HZ} Hz</div>
      </div>
    </div>
  );
}

