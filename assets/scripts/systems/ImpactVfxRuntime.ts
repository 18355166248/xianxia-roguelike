export interface GlowLayer {
    width: number;
    alpha: number;
}

export interface ImpactShard {
    angle: number;
    distance: number;
    length: number;
    width: number;
    delay: number;
    spin: number;
}

export interface ImpactShardOptions {
    /** 碎片飞散的基准距离，实际距离在其 0.62–1 倍之间抖动。 */
    reach: number;
    /** 主方向（弧度）。留空表示均匀环形飞散。 */
    direction?: number;
    /** 主方向两侧的张角；仅在给出 direction 时生效。 */
    spread?: number;
}

export function easeOutCubic(t: number): number {
    const clamped = Math.max(0, Math.min(1, t));
    return 1 - (1 - clamped) ** 3;
}

export function easeOutQuint(t: number): number {
    const clamped = Math.max(0, Math.min(1, t));
    return 1 - (1 - clamped) ** 5;
}

export function easeInQuad(t: number): number {
    const clamped = Math.max(0, Math.min(1, t));
    return clamped * clamped;
}

/**
 * 冲击的观感靠"起手极快、收尾拖长"：线性插值会让每一次命中都像匀速放大的贴纸。
 */
export function impactExpansion(progress: number): number {
    return easeOutQuint(progress);
}

/**
 * 淡出比扩张晚一拍：先看清形状，再让它散掉。
 */
export function impactFade(progress: number, holdRatio = 0.28): number {
    const clamped = Math.max(0, Math.min(1, progress));
    if (clamped <= holdRatio) return 1;
    return 1 - easeInQuad((clamped - holdRatio) / (1 - holdRatio));
}

/**
 * 2D 管线在 Cocos 3.8 没有可用的公开叠加混合接口，这里用"由宽到窄、由暗到亮"的
 * 多层同形描边伪造辉光：最外层最宽最淡当光晕，最内层最细最亮当芯。
 */
export function glowStrokeLayers(coreWidth: number, coreAlpha: number, haloCount = 2): GlowLayer[] {
    const halos = Math.max(0, Math.floor(haloCount));
    const layers: GlowLayer[] = [];
    for (let index = halos; index >= 1; index -= 1) {
        layers.push({
            width: coreWidth * (1 + index * 1.15),
            alpha: Math.max(1, Math.round(coreAlpha * 0.3 / index)),
        });
    }
    layers.push({ width: coreWidth, alpha: Math.min(255, Math.round(coreAlpha)) });
    return layers;
}

/** 确定性伪随机：同一个种子必须画出同一批碎片，便于回归与截图比对。 */
function hashUnit(seed: number, salt: number): number {
    const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
    return value - Math.floor(value);
}

/**
 * 碎片是当前特效最缺的一层：只有环和射线时，打击读起来像线框动画而不是"炸开"。
 */
export function impactShardLayout(
    count: number,
    seed: number,
    options: ImpactShardOptions,
): ImpactShard[] {
    const total = Math.max(0, Math.floor(count));
    const shards: ImpactShard[] = [];
    for (let index = 0; index < total; index += 1) {
        const jitter = hashUnit(seed, index * 3 + 1);
        const lengthRoll = hashUnit(seed, index * 3 + 2);
        const delayRoll = hashUnit(seed, index * 3 + 3);
        const angle = options.direction === undefined
            ? (index / total) * Math.PI * 2 + (jitter - 0.5) * 0.55
            : options.direction + (jitter - 0.5) * (options.spread ?? Math.PI * 0.6);
        shards.push({
            angle,
            distance: options.reach * (0.62 + lengthRoll * 0.38),
            length: options.reach * (0.16 + lengthRoll * 0.2),
            width: 1.6 + jitter * 2.6,
            // 错开出发时间，避免所有碎片像一个整体在缩放。
            delay: delayRoll * 0.22,
            spin: (jitter - 0.5) * 320,
        });
    }
    return shards;
}

/** 把带延迟的碎片映射回 0–1 的自身进度；未出发时返回 0。 */
export function shardTravel(progress: number, delay: number): number {
    const span = Math.max(0.05, 1 - delay);
    return Math.max(0, Math.min(1, (progress - delay) / span));
}

/**
 * 拖尾用逐段收窄的缎带表达速度感：等宽直线读起来是一根棍子，不是剑光。
 */
export function trailSegmentWidths(baseWidth: number, segments: number): number[] {
    const total = Math.max(1, Math.floor(segments));
    const widths: number[] = [];
    for (let index = 0; index < total; index += 1) {
        const t = index / total;
        widths.push(baseWidth * (1 - t * 0.82));
    }
    return widths;
}
