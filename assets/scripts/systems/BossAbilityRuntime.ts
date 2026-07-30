import type { StageMapId } from '../config/GameConfig';

export type BossAbilityKind =
    | 'qingshi-seal-chain'
    | 'bamboo-pincer'
    | 'frost-tide-slam';

export interface Point2D {
    x: number;
    y: number;
}

export interface BossAbilityPattern {
    kind: BossAbilityKind;
    title: string;
    cue: string;
    triggerAt: number;
    life: number;
    damageMultiplier: number;
}

export interface BambooPincerGap {
    centerX: number;
    halfWidth: number;
}

export function bossAbilityPatternFor(
    mapId: StageMapId,
    phase: 1 | 2,
): BossAbilityPattern {
    const phaseTwo = phase === 2;
    if (mapId === 'bamboo-ambush') {
        return {
            kind: 'bamboo-pincer',
            title: '竹影合围',
            cue: '入隙避锋',
            triggerAt: phaseTwo ? 0.72 : 0.9,
            life: phaseTwo ? 1.08 : 1.24,
            damageMultiplier: phaseTwo ? 1.08 : 0.95,
        };
    }
    if (mapId === 'frozen-ruins') {
        return {
            kind: 'frost-tide-slam',
            title: '唤潮落印',
            cue: '离印看潮',
            triggerAt: phaseTwo ? 0.68 : 0.82,
            life: phaseTwo ? 1.02 : 1.16,
            damageMultiplier: phaseTwo ? 0.72 : 0.62,
        };
    }
    return {
        kind: 'qingshi-seal-chain',
        title: '三叠地脉',
        cue: '横移避印',
        triggerAt: phaseTwo ? 0.62 : 0.78,
        life: phaseTwo ? 1.16 : 1.32,
        // 三枚地印分别结算，单枚伤害必须低于一次完整震地，避免总伤害无意翻倍。
        damageMultiplier: phaseTwo ? 0.46 : 0.4,
    };
}

export function qingshiSealPlacementsFor(
    target: Point2D,
    castIndex: number,
    phase: 1 | 2,
): ReadonlyArray<Point2D> {
    const direction = castIndex % 2 === 0 ? 1 : -1;
    const xStep = phase === 2 ? 74 : 58;
    const yStep = phase === 2 ? 86 : 96;
    return [-1, 0, 1].map((step) => ({
        x: target.x + step * xStep * direction,
        y: target.y + step * yStep,
    }));
}

export function bambooPincerGapFor(
    castIndex: number,
    phase: 1 | 2,
): BambooPincerGap {
    const centers = phase === 2 ? [-82, 82, 0] : [0, -68, 68];
    return {
        centerX: centers[Math.abs(castIndex) % centers.length],
        halfWidth: phase === 2 ? 54 : 64,
    };
}

export function isInsideBambooPincerDanger(
    position: Point2D,
    gap: BambooPincerGap,
    minY: number,
    maxY: number,
): boolean {
    if (position.y < minY || position.y > maxY) return false;
    return position.x < gap.centerX - gap.halfWidth
        || position.x > gap.centerX + gap.halfWidth;
}
