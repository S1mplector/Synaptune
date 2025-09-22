import React from 'react';

export interface ToneControlsProps {
  lockBeat: boolean;
  leftHz: number;
  rightHz: number;
  centerHz: number;
  beatHz: number;
  minFreq: number;
  maxFreq: number;
  minBeat: number;
  maxBeat: number;
  errors?: { left?: string; right?: string; center?: string; beat?: string };
  onToggleLockBeat(next: boolean): void;
  onLeftChange(v: number): void;
  onRightChange(v: number): void;
  onCenterChange(v: number): void;
  onBeatChange(v: number): void;
  running: boolean;
  disabled?: boolean;
}

export function ToneControls(props: ToneControlsProps) {
  const {
    lockBeat,
    leftHz,
    rightHz,
    centerHz,
    beatHz,
    minFreq,
    maxFreq,
    minBeat,
    maxBeat,
    errors,
    onToggleLockBeat,
    onLeftChange,
    onRightChange,
    onCenterChange,
    onBeatChange,
    disabled,
  } = props;

  return (
    <div className="panel col">
      <label>
        <div>Left Frequency (Hz)</div>
        <input
          type="number"
          min={minFreq}
          max={maxFreq}
          step={0.1}
          value={leftHz}
          onChange={(e) => onLeftChange(parseFloat(e.target.value))}
          disabled={disabled || lockBeat}
        />
        {errors?.left && <div className="error-text">{errors.left}</div>}
      </label>

      <label>
        <div>Right Frequency (Hz)</div>
        <input
          type="number"
          min={minFreq}
          max={maxFreq}
          step={0.1}
          value={rightHz}
          onChange={(e) => onRightChange(parseFloat(e.target.value))}
          disabled={disabled || lockBeat}
        />
        {errors?.right && <div className="error-text">{errors.right}</div>}
      </label>

      <label>
        <div>
          <input
            type="checkbox"
            checked={lockBeat}
            onChange={(e) => onToggleLockBeat(e.target.checked)}
            disabled={disabled}
          />
          {" "}Lock Beat (control via Center & Beat)
        </div>
      </label>

      {lockBeat && (
        <div className="col" style={{ gap: '0.75rem' }}>
          <label>
            <div>Center Frequency (Hz)</div>
            <input
              type="number"
              min={minFreq}
              max={maxFreq}
              step={0.1}
              value={centerHz}
              onChange={(e) => onCenterChange(parseFloat(e.target.value))}
              disabled={disabled}
            />
            {errors?.center && <div className="error-text">{errors.center}</div>}
          </label>
          <label>
            <div>Beat Frequency (Hz)</div>
            <input
              type="number"
              min={minBeat}
              max={maxBeat}
              step={0.1}
              value={beatHz}
              onChange={(e) => onBeatChange(parseFloat(e.target.value))}
              disabled={disabled}
            />
            {errors?.beat && <div className="error-text">{errors.beat}</div>}
          </label>
        </div>
      )}
    </div>
  );
}
