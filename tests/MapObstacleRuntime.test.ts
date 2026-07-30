import { MapObstacleRuntime } from '../assets/scripts/systems/MapObstacleRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

const runtime = new MapObstacleRuntime();
runtime.begin([
    { id: 'left', x: -80, y: 20, width: 120, height: 44, hp: 100 },
    { id: 'right', x: 90, y: 120, width: 110, height: 40, hp: 80 },
]);

assert(runtime.activeCount() === 2, 'begin should create two active obstacles');
assert(runtime.findSegmentHit({ x: -80, y: -80 }, { x: -80, y: 100 })?.id === 'left', 'segment should hit first barrier');
assert(runtime.findSegmentHit({ x: 220, y: -80 }, { x: 220, y: 200 }) === undefined, 'clear route should not hit');

const blocked = runtime.resolveCircle({ x: -80, y: 20 }, 20);
assert(blocked.y === -22 || blocked.y === 62 || blocked.x === -160 || blocked.x === 0, 'circle should be pushed outside barrier');

const damaged = runtime.damage('left', 35);
assert(damaged.hit && !damaged.destroyed && damaged.remainingHp === 65, 'partial damage should preserve obstacle');
const destroyed = runtime.damage('left', 70);
assert(destroyed.destroyed && runtime.activeCount() === 1, 'lethal damage should destroy obstacle');
assert(runtime.findSegmentHit({ x: -80, y: -80 }, { x: -80, y: 100 }) === undefined, 'destroyed obstacle should not block');

runtime.reset();
assert(runtime.activeCount() === 0, 'reset should clear obstacle state');

console.log('MapObstacleRuntime tests passed');
