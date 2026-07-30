import {
    describeFrostRouteGeometry,
    frostConvergenceSpawn,
    frostRouteMarker,
    frostTideEnemyDamage,
    isInFrostSanctuary,
} from '../assets/scripts/systems/FrostRouteRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

assert(describeFrostRouteGeometry('tide-convergence') === '潮线聚敌', 'borrowed tide needs readable terrain copy');
assert(describeFrostRouteGeometry('sealed-sanctuary') === '封脉结界', 'sealed route needs readable terrain copy');

const convergence = frostRouteMarker('tide-convergence');
assert(convergence.y > 0, 'tide marker should sit on the upper ice shelf');
assert(frostConvergenceSpawn('tide-convergence', 0)?.xRatio === -0.62, 'first tide foe should enter from the left');
assert(frostConvergenceSpawn('tide-convergence', 1)?.xRatio === 0, 'second tide foe should enter through the center');
assert(frostConvergenceSpawn('tide-convergence', 2)?.xRatio === 0.62, 'third tide foe should enter from the right');
assert(frostTideEnemyDamage('tide-convergence') === 38, 'borrowed tide should deal stronger environmental damage');

const sanctuary = frostRouteMarker('sealed-sanctuary');
assert(isInFrostSanctuary({ x: sanctuary.x, y: sanctuary.y }, 'sealed-sanctuary'), 'sanctuary center should be safe');
assert(!isInFrostSanctuary({ x: 180, y: sanctuary.y }, 'sealed-sanctuary'), 'outside the sanctuary should remain dangerous');
assert(!isInFrostSanctuary({ x: sanctuary.x, y: sanctuary.y }, 'tide-convergence'), 'borrowed tide should not grant shelter');

console.log('FrostRouteRuntime tests passed');
