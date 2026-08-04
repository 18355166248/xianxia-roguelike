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

const COMBO_WINDOW = 2.6;

function tierFor(combo: number): CombatFlowTier {
    if (combo >= 20) return 3;
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

    public tick(dt: number): void {
        if (this.combo <= 0) return;
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
            damageMultiplier: 1 + this.tier * 0.05,
        };
    }
}
