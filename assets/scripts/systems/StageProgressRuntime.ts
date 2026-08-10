import type { StageMapId, UpgradePath } from '../config/GameConfig';

export interface StageProgressRecord {
    clears: number;
    bestSeconds?: number;
    bestCombo?: number;
    lastBuild?: string;
    masteredPaths?: UpgradePath[];
    routeChoices?: string[];
}

export interface StageVictoryProfile {
    bestCombo: number;
    buildName?: string;
    path?: UpgradePath;
    tier?: number;
    routeChoiceId?: string;
}

export interface CultivationArchiveSummary {
    totalClears: number;
    bestCombo: number;
    masteredPaths: UpgradePath[];
    lastBuild?: string;
    discoveredRoutes: number;
}

export type StageProgressSnapshot = Partial<Record<StageMapId, StageProgressRecord>>;

export interface StageVictoryResult {
    firstClear: boolean;
    newBest: boolean;
    record: StageProgressRecord;
}

export interface StageFirstClearReward {
    title: string;
    benefit: string;
    iconResourcePath: string;
    bonus: {
        maxHp?: number;
        moveSpeed?: number;
        swordDamage?: number;
    };
}

export interface StageRewardBonuses {
    maxHp: number;
    moveSpeed: number;
    swordDamage: number;
}

export const STAGE_FIRST_CLEAR_REWARDS: Readonly<Record<StageMapId, StageFirstClearReward>> = {
    'qingshi-road': {
        title: '青石剑印',
        benefit: '御剑伤害 +2',
        iconResourcePath: 'art/relics/xianxia-relics_00/spriteFrame',
        bonus: { swordDamage: 2 },
    },
    'bamboo-ambush': {
        title: '竹影行符',
        benefit: '移动速度 +10',
        iconResourcePath: 'art/relics/xianxia-relics_02/spriteFrame',
        bonus: { moveSpeed: 10 },
    },
    'frozen-ruins': {
        title: '寒潭玉魄',
        benefit: '最大气血 +8',
        iconResourcePath: 'art/relics/xianxia-relics_24/spriteFrame',
        bonus: { maxHp: 8 },
    },
};

const EMPTY_RECORD: Readonly<StageProgressRecord> = { clears: 0 };

export class StageProgressRuntime {
    private state: StageProgressSnapshot = {};

    public recordFor(mapId: StageMapId): Readonly<StageProgressRecord> {
        return this.state[mapId] ?? EMPTY_RECORD;
    }

    public recordVictory(
        mapId: StageMapId,
        elapsedSeconds: number,
        profile?: Readonly<StageVictoryProfile>,
    ): StageVictoryResult {
        const previous = this.recordFor(mapId);
        const duration = Math.max(0, elapsedSeconds);
        const firstClear = previous.clears === 0;
        const newBest = previous.bestSeconds === undefined || duration < previous.bestSeconds;
        const masteredPaths = [...(previous.masteredPaths ?? [])];
        if (profile?.path && (profile.tier ?? 0) >= 3 && !masteredPaths.includes(profile.path)) {
            masteredPaths.push(profile.path);
        }
        const routeChoices = [...(previous.routeChoices ?? [])];
        if (profile?.routeChoiceId && !routeChoices.includes(profile.routeChoiceId)) {
            routeChoices.push(profile.routeChoiceId);
        }
        const record: StageProgressRecord = {
            clears: previous.clears + 1,
            bestSeconds: newBest ? duration : previous.bestSeconds,
            bestCombo: Math.max(previous.bestCombo ?? 0, profile?.bestCombo ?? 0),
            lastBuild: profile?.buildName ?? previous.lastBuild,
            masteredPaths,
            routeChoices,
        };
        this.state[mapId] = record;
        return { firstClear, newBest, record: { ...record } };
    }

    public rewardBonuses(): StageRewardBonuses {
        return (Object.keys(STAGE_FIRST_CLEAR_REWARDS) as StageMapId[]).reduce<StageRewardBonuses>(
            (total, mapId) => {
                if (this.recordFor(mapId).clears <= 0) return total;
                const bonus = STAGE_FIRST_CLEAR_REWARDS[mapId].bonus;
                total.maxHp += bonus.maxHp ?? 0;
                total.moveSpeed += bonus.moveSpeed ?? 0;
                total.swordDamage += bonus.swordDamage ?? 0;
                return total;
            },
            { maxHp: 0, moveSpeed: 0, swordDamage: 0 },
        );
    }

