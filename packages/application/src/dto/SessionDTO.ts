export interface CreateSessionRequest {
  id: string;
  label?: string;
  leftHz: number;
  rightHz: number;
}

export interface SessionResponse {
  id: string;
  label?: string;
  leftHz: number;
  rightHz: number;
  beatHz: number;
  createdAt: string;
}
