import * as blessed from 'blessed';
import { HistoryEntry } from '../history/history';
import { ReplayFrame, replayHistory, ReplayOptions } from '../history/replay';
import { colorizeStatus } from './layout';
import { formatRow } from './formatRow';

export interface ReplayPanelOptions {
  screen: blessed.Widgets.Screen;
  entries: HistoryEntry[];
  replayOptions?: ReplayOptions;
}

export function createReplayPanel(opts: ReplayPanelOptions) {
  const { screen, entries, replayOptions = { speedMultiplier: 0 } } = opts;

  const box = blessed.box({
    top: 'center',
    left: 'center',
    width: '80%',
    height: '80%',
    border: { type: 'line' },
    label: ' Replay ',
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    style: { border: { fg: 'cyan' } },
  });

  const progress = blessed.text({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    style: { fg: 'yellow' },
  });

  box.append(progress);
  screen.append(box);

  let lines: string[] = [];

  function renderFrame(frame: ReplayFrame): void {
    const { entry, index, total } = frame;
    const row = formatRow(
      colorizeStatus(entry.status),
      entry.repo ?? '',
      entry.branch ?? '',
      new Date(entry.timestamp).toLocaleTimeString()
    );
    lines.push(row);
    box.setContent(lines.join('\n'));
    progress.setContent(
      ` Replaying ${index + 1} / ${total} — press q to close`
    );
    screen.render();
  }

  function start(): Promise<void> {
    lines = [];
    return replayHistory(entries, renderFrame, replayOptions);
  }

  box.key(['q', 'escape'], () => {
    box.destroy();
    screen.render();
  });

  box.focus();

  return { box, start };
}
