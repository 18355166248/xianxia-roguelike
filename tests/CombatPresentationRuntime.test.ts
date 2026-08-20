import { CombatPresentationRuntime } from '../assets/scripts/systems/CombatPresentationRuntime';

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

const runtime = new CombatPresentationRuntime();
const admissions = Array.from({ length: 40 }, () => runtime.request('ambient')).filter(Boolean);
assert(admissions.length < 40, 'ambient effects should be shed before the hard node limit');
const critical = runtime.request('critical');
assert(critical, 'critical feedback must keep reserved room when ambient effects are saturated');
runtime.release(critical);
admissions.forEach((admission) => runtime.release(admission));
assert(runtime.snapshot().active === 0, 'released effects must leave no active budget tickets');

for (let index = 0; index < 50; index += 1) runtime.updateFrameTime(1 / 30);
const degraded = runtime.snapshot();
assert(degraded.qualityScale < 0.8, 'sustained slow frames should reduce presentation density');
const reduced = runtime.request('combat', true);
assert(reduced && reduced.detailScale < 0.6, 'reduced motion should also lower per-effect drawing detail');

console.log('CombatPresentationRuntime tests passed');
