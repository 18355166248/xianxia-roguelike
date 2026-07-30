import {
    FrostTideRuntime,
    isOnFrostIce,
    resolveFrostImpactFrame,
    resolveFrostVelocity,
} from '../assets/scripts/systems/FrostTideRuntime';

const assert = {
    equal(actual: unknown, expected: unknown, message: string): void {
        if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
    },
    ok(value: unknown, message: string): void {
        if (!value) throw new Error(message);
    },
};

assert.equal(isOnFrostIce({ x: 0, y: -220 }), true, 'lower shelf should be icy');
assert.equal(isOnFrostIce({ x: 320, y: -220 }), false, 'outer water edge should not be icy');

const sliding = resolveFrostVelocity({ x: 200, y: 0 }, { x: 0, y: 0 }, 235, 0.1, true);
assert.ok(sliding.x > 180, 'ice should preserve momentum after input release');
const grounded = resolveFrostVelocity({ x: 200, y: 0 }, { x: 0, y: 0 }, 235, 0.1, false);
assert.equal(grounded.x, 0, 'stone ground should stop with no input');

assert.equal(resolveFrostImpactFrame(0), 0, 'impact should start on anticipation frame');
assert.equal(resolveFrostImpactFrame(0.5), 2, 'impact midpoint should show peak burst');
assert.equal(resolveFrostImpactFrame(1), 3, 'impact should end on frost residue frame');

const tide = new FrostTideRuntime();
tide.tick(4.9);
assert.equal(tide.snapshot().phase, 'warning', 'tide should warn before surging');
tide.tick(1);
assert.equal(tide.snapshot().phase, 'surge', 'tide should enter surge after warning');
const firstDirection = tide.snapshot().direction;
tide.tick(1.4);
assert.equal(tide.snapshot().direction, firstDirection * -1, 'each cycle should reverse tide direction');

const summonedTide = new FrostTideRuntime();
summonedTide.tick(1.2);
assert.equal(summonedTide.triggerWarning().phase, 'warning', 'boss phase change should summon tide warning');
summonedTide.tick(1.05);
assert.equal(summonedTide.snapshot().phase, 'surge', 'summoned warning should keep the normal reaction window');

console.log('FrostTideRuntime tests passed');
