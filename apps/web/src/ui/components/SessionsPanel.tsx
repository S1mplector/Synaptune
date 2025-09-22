import React from 'react';

export interface SessionRow {
  id: string;
  label?: string;
  leftHz: number;
  rightHz: number;
  beatHz: number;
  createdAt: string;
}

export interface SessionsPanelProps {
  sessions: SessionRow[];
  onDelete(id: string): Promise<void> | void;
  onClear(): Promise<void> | void;
}

export function SessionsPanel({ sessions, onDelete, onClear }: SessionsPanelProps) {
  if (!sessions.length) return null;
  return (
    <div className="panel col">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Sessions</h2>
        <button type="button" onClick={() => onClear()}>Clear All</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Label</th>
              <th>Left</th>
              <th>Right</th>
              <th>Beat</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{s.label || '—'}</td>
                <td>{s.leftHz} Hz</td>
                <td>{s.rightHz} Hz</td>
                <td>{s.beatHz} Hz</td>
                <td>{new Date(s.createdAt).toLocaleString()}</td>
                <td>
                  <button type="button" onClick={() => onDelete(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
