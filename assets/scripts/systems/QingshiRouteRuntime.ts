import type { SpiritVeinKind } from './SpiritVeinRuntime';

export type QingshiRouteGeometry = 'sword-stele-array' | 'spring-detour';

export interface QingshiRouteMarkerSpec {
    id: string;
    x: number;
    y: number;
    radius: number;
}

export interface QingshiRouteSpawn {
    xRatio: number;
    y: number;
}

const SWORD_STELES: ReadonlyArray<QingshiRouteMarkerSpec> = [
    { id: 'lower-stele', x: -112, y: -68, radius: 74 },
    { id: 'middle-stele', x: 108, y: 116, radius: 76 },
    { id: 'upper-stele', x: -76, y: 296, radius: 78 },
];

const SPRING_POSITIONS: ReadonlyArray<Readonly<{ x: number; y: number }>> = [
    { x: -138, y: -132 },
    { x: 142, y: 96 },
    { x: -112, y: 274 },
];

export function describeQingshiRouteGeometry(route: QingshiRouteGeometry | undefined): string {
    if (route === 'sword-stele-array') return '剑碑阵列';
    if (route === 'spring-detour') return '灵泉侧路';
    return '灵脉争夺';
}

export function qingshiRouteMarkers(route: QingshiRouteGeometry | undefined): QingshiRouteMarkerSpec[] {
    if (route !== 'sword-stele-array') return [];
    return SWORD_STELES.map((marker) => ({ ...marker }));
}

export function qingshiRouteSpawn(
    route: QingshiRouteGeometry | undefined,
    spawnIndex: number,
): QingshiRouteSpawn | undefined {
    if (route !== 'sword-stele-array') return undefined;
    const xRatios = [-0.46, 0, 0.46];
    return {
        xRatio: xRatios[spawnIndex % xRatios.length],
        y: 468,
    };
}

export function qingshiSpiritVeinKind(
    route: QingshiRouteGeometry | undefined,
    fallback: SpiritVeinKind,
): SpiritVeinKind {
    return route === 'spring-detour' ? 'vitality' : fallback;
}

export function qingshiSpiritVeinPosition(
    route: QingshiRouteGeometry | undefined,
    waveIndex: number,
): Readonly<{ x: number; y: number }> | undefined {
    if (route !== 'spring-detour') return undefined;
    return SPRING_POSITIONS[waveIndex % SPRING_POSITIONS.length];
}

export function qingshiSwordSteleDamageMultiplier(
    position: Readonly<{ x: number; y: number }>,
    route: QingshiRouteGeometry | undefined,
): number {
    if (route !== 'sword-stele-array') return 1;
    const insideStele = SWORD_STELES.some((marker) => (
        Math.hypot(position.x - marker.x, position.y - marker.y) <= marker.radius
    ));
    return insideStele ? 1.35 : 1;
}
