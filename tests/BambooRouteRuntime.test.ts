import {
    bambooObstacleSpecs,
    bambooSpawnEdge,
    describeBambooRouteGeometry,
} from '../assets/scripts/systems/BambooRouteRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

assert(bambooObstacleSpecs().length === 2, 'default bamboo stage should preserve its two original barriers');
assert(bambooObstacleSpecs('open-lane').length === 0, 'burn route should open the full lane');

const shadowObstacles = bambooObstacleSpecs('shadow-corridor');
assert(shadowObstacles.length === 3, 'shadow route should rebuild a three-part slalom corridor');
assert(
    shadowObstacles[0].x < 0 && shadowObstacles[1].x > 0 && shadowObstacles[2].x < 0,
    'shadow corridor should alternate left, right, then left',
);

assert(bambooSpawnEdge('open-lane', 4) === 'top', 'open lane foes should commit to a frontal advance');
assert(bambooSpawnEdge('shadow-corridor', 0) === 'left', 'shadow ambush should begin from the left flank');
assert(bambooSpawnEdge('shadow-corridor', 1) === 'right', 'shadow ambush should alternate to the right flank');
assert(describeBambooRouteGeometry('open-lane') === '开阔正面', 'open lane needs readable terrain copy');
assert(describeBambooRouteGeometry('shadow-corridor') === '竹影夹道', 'shadow corridor needs readable terrain copy');

console.log('BambooRouteRuntime tests passed');
