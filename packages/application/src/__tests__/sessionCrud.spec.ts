import { describe, it, expect } from 'vitest';
import { makeCreateSession } from '../use-cases/CreateSession';
import { makeListSessions } from '../use-cases/ListSessions';
import { makeDeleteSession } from '../use-cases/DeleteSession';
import { makeClearSessions } from '../use-cases/ClearSessions';
import { MockSessionRepository } from './mocks';

describe('Session CRUD use cases', () => {
  it('lists sessions after creation', async () => {
    const repo = new MockSessionRepository();
    const createSession = makeCreateSession({ sessionRepo: repo });
    const listSessions = makeListSessions({ sessionRepo: repo });

    await createSession({ id: 'a', leftHz: 220, rightHz: 225 });
    await createSession({ id: 'b', leftHz: 300, rightHz: 306 });
    const list = await listSessions();

    expect(list).toHaveLength(2);
    expect(list[0].id).toBe('a');
    expect(list[1].id).toBe('b');
  });

  it('deletes a session and clears all', async () => {
    const repo = new MockSessionRepository();
    const createSession = makeCreateSession({ sessionRepo: repo });
    const listSessions = makeListSessions({ sessionRepo: repo });
    const deleteSession = makeDeleteSession({ sessionRepo: repo });
    const clearSessions = makeClearSessions({ sessionRepo: repo });

    await createSession({ id: 'x', leftHz: 220, rightHz: 226 });
    await createSession({ id: 'y', leftHz: 180, rightHz: 182 });

    await deleteSession('x');
    let list = await listSessions();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('y');

    await clearSessions();
    list = await listSessions();
    expect(list).toHaveLength(0);
  });
});
