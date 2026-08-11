import { HitStopRuntime, hitStopSpecFor } from '../assets/scripts/systems/HitStopRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

function almost(actual: number, expected: number, tolerance = 1e-6): boolean {
    return Math.abs(actual - expected) <= tolerance;
}

const hitStop = new HitStopRuntime();
assert(hitStop.consume(0.016) === 0.016, 'idle hit stop must pass real time through untouched');
assert(!hitStop.active, 'idle hit stop should not report an active impact');

hitStop.trigger('light');
assert(hitStop.frozen, 'a triggered impact should freeze combat time');
assert(hitStop.consume(0.016) === 0, 'frozen frames must not advance combat time');
hitStop.consume(0.016);
assert(almost(hitStop.consume(0.016), 0.003), 'freeze overflow should be returned inside the same frame');
assert(!hitStop.active, 'light impacts end as soon as the freeze budget is spent');

hitStop.reset();
hitStop.trigger('heavy');
const heavy = hitStopSpecFor('heavy');
assert(hitStop.consume(heavy.freeze) === 0, 'the freeze window must swallow exactly its own budget');
const slowed = hitStop.consume(0.02);
assert(almost(slowed, 0.02 * heavy.slowScale), 'slow motion should scale combat time down');
assert(slowed > 0, 'slow motion must keep combat running rather than stalling it');

hitStop.reset();
hitStop.trigger('finisher');
hitStop.trigger('light');
assert(
    hitStop.frozen && hitStop.consume(hitStopSpecFor('light').freeze) === 0,
    'a weaker impact must not cut a stronger stop short',
);

hitStop.reset();
hitStop.trigger('light');
hitStop.trigger('breakthrough');
assert(
    hitStop.consume(hitStopSpecFor('light').freeze) === 0,
    'a stronger impact should override a weaker one already playing',
);

hitStop.reset();
hitStop.trigger('finisher', true);
const softened = hitStopSpecFor('finisher');
assert(
    hitStop.consume(softened.freeze * 0.5) === 0 && !hitStop.active,
    'reduced motion keeps a readable freeze but drops the slow motion tail',
);

hitStop.reset();
hitStop.trigger('heavy');
let combatTime = 0;
for (let index = 0; index < 240; index += 1) combatTime += hitStop.consume(1 / 60);
assert(!hitStop.active, 'every impact must expire on its own');
assert(combatTime > 0 && combatTime < 4, 'hit stop may only ever remove combat time, never add it');

console.log('HitStopRuntime tests passed');
