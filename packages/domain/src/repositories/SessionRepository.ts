import { BinauralBeat } from '../entities/BinauralBeat';

export interface Session {
  id: string;
  label?: string;
  beat: BinauralBeat;
}

export interface SessionRepository {
  save(session: Session): Promise<void>;
  findById(id: string): Promise<Session | null>;
  list(): Promise<Session[]>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}
