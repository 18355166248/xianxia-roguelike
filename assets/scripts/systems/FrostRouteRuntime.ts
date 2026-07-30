export type FrostRouteGeometry = 'tide-convergence' | 'sealed-sanctuary';

export interface FrostRouteMarkerSpec {
    x: number;
    y: number;
    radius: number;
    label: string;
}

export interface FrostConvergenceSpawn {
    xRatio: number;
    y: number;
}

const TIDE_MARKER: FrostRouteMarkerSpec = {
    x: 0,
    y: 92,
    radius: 88,
    label: '逆潮祭纹 · 敌聚潮线',
};

const SANCTUARY_MARKER: FrostRouteMarkerSpec = {
    x: -74,
    y: -214,
    radius: 106,
    label: '封脉结界 · 潮免',
};

export function describeFrostRouteGeometry(route: FrostRouteGeometry | undefined): string {
    if (route === 'tide-convergence') return '潮线聚敌';
    if (route === 'sealed-sanctuary') return '封脉结界';
    return '往复寒潮';
}

export function frostRouteMarker(route: FrostRouteGeometry): FrostRouteMarkerSpec {
    return { ...(route === 'tide-convergence' ? TIDE_MARKER : SANCTUARY_MARKER) };
}

export function frostConvergenceSpawn(
    route: FrostRouteGeometry | undefined,
    spawnIndex: number,
): FrostConvergenceSpawn | undefined {
    if (route !== 'tide-convergence') return undefined;
    const xRatios = [-0.62, 0, 0.62];
    const yBands = [24, 92, 160];
    return {
        xRatio: xRatios[spawnIndex % xRatios.length],
        y: yBands[spawnIndex % yBands.length],
    };
}

export function isInFrostSanctuary(
    position: Readonly<{ x: number; y: number }>,
    route: FrostRouteGeometry | undefined,
): boolean {
    if (route !== 'sealed-sanctuary') return false;
    return Math.hypot(position.x - SANCTUARY_MARKER.x, position.y - SANCTUARY_MARKER.y)
        <= SANCTUARY_MARKER.radius;
}

export function frostTideEnemyDamage(route: FrostRouteGeometry | undefined): number {
    return route === 'tide-convergence' ? 38 : 24;
}
