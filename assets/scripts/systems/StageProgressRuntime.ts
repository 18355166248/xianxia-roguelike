import type { StageMapId } from '../config/GameConfig';

export interface StageProgressRecord {
    clears: number;
    bestSeconds?: number;
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

    public recordVictory(mapId: StageMapId, elapsedSeconds: number): StageVictoryResult {
        const previous = this.recordFor(mapId);
        const duration = Math.max(0, elapsedSeconds);
        const firstClear = previous.clears === 0;
        const newBest = previous.bestSeconds === undefined || duration < previous.bestSeconds;
        const record: StageProgressRecord = {
            clears: previous.clears + 1,
            bestSeconds: newBest ? duration : previous.bestSeconds,
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
                if (typeof clears !== 'number' || !Number.isFinite(clears) || clears < 0) return;
                if (
                    bestSeconds !== undefined
                    && (typeof bestSeconds !== 'number' || !Number.isFinite(bestSeconds) || bestSeconds < 0)
                ) return;
                restored[mapId] = {
                    clears: Math.floor(clears),
                    bestSeconds,
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
                record ? { ...record } : record,
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
    return `已破 ${record.clears} 次  ·  最速 ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatFirstClearReward(mapId: StageMapId, cleared: boolean): string {
    const reward = STAGE_FIRST_CLEAR_REWARDS[mapId];
    return `${cleared ? '已获得' : '首破可得'}  ·  ${reward.title}  ·  ${reward.benefit}`;
}
