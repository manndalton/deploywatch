import {
  classifyChange,
  formatNotification,
  ConsoleNotifier,
  StatusChange,
} from './notifier';

function makeChange(overrides: Partial<StatusChange> = {}): StatusChange {
  return {
    id: 'deploy-1',
    name: 'my-app',
    provider: 'github',
    previous: 'pending',
    current: 'success',
    timestamp: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('classifyChange', () => {
  it('returns error for failure state', () => {
    expect(classifyChange(makeChange({ current: 'failure' }))).toBe('error');
  });

  it('returns error for cancelled state', () => {
    expect(classifyChange(makeChange({ current: 'cancelled' }))).toBe('error');
  });

  it('returns info for success state', () => {
    expect(classifyChange(makeChange({ current: 'success' }))).toBe('info');
  });

  it('returns warning for in-progress state', () => {
    expect(classifyChange(makeChange({ current: 'in_progress' }))).toBe('warning');
  });
});

describe('formatNotification', () => {
  it('includes provider, name, and transition', () => {
    const msg = formatNotification(makeChange());
    expect(msg).toContain('GITHUB');
    expect(msg).toContain('my-app');
    expect(msg).toContain('pending → success');
  });

  it('uses ✗ icon for errors', () => {
    const msg = formatNotification(makeChange({ current: 'failure' }));
    expect(msg.startsWith('✗')).toBe(true);
  });

  it('uses ✓ icon for success', () => {
    const msg = formatNotification(makeChange({ current: 'success' }));
    expect(msg.startsWith('✓')).toBe(true);
  });
});

describe('ConsoleNotifier.detectChanges', () => {
  it('returns null on first observation', () => {
    const notifier = new ConsoleNotifier();
    expect(notifier.detectChanges('1', 'app', 'vercel', 'pending')).toBeNull();
  });

  it('returns null when status unchanged', () => {
    const notifier = new ConsoleNotifier();
    notifier.detectChanges('1', 'app', 'vercel', 'pending');
    expect(notifier.detectChanges('1', 'app', 'vercel', 'pending')).toBeNull();
  });

  it('returns a StatusChange when status transitions', () => {
    const notifier = new ConsoleNotifier();
    notifier.detectChanges('1', 'app', 'vercel', 'pending');
    const change = notifier.detectChanges('1', 'app', 'vercel', 'success');
    expect(change).not.toBeNull();
    expect(change?.previous).toBe('pending');
    expect(change?.current).toBe('success');
  });
});
