import type { MapObstacleSpec } from './MapObstacleRuntime';

export type BambooRouteGeometry = 'open-lane' | 'shadow-corridor';
export type BambooSpawnEdge = 'top' | 'left' | 'right';

const DEFAULT_OBSTACLES: ReadonlyArray<MapObstacleSpec> = [
    { id: 'lower-left', x: -104, y: -118, width: 190, height: 48, hp: 95 },
    { id: 'upper-right', x: 98, y: 112, width: 192, height: 48, hp: 120 },
];

const SHADOW_CORRIDOR_OBSTACLES: ReadonlyArray<MapObstacleSpec> = [
    { id: 'shadow-lower-left', x: -96, y: -96, width: 170, height: 46, hp: 90 },
    { id: 'shadow-middle-right', x: 102, y: 78, width: 172, height: 46, hp: 105 },
    { id: 'shadow-upper-left', x: -118, y: 248, width: 184, height: 48, hp: 120 },
];

function cloneSpecs(specs: ReadonlyArray<MapObstacleSpec>): MapObstacleSpec[] {
    return specs.map((spec) => ({ ...spec }));
}

export function describeBambooRouteGeometry(route: BambooRouteGeometry | undefined): string {
    if (route === 'open-lane') return '开阔正面';
    if (route === 'shadow-corridor') return '竹影夹道';
    return '残竹错径';
}

export function bambooObstacleSpecs(route?: BambooRouteGeometry): MapObstacleSpec[] {
    if (route === 'open-lane') return [];
    if (route === 'shadow-corridor') return cloneSpecs(SHADOW_CORRIDOR_OBSTACLES);
    return cloneSpecs(DEFAULT_OBSTACLES);
}

export function bambooSpawnEdge(route: BambooRouteGeometry | undefined, spawnIndex: number): BambooSpawnEdge | undefined {
    if (route === 'open-lane') return 'top';
    if (route === 'shadow-corridor') return spawnIndex % 2 === 0 ? 'left' : 'right';
    return undefined;
}
