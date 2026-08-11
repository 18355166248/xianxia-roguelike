export type CombatFlowTier = 0 | 1 | 2 | 3;

export interface CombatFlowSnapshot {
    combo: number;
    timer: number;
    tier: CombatFlowTier;
    bestCombo: number;
    peakTier: CombatFlowTier;
    label: string;
    damageMultiplier: number;
}

export interface CombatFlowKillResult {
    snapshot: CombatFlowSnapshot;
    tierAdvanced: boolean;
}

export type CombatImpactTier = 'normal' | 'heavy' | 'finisher';

export interface CombatImpactPresentation {
    tier: CombatImpactTier;
    burstScale: number;
    numberScale: number;
    shakeDuration: number;
    shakeStrength: number;
    flashAlpha: number;
}

/**
 * 把命中来源、目标重要度和斩杀结果收束成统一反馈档位，避免各攻击分支自行堆震动与闪白。
 * 斩杀始终优先，其次是功法、环境联动和高价值目标；普通飞剑保留轻反馈以控制屏幕噪声。
 */
export function combatImpactPresentationFor(
    source: 'skill' | 'sword' | 'environment',
    importantTarget: boolean,
    lethal: boolean,
    damageRatio: number,
): CombatImpactPresentation {
    if (lethal) {
        return {
            tier: 'finisher',
            burstScale: importantTarget ? 1.55 : 1.34,
            numberScale: importantTarget ? 1.28 : 1.16,
            shakeDuration: importantTarget ? 0.24 : 0.14,
            shakeStrength: importantTarget ? 10 : 5.5,
            flashAlpha: importantTarget ? 40 : 22,
        };
    }
    if (source !== 'sword' || importantTarget || damageRatio >= 0.22) {
        return {
            tier: 'heavy',
            burstScale: importantTarget ? 1.24 : 1.12,
            numberScale: importantTarget ? 1.12 : 1.04,
            shakeDuration: importantTarget ? 0.13 : 0.09,
            shakeStrength: importantTarget ? 5.5 : 3.5,
            flashAlpha: importantTarget ? 18 : 10,
        };
    }
    return {
        tier: 'normal',
        burstScale: 1,
        numberScale: 1,
        shakeDuration: 0.06,
        shakeStrength: 2.2,
        flashAlpha: 0,
    };
}

const COMBO_WINDOW = 2.6;

/**
 * 三档阈值必须在真实关卡里够得着：一章的非首领敌人加权总数只有 25–28，
 * 旧的 20 连斩要求全程零失误横跨三个波次，实战中几乎没有玩家见过最高档。
 */
function tierFor(combo: number): CombatFlowTier {
    if (combo >= 16) return 3;
    if (combo >= 10) return 2;
    if (combo >= 5) return 1;
    return 0;
}

function labelFor(tier: CombatFlowTier): string {
    if (tier >= 3) return '无双剑势';
    if (tier >= 2) return '剑潮奔涌';
    if (tier >= 1) return '连斩成势';
    return '剑意初聚';
}

/**
 * 连斩只由真实击杀推进，受伤或超时会中断；把“打得顺”转化为短时滚雪球，
 * 同时保留失误后重新起势的节奏，而不是永久叠加隐藏伤害。
 */
export class CombatFlowRuntime {
    private combo = 0;
    private timer = 0;
    private tier: CombatFlowTier = 0;
    private bestCombo = 0;
    private peakTier: CombatFlowTier = 0;

    public reset(): void {
        this.combo = 0;
        this.timer = 0;
        this.tier = 0;
        this.bestCombo = 0;
        this.peakTier = 0;
    }

    /**
     * @param sustained 波次间隙传 true：清完一波到下一波刷新之间没有可斩目标，
     *                  让计时继续流逝等于用"没敌人"惩罚玩家，剑势会必然在换波处断掉。
     */
    public tick(dt: number, sustained = false): void {
        if (this.combo <= 0 || sustained) return;
        this.timer = Math.max(0, this.timer - Math.max(0, dt));
        if (this.timer <= 0) this.breakFlow();
    }

    public recordKill(weight = 1): CombatFlowKillResult {
        const previousTier = this.tier;
        this.combo += Math.max(1, Math.floor(weight));
        this.timer = COMBO_WINDOW;
        this.tier = tierFor(this.combo);
        this.bestCombo = Math.max(this.bestCombo, this.combo);
        this.peakTier = Math.max(this.peakTier, this.tier) as CombatFlowTier;
        return {
            snapshot: this.snapshot(),
            tierAdvanced: this.tier > previousTier,
        };
    }

    public breakFlow(): boolean {
        const hadFlow = this.combo >= 5;
        this.combo = 0;
        this.timer = 0;
        this.tier = 0;
        return hadFlow;
    }

    public snapshot(): CombatFlowSnapshot {
        return {
            combo: this.combo,
            timer: this.timer,
            tier: this.tier,
            bestCombo: this.bestCombo,
            peakTier: this.peakTier,
            label: labelFor(this.tier),
            // 滚雪球要能被感知到才叫爽感；三档分别是 +7% / +14% / +21%。
            damageMultiplier: 1 + this.tier * 0.07,
        };
    }
}
