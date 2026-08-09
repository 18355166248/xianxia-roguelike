import type { StageMapId } from '../config/GameConfig';
import type { MapEventTone, RouteCommitEffect } from './MapEventRuntime';

export interface RunMapEventRecord {
    choiceId: string;
    title: string;
    role: string;
    geometryPreview: string;
    commitLine: string;
    commitEffect?: RouteCommitEffect;
    outcome: string;
    tone: MapEventTone;
    iconResourcePath: string;
}

export interface RouteReplayStep {
    label: '入口预演' | '路线选择' | '战果验证';
    value: string;
}

export type RunDamageCause =
    | 'enemy-contact'
    | 'frost-tide'
    | 'boss-ground-slam'
    | 'boss-frost-slam'
    | 'boss-bamboo-pincer';

export interface RunStatsSnapshot {
    elapsedSeconds: number;
    enemiesDefeated: number;
    damageDealt: number;
    damageTaken: number;
    spiritVeinsClaimed: number;
    obstaclesBroken: number;
    tideEnemyHits: number;
    bestCombo: number;
    peakFlowTier: number;
    lastDamageCause?: RunDamageCause;
    mapEvent?: RunMapEventRecord;
}

function emptyStats(): RunStatsSnapshot {
    return {
        elapsedSeconds: 0,
        enemiesDefeated: 0,
        damageDealt: 0,
        damageTaken: 0,
        spiritVeinsClaimed: 0,
        obstaclesBroken: 0,
        tideEnemyHits: 0,
        bestCombo: 0,
        peakFlowTier: 0,
    };
}

/**
 * 战报只接收已经结算的事件，避免界面层反推击杀、承伤或地图交互而产生虚假数据。
 * 升级与暂停阶段不调用 tick，因此用时只统计真正可操作的战斗时间。
 */
export class RunStatsRuntime {
    private state: RunStatsSnapshot = emptyStats();

    public reset(): void {
        this.state = emptyStats();
    }

    public tick(dt: number): void {
        this.state.elapsedSeconds += Math.max(0, dt);
    }

    public recordEnemyDefeated(): void {
        this.state.enemiesDefeated += 1;
    }

    public recordDamageDealt(amount: number): void {
        this.state.damageDealt += Math.max(0, amount);
    }

    public recordDamageTaken(amount: number, cause?: RunDamageCause): void {
        this.state.damageTaken += Math.max(0, amount);
        // 战报只记录最近一次真实伤害来源；玩家死亡时它就是最接近结果的可解释证据。
        if (cause) this.state.lastDamageCause = cause;
    }

    public recordSpiritVeinClaimed(): void {
        this.state.spiritVeinsClaimed += 1;
    }

    public recordObstacleBroken(): void {
        this.state.obstaclesBroken += 1;
    }

    public recordTideEnemyHit(): void {
        this.state.tideEnemyHits += 1;
    }

    public recordCombatFlow(bestCombo: number, peakFlowTier: number): void {
        this.state.bestCombo = Math.max(this.state.bestCombo, Math.max(0, Math.floor(bestCombo)));
        this.state.peakFlowTier = Math.max(this.state.peakFlowTier, Math.max(0, Math.floor(peakFlowTier)));
    }

    public recordMapEvent(record: RunMapEventRecord): void {
        this.state.mapEvent = { ...record };
    }

    public restoreForQa(snapshot: RunStatsSnapshot): void {
        this.state = {
            ...snapshot,
            mapEvent: snapshot.mapEvent ? { ...snapshot.mapEvent } : undefined,
        };
    }

    public snapshot(): Readonly<RunStatsSnapshot> {
        return {
            ...this.state,
            mapEvent: this.state.mapEvent ? { ...this.state.mapEvent } : undefined,
        };
    }
}

export function formatRunDuration(totalSeconds: number): string {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(seconds / 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function describeMapAchievement(
    mapId: StageMapId,
    stats: Readonly<RunStatsSnapshot>,
): string {
    if (mapId === 'bamboo-ambush') {
        return `破竹 ${stats.obstaclesBroken} 道  ·  灵脉共鸣 ${stats.spiritVeinsClaimed} 次`;
    }
    if (mapId === 'frozen-ruins') {
        return `借潮伤敌 ${stats.tideEnemyHits} 次  ·  灵脉共鸣 ${stats.spiritVeinsClaimed} 次`;
    }
    return `灵脉共鸣 ${stats.spiritVeinsClaimed} 次  ·  山道肃清`;
}

export function describeMapEventDecision(stats: Readonly<RunStatsSnapshot>): string {
    const event = stats.mapEvent;
    return event ? `${event.title}  ·  ${event.outcome}` : '未逢奇遇  ·  此局未留路线印记';
}

export function describeRouteReplaySteps(
    stats: Readonly<RunStatsSnapshot>,
): readonly RouteReplayStep[] {
    const event = stats.mapEvent;
    if (!event) return [];
    return [
        { label: '入口预演', value: event.geometryPreview },
        { label: '路线选择', value: event.title },
        { label: '战果验证', value: event.outcome },
    ];
}
