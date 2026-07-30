import type { StageMapId } from '../config/GameConfig';
import type { FrostTidePhase } from './FrostTideRuntime';

export type OpeningObjectiveKind =
    | 'claim-sword-vein'
    | 'break-bamboo-lane'
    | 'survive-first-tide';

export type OpeningObjectiveOutcome = 'active' | 'success' | 'recover' | 'expired';

export interface OpeningObjectivePresentation {
    kind: OpeningObjectiveKind;
    eyebrow: string;
    instruction: string;
    success: string;
    recover: string;
    accent: string;
    markerEffect: 'qingshi-stele' | 'bamboo-burn' | 'frost-seal';
    markerPosition: {
        x: number;
        y: number;
    };
    markerDiameter: number;
}

export interface OpeningObjectiveInput {
    spiritVeinProgress: number;
    spiritVeinClaimed: boolean;
    obstaclesRemaining: number;
    frostTidePhase: FrostTidePhase;
    frostTideCycle: number;
    frostSecondsToSurge: number;
    frostPlayerHitCycle: number;
}

export interface OpeningObjectiveSnapshot {
    visible: boolean;
    outcome: OpeningObjectiveOutcome;
    progress: number;
    text: string;
}

export interface OpeningSpawnDirective {
    edge: 'top' | 'left' | 'right';
    y: number;
    xRatio?: number;
}

const MAX_ACTIVE_SECONDS = 14;
const RESULT_HOLD_SECONDS = 1.6;

export function openingObjectivePresentationFor(mapId: StageMapId): OpeningObjectivePresentation {
    if (mapId === 'bamboo-ambush') {
        return {
            kind: 'break-bamboo-lane',
            eyebrow: '首境动作 · 破障择面',
            instruction: '先斩下段竹障 · 打开迎敌正面',
            success: '下段已破 · 通路展开',
            recover: '竹障未破 · 可绕行牵敌',
            accent: '#B7E4C7',
            markerEffect: 'bamboo-burn',
            markerPosition: { x: -104, y: -118 },
            markerDiameter: 190,
        };
    }
    if (mapId === 'frozen-ruins') {
        return {
            kind: 'survive-first-tide',
            eyebrow: '首境动作 · 入圈候潮',
            instruction: '寒潮前进入封脉圈 · 圈内避过首潮',
            success: '首潮已避 · 冰面节奏已明',
            recover: '首潮已过 · 下次提前入圈',
            accent: '#BCEFF5',
            markerEffect: 'frost-seal',
            markerPosition: { x: -170, y: -180 },
            markerDiameter: 170,
        };
    }
    return {
        kind: 'claim-sword-vein',
        eyebrow: '首境动作 · 抢占剑脉',
        instruction: '驻足引动剑脉 · 再迎山门追兵',
        success: '剑脉已启 · 正面迎敌',
        recover: '剑脉未启 · 仍可继续争夺',
        accent: '#E3C06F',
        markerEffect: 'qingshi-stele',
        markerPosition: { x: -118, y: 70 },
        markerDiameter: 146,
    };
}

export function openingSpawnDirectiveFor(
    mapId: StageMapId,
    spawnIndex: number,
): OpeningSpawnDirective {
    const index = Math.max(0, Math.floor(spawnIndex));
    if (mapId === 'bamboo-ambush') {
        const yBands = [-118, 112, 286];
        return {
            edge: index % 2 === 0 ? 'left' : 'right',
            y: yBands[index % yBands.length],
        };
    }
    if (mapId === 'frozen-ruins') {
        return {
            edge: 'top',
            y: 420,
            xRatio: [-0.68, 0.68, 0][index % 3],
        };
    }
    return {
        edge: 'top',
        y: 500,
        xRatio: [-0.58, 0, 0.58][index % 3],
    };
}

function clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
}

export class OpeningObjectiveRuntime {
    private mapId: StageMapId = 'qingshi-road';
    private elapsed = 0;
    private resultElapsed = 0;
    private outcome: OpeningObjectiveOutcome = 'expired';

    public begin(mapId: StageMapId): void {
        this.mapId = mapId;
        this.elapsed = 0;
        this.resultElapsed = 0;
        this.outcome = 'active';
    }

    public reset(): void {
        this.elapsed = 0;
        this.resultElapsed = 0;
        this.outcome = 'expired';
    }

    public tick(dt: number, input: OpeningObjectiveInput): OpeningObjectiveSnapshot {
        const delta = Math.max(0, dt);
        if (this.outcome === 'active') {
            this.elapsed += delta;
            if (this.isComplete(input)) {
                this.outcome = this.resolveOutcome(input);
                this.resultElapsed = 0;
            } else if (this.elapsed >= MAX_ACTIVE_SECONDS) {
                this.outcome = 'expired';
            }
        } else if (this.outcome === 'success' || this.outcome === 'recover') {
            this.resultElapsed += delta;
        }
        return this.snapshot(input);
    }

    public snapshot(input: OpeningObjectiveInput): OpeningObjectiveSnapshot {
        const presentation = openingObjectivePresentationFor(this.mapId);
        const progress = this.progress(input);
        if (this.outcome === 'expired' || this.resultElapsed >= RESULT_HOLD_SECONDS) {
            return {
                visible: false,
                outcome: this.outcome,
                progress,
                text: '',
            };
        }
        if (this.outcome === 'success' || this.outcome === 'recover') {
            return {
                visible: true,
                outcome: this.outcome,
                progress: 1,
                text: this.outcome === 'success' ? presentation.success : presentation.recover,
            };
        }
        return {
            visible: true,
            outcome: 'active',
            progress,
            text: this.activeText(input),
        };
    }

    public isFrostSanctuaryActive(): boolean {
        return this.mapId === 'frozen-ruins' && this.outcome === 'active';
    }

    private isComplete(input: OpeningObjectiveInput): boolean {
        if (this.mapId === 'bamboo-ambush') return input.obstaclesRemaining <= 1;
        if (this.mapId === 'frozen-ruins') return input.frostTideCycle >= 1;
        return input.spiritVeinClaimed;
    }

    private resolveOutcome(input: OpeningObjectiveInput): OpeningObjectiveOutcome {
        if (this.mapId !== 'frozen-ruins') return 'success';
        return input.frostPlayerHitCycle === 0 ? 'recover' : 'success';
    }

    private progress(input: OpeningObjectiveInput): number {
        if (this.mapId === 'bamboo-ambush') return clamp01(2 - input.obstaclesRemaining);
        if (this.mapId === 'frozen-ruins') {
            return input.frostTideCycle >= 1
                ? 1
                : clamp01(1 - input.frostSecondsToSurge / 5.8);
        }
        return clamp01(input.spiritVeinProgress);
    }

    private activeText(input: OpeningObjectiveInput): string {
        if (this.mapId === 'bamboo-ambush') {
            return `先破下段竹障 ${Math.max(0, 2 - input.obstaclesRemaining)}/1 · 打开迎敌正面`;
        }
        if (this.mapId === 'frozen-ruins') {
            const phase = input.frostTidePhase === 'surge' ? '寒潮横渡' : `首潮 ${Math.max(0, input.frostSecondsToSurge).toFixed(1)}秒`;
            return `进入左侧封脉圈 · ${phase}`;
        }
        return `驻足剑脉 ${Math.round(clamp01(input.spiritVeinProgress) * 100)}% · 再迎正面追兵`;
    }
}
