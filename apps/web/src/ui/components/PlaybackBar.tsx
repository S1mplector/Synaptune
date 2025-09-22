import React from 'react';

export interface PlaybackBarProps {
  running: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function PlaybackBar({ running, onStart, onStop }: PlaybackBarProps) {
  return (
    <div className="panel row">
      <button type="button" onClick={onStart}>
        Start Playback
      </button>
      <button type="button" onClick={onStop} disabled={!running}>
        Stop Playback
      </button>
      <span className="muted">Status: {running ? 'Running' : 'Stopped'}</span>
    </div>
  );
}
