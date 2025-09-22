import React from 'react';

export interface PresetItem {
  name: string;
  leftHz: number;
  rightHz: number;
}

export interface PresetsPanelProps {
  presets: PresetItem[];
  selectedName: string;
  onSelect(name: string): void;
  onCreateFromPreset(): void;
}

export function PresetsPanel({ presets, selectedName, onSelect, onCreateFromPreset }: PresetsPanelProps) {
  return (
    <div className="panel row">
      <label style={{ flex: 1 }}>
        <div>Preset</div>
        <select value={selectedName} onChange={(e) => onSelect(e.target.value)}>
          {presets.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name} — {p.leftHz} / {p.rightHz} Hz
            </option>
          ))}
        </select>
      </label>
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <button type="button" onClick={onCreateFromPreset}>
          Create From Preset
        </button>
      </div>
    </div>
  );
}
