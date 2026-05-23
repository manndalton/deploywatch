import { createReplayPanel } from './replayPanel';
import { HistoryEntry } from '../history/history';

function makeEntry(id: string, timestamp: string): HistoryEntry {
  return {
    id,
    provider: 'github',
    repo: 'org/repo',
    branch: 'main',
    status: 'success',
    timestamp,
    duration: 30,
    tags: [],
  } as unknown as HistoryEntry;
}

function makeScreen() {
  return {
    append: jest.fn(),
    render: jest.fn(),
    key: jest.fn(),
  } as any;
}

describe('createReplayPanel', () => {
  it('creates a panel with start function', () => {
    const screen = makeScreen();
    const panel = createReplayPanel({
      screen,
      entries: [],
      replayOptions: { speedMultiplier: 0 },
    });
    expect(typeof panel.start).toBe('function');
    expect(panel.box).toBeDefined();
  });

  it('appends box to screen', () => {
    const screen = makeScreen();
    createReplayPanel({ screen, entries: [], replayOptions: { speedMultiplier: 0 } });
    expect(screen.append).toHaveBeenCalled();
  });

  it('start resolves for empty entries', async () => {
    const screen = makeScreen();
    const panel = createReplayPanel({
      screen,
      entries: [],
      replayOptions: { speedMultiplier: 0 },
    });
    await expect(panel.start()).resolves.toBeUndefined();
  });

  it('start calls screen.render per frame', async () => {
    const screen = makeScreen();
    const entries = [
      makeEntry('a', '2024-01-01T00:00:00Z'),
      makeEntry('b', '2024-01-02T00:00:00Z'),
    ];
    const panel = createReplayPanel({
      screen,
      entries,
      replayOptions: { speedMultiplier: 0 },
    });
    await panel.start();
    expect(screen.render).toHaveBeenCalledTimes(2);
  });
});
