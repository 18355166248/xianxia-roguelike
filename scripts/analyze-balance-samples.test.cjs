const { mkdtempSync, rmSync, writeFileSync } = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');
const {
  analyzeSamples,
  deduplicateSamples,
  formatMarkdown,
  main,
  samplesFromPayload,
} = require('./analyze-balance-samples.cjs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sample(stage, index) {
  return {
    sampleId: `${stage}-${index}`,
    stage,
    victory: index < 6,
    durationSeconds: 180 + index * 5,
    damageTaken: 30 + index,
    maxHp: 100,
    routeChoiceId: index % 2 === 0 ? 'risk' : 'stable',
    buildPath: ['edge', 'mystic', 'vitality'][index % 3],
    buildTier: 2,
  };
}

const samples = ['qingshi-road', 'bamboo-ambush', 'frozen-ruins']
  .flatMap((stage) => Array.from({ length: 10 }, (_, index) => sample(stage, index)));
const reports = analyzeSamples(samples);
assert(reports.every((report) => report.verdict === 'healthy'), 'complete healthy samples should pass every stage');
assert(reports.every((report) => Object.keys(report.buildCounts).length === 3), 'victorious build coverage should be counted');
assert(formatMarkdown(reports, ['a.json', 'b.json'], samples.length).includes('有效对局：30'), 'report should expose merged run count');

const coverageSamples = Array.from({ length: 10 }, (_, index) => ({
  ...sample('qingshi-road', index),
  buildPath: index < 6 ? 'edge' : 'vitality',
}));
assert(analyzeSamples(coverageSamples)[0].verdict === 'coverage-gap', 'missing victorious builds should fail coverage');
assert(samplesFromPayload({ schemaVersion: 1, samples: samples.slice(0, 1) }, 'bundle.json').length === 1, 'versioned bundle payload should be supported');
const deduplicated = deduplicateSamples([...samples, samples[0], samples[1]]);
assert(deduplicated.samples.length === 30 && deduplicated.duplicateCount === 2, 'repeated exports should not inflate run counts');

let invalidRejected = false;
try {
  samplesFromPayload([{ ...samples[0], stage: 'unknown' }], 'bad.json');
} catch {
  invalidRejected = true;
}
assert(invalidRejected, 'invalid stage should be rejected');

const fixtureDir = mkdtempSync(join(tmpdir(), 'xianxia-balance-'));
const fixturePath = join(fixtureDir, 'healthy.json');
writeFileSync(fixturePath, JSON.stringify({ schemaVersion: 1, samples }));
const originalLog = console.log;
let cliOutput = '';
try {
  console.log = (value) => { cliOutput += String(value); };
  assert(main(['--strict', fixturePath]) === 0, 'strict CLI should accept a complete healthy bundle');
} finally {
  console.log = originalLog;
  rmSync(fixtureDir, { recursive: true, force: true });
}
assert(cliOutput.includes('按唯一标识去重：0'), 'CLI report should expose its deduplication result');

console.log('Balance sample analyzer tests passed');