    public cultivationArchive(): CultivationArchiveSummary {
        const records = Object.values(this.state).filter(
            (record): record is StageProgressRecord => Boolean(record),
        );
        const masteredPaths = records.reduce<UpgradePath[]>((paths, record) => {
            for (const path of record.masteredPaths ?? []) {
                if (!paths.includes(path)) paths.push(path);
            }
            return paths;
        }, []);
        const latest = [...records].reverse().find((record) => record.lastBuild);
        const discoveredRoutes = records.reduce<string[]>((routes, record) => {
            for (const route of record.routeChoices ?? []) {
                if (!routes.includes(route)) routes.push(route);
            }
            return routes;
        }, []).length;
        return {
            totalClears: records.reduce((sum, record) => sum + record.clears, 0),
            bestCombo: records.reduce((best, record) => Math.max(best, record.bestCombo ?? 0), 0),
            masteredPaths,
            lastBuild: latest?.lastBuild,
            discoveredRoutes,
        };
    }

    public restore(serialized: string | undefined): boolean {
        if (!serialized) return false;
        try {
            const parsed = JSON.parse(serialized) as unknown;
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
            const restored: StageProgressSnapshot = {};
            const mapIds: StageMapId[] = ['qingshi-road', 'bamboo-ambush', 'frozen-ruins'];
            mapIds.forEach((mapId) => {
                const candidate = (parsed as Record<string, unknown>)[mapId];
                if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return;
                const clears = (candidate as Record<string, unknown>).clears;
                const bestSeconds = (candidate as Record<string, unknown>).bestSeconds;
                const bestCombo = (candidate as Record<string, unknown>).bestCombo;
                const lastBuild = (candidate as Record<string, unknown>).lastBuild;
                const masteredPaths = (candidate as Record<string, unknown>).masteredPaths;
                const routeChoices = (candidate as Record<string, unknown>).routeChoices;
                if (typeof clears !== 'number' || !Number.isFinite(clears) || clears < 0) return;
                if (
                    bestSeconds !== undefined
                    && (typeof bestSeconds !== 'number' || !Number.isFinite(bestSeconds) || bestSeconds < 0)
                ) return;
                if (
                    bestCombo !== undefined
                    && (typeof bestCombo !== 'number' || !Number.isFinite(bestCombo) || bestCombo < 0)
                ) return;
                if (lastBuild !== undefined && typeof lastBuild !== 'string') return;
                const validPaths: UpgradePath[] = ['edge', 'mystic', 'vitality'];
                if (
                    masteredPaths !== undefined
                    && (!Array.isArray(masteredPaths) || masteredPaths.some((path) => !validPaths.includes(path as UpgradePath)))
                ) return;
                if (
                    routeChoices !== undefined
                    && (!Array.isArray(routeChoices) || routeChoices.some((choice) => typeof choice !== 'string'))
                ) return;
                restored[mapId] = {
                    clears: Math.floor(clears),
                    bestSeconds,
                    bestCombo: bestCombo === undefined ? undefined : Math.floor(bestCombo),
                    lastBuild,
                    masteredPaths: Array.isArray(masteredPaths) ? [...masteredPaths] as UpgradePath[] : [],
                    routeChoices: Array.isArray(routeChoices) ? [...routeChoices] as string[] : [],
                };
            });
            this.state = restored;
            return true;
        } catch {
            return false;
        }
    }

    public serialize(): string {
        return JSON.stringify(this.snapshot());
    }

    public snapshot(): StageProgressSnapshot {
        return Object.fromEntries(
            Object.entries(this.state).map(([mapId, record]) => [
                mapId,
                record
                    ? {
                        ...record,
                        masteredPaths: [...(record.masteredPaths ?? [])],
                        routeChoices: [...(record.routeChoices ?? [])],
                    }
                    : record,
            ]),
        ) as StageProgressSnapshot;
    }
}

export function formatStageRecord(record: Readonly<StageProgressRecord>): string {
    if (record.clears <= 0 || record.bestSeconds === undefined) {
        return '尚未通关  ·  通关后留下道印';
    }
    const totalSeconds = Math.max(0, Math.floor(record.bestSeconds));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const combo = (record.bestCombo ?? 0) > 0 ? `  ·  连斩 ${record.bestCombo}` : '';
    return `已破 ${record.clears} 次  ·  最速 ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}${combo}`;
}

export function formatFirstClearReward(mapId: StageMapId, cleared: boolean): string {
    const reward = STAGE_FIRST_CLEAR_REWARDS[mapId];
    return `${cleared ? '已获得' : '首破可得'}  ·  ${reward.title}  ·  ${reward.benefit}`;
}
