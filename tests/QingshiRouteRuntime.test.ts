import {
    describeQingshiRouteGeometry,
    qingshiRouteMarkers,
    qingshiRouteSpawn,
    qingshiSpiritVeinKind,
    qingshiSpiritVeinPosition,
    qingshiSwordSteleDamageMultiplier,
} from '../assets/scripts/systems/QingshiRouteRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

assert(describeQingshiRouteGeometry('sword-stele-array') === '剑碑阵列', 'sword route needs readable terrain copy');
assert(describeQingshiRouteGeometry('spring-detour') === '灵泉侧路', 'spring route needs readable terrain copy');

const steles = qingshiRouteMarkers('sword-stele-array');
assert(steles.length === 3, 'sword route should create a three-part stele array');
assert(qingshiRouteMarkers('spring-detour').length === 0, 'spring route should not leave sword steles behind');
assert(qingshiRouteSpawn('sword-stele-array', 0)?.xRatio === -0.46, 'first foe should enter the left stele lane');
assert(qingshiRouteSpawn('sword-stele-array', 1)?.xRatio === 0, 'second foe should enter the center stele lane');
assert(qingshiRouteSpawn('sword-stele-array', 2)?.xRatio === 0.46, 'third foe should enter the right stele lane');

assert(qingshiSpiritVeinKind('spring-detour', 'sword') === 'vitality', 'spring route should turn later veins into healing springs');
assert(qingshiSpiritVeinPosition('spring-detour', 1)?.x === 142, 'spring route should alternate the contested side');
assert(qingshiSpiritVeinPosition(undefined, 0) === undefined, 'default route should preserve wave positions');

const lowerStele = steles[0];
assert(
    qingshiSwordSteleDamageMultiplier(lowerStele, 'sword-stele-array') === 1.35,
    'enemy inside a stele should take amplified sword damage',
);
assert(
    qingshiSwordSteleDamageMultiplier({ x: 300, y: -300 }, 'sword-stele-array') === 1,
    'enemy outside every stele should take normal damage',
);
assert(
    qingshiSwordSteleDamageMultiplier(lowerStele, 'spring-detour') === 1,
    'spring route should not inherit stele amplification',
);

console.log('QingshiRouteRuntime tests passed');
