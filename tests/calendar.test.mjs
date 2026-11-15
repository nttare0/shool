import test from 'node:test';
import assert from 'node:assert/strict';
import { localDateKey, occursOn } from '../src/lib/calendar.ts';

const entry = { id: '1', title: 'Class', date: '2026-03-02', startTime: '09:00', endTime: '10:00', repeat: 'weekly', until: '2026-03-16' };

test('weekly classes respect start, weekday and inclusive end across daylight saving', () => {
  assert.equal(occursOn(entry, '2026-02-23'), false);
  assert.equal(occursOn(entry, '2026-03-02'), true);
  assert.equal(occursOn(entry, '2026-03-09'), true);
  assert.equal(occursOn(entry, '2026-03-10'), false);
  assert.equal(occursOn(entry, '2026-03-16'), true);
  assert.equal(occursOn(entry, '2026-03-23'), false);
});

test('one-off classes occur only on their chosen date', () => {
  const once = { ...entry, repeat: 'once', until: null };
  assert.equal(occursOn(once, '2026-03-02'), true);
  assert.equal(occursOn(once, '2026-03-09'), false);
});

test('date keys use the device local date', () => {
  assert.equal(localDateKey(new Date(2026, 0, 9, 12)), '2026-01-09');
});
