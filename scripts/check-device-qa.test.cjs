const assert = require('node:assert/strict');
const { REQUIRED_STEPS, summarize, validateRecord } = require('./check-device-qa.cjs');

function makeRecord(platform, status = 'pass') {
  return {
    schemaVersion: 1,
    tester: 'tester',
    capturedAt: '2026-08-14T00:00:00.000Z',
    device: {
      platform,
      model: 'physical-device',
      osVersion: '1',
      browser: platform === 'ios' ? 'Safari' : 'Chrome',
      browserVersion: '1',
      screen: '390x844',
      highRefreshRate: false,
    },
    results: Object.fromEntries(REQUIRED_STEPS.map((step) => [step, { status, notes: '' }])),
  };
}

const ios = validateRecord(makeRecord('ios'), 'ios.json');
const android = validateRecord(makeRecord('android'), 'android.json');
assert.equal(summarize([
  { record: ios, source: 'ios.json' },
  { record: android, source: 'android.json' },
]).passed, true);

const failedAndroid = makeRecord('android');
failedAndroid.results['pause-freeze'].status = 'fail';
const failedSummary = summarize([
  { record: ios, source: 'ios.json' },
  { record: failedAndroid, source: 'android.json' },
]);
assert.equal(failedSummary.passed, false);
assert.deepEqual(failedSummary.failures, ['android.json: pause-freeze=fail']);
assert.deepEqual(summarize([{ record: ios, source: 'ios.json' }]).missingPlatforms, ['android']);

assert.throws(() => validateRecord({ ...makeRecord('ios'), tester: '' }, 'bad.json'), /tester/);
console.log('Device QA evidence tests passed');
