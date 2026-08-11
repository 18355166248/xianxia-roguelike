export type HitStopTier = 'light' | 'heavy' | 'finisher' | 'breakthrough';

export interface HitStopSpec {
    /** 完全定格的秒数，期间战斗与特效时间轴不推进。 */
    freeze: number;
    /** 定格结束后的慢放秒数，用于把冲击力平滑还给正常节奏。 */
    slow: number;
    /** 慢放期间的时间倍率，1 表示不慢放。 */
    slowScale: number;
}

const HIT_STOP_SPECS: Readonly<Record<HitStopTier, HitStopSpec>> = {
    // 普通斩杀只给一帧半的停顿：既能读到"这一下打死了"，又不会让清潮变得黏滞。
    light: { freeze: 0.045, slow: 0, slowScale: 1 },
    // 精英与功法重击留出慢放尾巴，让范围伤害的受击者能被逐个看清。
    heavy: { freeze: 0.09, slow: 0.12, slowScale: 0.45 },
    // 关底转相与斩杀是一章的情绪顶点，允许明显的电影感停顿。
    finisher: { freeze: 0.16, slow: 0.24, slowScale: 0.35 },
    // 破境要把战斗切到选择界面，停顿同时承担"世界为你静止"的仪式感。
    breakthrough: { freeze: 0.18, slow: 0.3, slowScale: 0.3 },
};

const TIER_WEIGHT: Readonly<Record<HitStopTier, number>> = {
    light: 1,
    heavy: 2,
    finisher: 3,
    breakthrough: 4,
};

export function hitStopSpecFor(tier: HitStopTier): HitStopSpec {
    return HIT_STOP_SPECS[tier];
}

/**
 * 顿帧只负责把真实 dt 换算成战斗 dt，不持有任何节点。
 * 同一时刻只保留最强的一次冲击，避免密集击杀把停顿累加成卡顿。
 */
export class HitStopRuntime {
    private freezeTimer = 0;
    private slowTimer = 0;
    private slowScale = 1;
    private activeWeight = 0;

    public reset(): void {
        this.freezeTimer = 0;
        this.slowTimer = 0;
        this.slowScale = 1;
        this.activeWeight = 0;
    }

    /**
     * @param softened 减少动态设置开启时传 true：保留可读的极短停顿，去掉慢放。
     */
    public trigger(tier: HitStopTier, softened = false): void {
        const weight = TIER_WEIGHT[tier];
        // 低档冲击不能打断正在播放的高档停顿，否则关底转相会被杂兵斩杀截断。
        if (weight < this.activeWeight && (this.freezeTimer > 0 || this.slowTimer > 0)) return;
        const spec = HIT_STOP_SPECS[tier];
        this.activeWeight = weight;
        this.freezeTimer = softened ? spec.freeze * 0.5 : spec.freeze;
        this.slowTimer = softened ? 0 : spec.slow;
        this.slowScale = softened ? 1 : spec.slowScale;
    }

    public get frozen(): boolean {
        return this.freezeTimer > 0;
    }

    public get active(): boolean {
        return this.freezeTimer > 0 || this.slowTimer > 0;
    }

    /**
     * 消费一帧真实时间，返回战斗系统应当使用的 dt。
     * 定格帧返回 0；慢放帧按倍率缩放；两者都结束后原样返回。
     */
    public consume(dt: number): number {
        // 一帧真实时间依次穿过定格段、慢放段和正常段，长帧不会被整帧吞掉。
        let remaining = Math.max(0, dt);
        if (this.freezeTimer > 0) {
            const frozen = Math.min(this.freezeTimer, remaining);
            this.freezeTimer -= frozen;
            remaining -= frozen;
            if (this.freezeTimer > 0) return 0;
        }
        if (remaining <= 0) {
            if (this.slowTimer <= 0) this.activeWeight = 0;
            return 0;
        }
        if (this.slowTimer > 0) {
            const slowed = Math.min(this.slowTimer, remaining);
            this.slowTimer -= slowed;
            if (this.slowTimer <= 0) this.activeWeight = 0;
            return slowed * this.slowScale + (remaining - slowed);
        }
        this.activeWeight = 0;
        return remaining;
    }
}
