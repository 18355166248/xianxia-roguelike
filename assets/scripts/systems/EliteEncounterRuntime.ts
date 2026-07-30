import type { StageMapId } from '../config/GameConfig';

export type EliteEncounterKind =
    | 'lure-foxes-into-vein'
    | 'stagger-wardens-on-bamboo'
    | 'catch-corpses-in-tide';

export interface EliteEncounterPresentation {
    kind: EliteEncounterKind;
    eyebrow: string;
    instruction: string;
    success: string;
    accent: string;
    target: number;
}

export interface EliteEncounterSnapshot {
    active: boolean;
    completed: boolean;
    current: number;
    target: number;
    text: string;
}

export interface EliteSpawnDirective {
    edge: 'top' | 'left' | 'right';
    y: number;
    xRatio?: number;
}

export interface Point2D {
    x: number;
    y: number;
}

const ELITE_WAVE_INDEX = 1;
const QINGSHI_VEIN_RADIUS = 118;
const QINGSHI_VEIN_DAMAGE_MULTIPLIER = 1.35;

export function eliteEncounterPresentationFor(mapId: StageMapId): EliteEncounterPresentation {
    if (mapId === 'bamboo-ambush') {
        return {
            kind: 'stagger-wardens-on-bamboo',
            eyebrow: '第二境试炼 · 借障截锋',
            instruction: '诱使竹甲突进撞障',
            success: '镇守锋线已乱 · 逐个击破',
            accent: '#B7E4C7',
            target: 2,
        };
    }
    if (mapId === 'frozen-ruins') {
        return {
            kind: 'catch-corpses-in-tide',
            eyebrow: '第二境试炼 · 借潮断冲',
            instruction: '把冰尸留在寒潮路径',
            success: '寒潮截断尸阵 · 乘隙追击',
            accent: '#BCEFF5',
            target: 3,
        };
    }
    return {
        kind: 'lure-foxes-into-vein',
        eyebrow: '第二境试炼 · 引狐入脉',
        instruction: '诱狐踏入剑脉再斩杀',
        success: '狐围已破 · 剑脉仍盛',
        accent: '#E3C06F',
        target: 3,
    };
}

export function eliteEncounterSpawnDirectiveFor(
    mapId: StageMapId,
    spawnIndex: number,
): EliteSpawnDirective {
    const index = Math.max(0, Math.floor(spawnIndex));
    if (mapId === 'bamboo-ambush') {
        return {
            edge: 'top',
            y: 500,
            xRatio: [0.42, -0.48, 0.1, -0.12][index % 4],
        };
    }
    if (mapId === 'frozen-ruins') {
        return {
            edge: 'top',
            y: 470,
            xRatio: [-0.62, 0.62, 0][index % 3],
        };
    }
    return {
        edge: index % 2 === 0 ? 'left' : 'right',
        y: [260, 360, 455][index % 3],
    };
}

export function isInsideQingshiEliteVein(
    enemyPosition: Point2D,
    veinPosition: Point2D | undefined,
): boolean {
    if (!veinPosition) return false;
    return Math.hypot(
        enemyPosition.x - veinPosition.x,
        enemyPosition.y - veinPosition.y,
    ) <= QINGSHI_VEIN_RADIUS;
}

export function qingshiEliteVeinDamageMultiplier(
    waveIndex: number,
    enemyPosition: Point2D,
    veinPosition: Point2D | undefined,
): number {
    return waveIndex === ELITE_WAVE_INDEX
        && isInsideQingshiEliteVein(enemyPosition, veinPosition)
        ? QINGSHI_VEIN_DAMAGE_MULTIPLIER
        : 1;
}

export function shouldStaggerBambooWarden(
    waveIndex: number,
    charging: boolean,
    barrierHit: boolean,
    collisionCooldown: number,
): boolean {
    return waveIndex === ELITE_WAVE_INDEX
        && charging
        && barrierHit
        && collisionCooldown <= 0;
}

export class EliteEncounterRuntime {
    private mapId: StageMapId = 'qingshi-road';
    private waveIndex = -1;
    private qingshiVeinKills = 0;
    private bambooBarrierStaggers = 0;
    private readonly frostHitEnemies = new Set<string>();

    public begin(mapId: StageMapId, waveIndex: number): void {
        this.mapId = mapId;
        this.waveIndex = waveIndex;
        this.qingshiVeinKills = 0;
        this.bambooBarrierStaggers = 0;
        this.frostHitEnemies.clear();
    }

    public reset(): void {
        this.waveIndex = -1;
        this.qingshiVeinKills = 0;
        this.bambooBarrierStaggers = 0;
        this.frostHitEnemies.clear();
    }

    public recordQingshiVeinKill(): void {
        if (!this.active() || this.mapId !== 'qingshi-road') return;
        this.qingshiVeinKills += 1;
    }

    public recordBambooBarrierStagger(): void {
        if (!this.active() || this.mapId !== 'bamboo-ambush') return;
        this.bambooBarrierStaggers += 1;
    }

    public recordFrostTideHit(enemyId: string): void {
        if (!this.active() || this.mapId !== 'frozen-ruins' || !enemyId) return;
        this.frostHitEnemies.add(enemyId);
    }

    public snapshot(): EliteEncounterSnapshot {
        const presentation = eliteEncounterPresentationFor(this.mapId);
        const active = this.active();
        const current = Math.min(presentation.target, this.current());
        const completed = active && current >= presentation.target;
        return {
            active,
            completed,
            current,
            target: presentation.target,
            text: completed
                ? presentation.success
                : `${presentation.instruction} ${current}/${presentation.target}`,
        };
    }

    private active(): boolean {
        return this.waveIndex === ELITE_WAVE_INDEX;
    }

    private current(): number {
        if (this.mapId === 'bamboo-ambush') return this.bambooBarrierStaggers;
        if (this.mapId === 'frozen-ruins') return this.frostHitEnemies.size;
        return this.qingshiVeinKills;
    }
}
