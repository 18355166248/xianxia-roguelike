import {
    BalanceTelemetryRuntime,
    formatBalanceReport,
} from '../assets/scripts/systems/BalanceTelemetryRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

const telemetry = new BalanceTelemetryRuntime();
for (let index = 0; index < 10; index += 1) {
    telemetry.record({
        stage: 'qingshi-road',
        victory: index < 6,
        durationSeconds: 180 + index * 4,
        damageTaken: 30 + index,
        maxHp: 100,
        routeChoiceId: index % 2 === 0 ? 'risk' : 'stable',
        buildPath: index % 3 === 0 ? 'edge' : index % 3 === 1 ? 'mystic' : 'vitality',
        buildTier: 2,
    });
}
const healthy = telemetry.reportFor('qingshi-road');
assert(healthy.sampleCount === 10 && healthy.victories === 6, 'report should count samples and victories');
assert(healthy.readiness === 'healthy', '60% wins and 3–5 minute pace should be healthy');
assert(healthy.routeCounts.risk === 5 && healthy.routeCounts.stable === 5, 'route split should be observable');
assert(formatBalanceReport(healthy).includes('胜率 60%'), 'formatted report should expose win rate');

const restored = new BalanceTelemetryRuntime();
assert(restored.restore(telemetry.serialize()), 'valid telemetry should restore');
assert(restored.reportFor('qingshi-road').sampleCount === 10, 'restored telemetry should preserve samples');
assert(!restored.restore('[{"stage":"unknown"}]'), 'invalid telemetry should be rejected');
assert(restored.reportFor('qingshi-road').sampleCount === 10, 'invalid restore should preserve existing samples');

const hard = new BalanceTelemetryRuntime();
for (let index = 0; index < 10; index += 1) {
    hard.record({ stage: 'frozen-ruins', victory: index < 2, durationSeconds: 260, damageTaken: 95, maxHp: 100, buildTier: 1 });
}
assert(hard.reportFor('frozen-ruins').readiness === 'too-hard', 'sub-30% win rate should be flagged');

console.log('BalanceTelemetryRuntime tests passed');
