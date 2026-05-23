import {
  emptyScheduleStore,
  addSchedule,
  removeSchedule,
  toggleSchedule,
  markRan,
  getDueChecks,
  parseCronNext,
  getSchedules,
} from './schedule';

describe('parseCronNext', () => {
  it('uses the minute field as interval', () => {
    const base = 1_000_000;
    const next = parseCronNext('* 5 * * *', base);
    expect(next).toBe(base + 5 * 60 * 1000);
  });

  it('defaults to 1 minute when minute field is wildcard', () => {
    const base = 1_000_000;
    const next = parseCronNext('* * * * *', base);
    expect(next).toBe(base + 60 * 1000);
  });

  it('throws on invalid cron', () => {
    expect(() => parseCronNext('bad')).toThrow();
  });
});

describe('schedule store', () => {
  it('starts empty', () => {
    expect(emptyScheduleStore().checks).toHaveLength(0);
  });

  it('adds a schedule', () => {
    const store = addSchedule(emptyScheduleStore(), 'nightly', '0 60 * * *', ['prod']);
    expect(store.checks).toHaveLength(1);
    expect(store.checks[0].label).toBe('nightly');
    expect(store.checks[0].enabled).toBe(true);
    expect(store.checks[0].tags).toEqual(['prod']);
  });

  it('removes a schedule', () => {
    let store = addSchedule(emptyScheduleStore(), 'ci', '* 10 * * *');
    const id = store.checks[0].id;
    store = removeSchedule(store, id);
    expect(store.checks).toHaveLength(0);
  });

  it('toggles enabled state', () => {
    let store = addSchedule(emptyScheduleStore(), 'ci', '* 10 * * *');
    const id = store.checks[0].id;
    store = toggleSchedule(store, id);
    expect(store.checks[0].enabled).toBe(false);
    store = toggleSchedule(store, id);
    expect(store.checks[0].enabled).toBe(true);
  });

  it('marks ran and updates nextRun', () => {
    let store = addSchedule(emptyScheduleStore(), 'ci', '* 30 * * *');
    const id = store.checks[0].id;
    const at = 2_000_000;
    store = markRan(store, id, at);
    expect(store.checks[0].lastRun).toBe(at);
    expect(store.checks[0].nextRun).toBe(at + 30 * 60 * 1000);
  });

  it('returns due checks', () => {
    let store = addSchedule(emptyScheduleStore(), 'a', '* 1 * * *');
    store = addSchedule(store, 'b', '* 1 * * *');
    const id = store.checks[0].id;
    store = markRan(store, id, Date.now() + 999_999_999);
    const due = getDueChecks(store, Date.now());
    expect(due).toHaveLength(1);
    expect(due[0].label).toBe('b');
  });

  it('skips disabled checks', () => {
    let store = addSchedule(emptyScheduleStore(), 'ci', '* 1 * * *');
    const id = store.checks[0].id;
    store = toggleSchedule(store, id);
    expect(getDueChecks(store, Date.now() + 999_999_999)).toHaveLength(0);
  });

  it('getSchedules returns a copy', () => {
    const store = addSchedule(emptyScheduleStore(), 'ci', '* 5 * * *');
    const list = getSchedules(store);
    expect(list).toHaveLength(1);
    list.pop();
    expect(getSchedules(store)).toHaveLength(1);
  });
});
