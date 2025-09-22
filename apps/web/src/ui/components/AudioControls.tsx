import React from 'react';

export interface AudioControlsProps {
  volume: number; // 0..1
  pan: number;    // -1..1
  onVolume(v: number): void;
  onPan(v: number): void;
}

export function AudioControls({ volume, pan, onVolume, onPan }: AudioControlsProps) {
  return (
    <div className="panel col">
      <label>
        <div>Master Volume: {(volume * 100).toFixed(0)}%</div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolume(parseFloat(e.target.value))}
        />
      </label>

      <label>
        <div>
          Stereo Pan: {pan < 0 ? `${Math.round(Math.abs(pan) * 100)}% L` : pan > 0 ? `${Math.round(pan * 100)}% R` : 'Center'}
        </div>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.01}
          value={pan}
          onChange={(e) => onPan(parseFloat(e.target.value))}
        />
      </label>
    </div>
  );
}
