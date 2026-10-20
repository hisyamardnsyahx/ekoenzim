/**
 * Pure helpers for reminder scheduling.
 * Run: npx tsx tests/reminders.test.ts
 */
import assert from 'node:assert/strict';
import {
  allReminderIdentifiers,
  getReminderSpecs,
  reminderContent,
} from '../lib/reminder-schedule';

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`ok - ${name}`);
  } catch (e) {
    console.error(`FAIL - ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

test('j4 daily at 8:00', () => {
  const specs = getReminderSpecs('j4');
  assert.equal(specs.length, 1);
  assert.equal(specs[0].kind, 'daily');
  if (specs[0].kind === 'daily') {
    assert.equal(specs[0].hour, 8);
    assert.equal(specs[0].minute, 0);
    assert.equal(specs[0].id, 'reminder-j4');
  }
});

test('j3 weekly Sunday', () => {
  const specs = getReminderSpecs('j3');
  assert.equal(specs.length, 1);
  assert.equal(specs[0].kind, 'weekly');
  if (specs[0].kind === 'weekly') {
    assert.equal(specs[0].weekday, 1);
  }
});

test('j2 every 3 days interval', () => {
  const specs = getReminderSpecs('j2');
  assert.equal(specs.length, 1);
  assert.equal(specs[0].kind, 'interval');
  if (specs[0].kind === 'interval') {
    assert.equal(specs[0].seconds, 3 * 24 * 60 * 60);
  }
});

test('j1 yearly quarter months', () => {
  const specs = getReminderSpecs('j1');
  assert.equal(specs.length, 4);
  assert.deepEqual(
    specs.map((s) => (s.kind === 'yearly' ? s.month : -1)),
    [0, 3, 6, 9],
  );
  assert.ok(specs.every((s) => s.kind === 'yearly' && s.day === 1));
});

test('unknown jadwal empty', () => {
  assert.equal(getReminderSpecs('x').length, 0);
});

test('allReminderIdentifiers unique', () => {
  const ids = allReminderIdentifiers();
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes('reminder-j4'));
  assert.ok(ids.includes('reminder-j1-m0'));
});

test('reminderContent has titles', () => {
  assert.match(reminderContent('j4').title, /Penimbangan/i);
  assert.match(reminderContent('j2').body, /lindi/i);
});

console.log(`\n${passed} reminders tests passed`);
