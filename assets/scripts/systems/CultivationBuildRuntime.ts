import {
    type UpgradeConfig,
    type UpgradeId,
    type UpgradePath,
} from '../config/GameConfig';
import {
    summarizeUpgradePaths,
    UPGRADE_PATH_LABELS,
    UPGRADE_PATH_ORDER,
    type UpgradeLevelReader,
} from './UpgradeChoiceRuntime';

export type RelicTier = 0 | 1 | 2 | 3;

export interface CultivationRelicDefinition {
    path: UpgradePath;
    name: string;
    title: string;
    iconResourcePath: string;
    tierNames: readonly [string, string, string];
    evolutionNames: readonly [string, string, string];
}

export interface CultivationBuildSnapshot {
    path?: UpgradePath;
    pathTotal: number;
    pathTotals: Readonly<Record<UpgradePath, number>>;
    total: number;
    tier: RelicTier;
    relic?: CultivationRelicDefinition;
    tierName: string;
    evolutionName: string;
    resonanceText: string;
    nextText: string;
}

export interface UpgradeImpactPreview {
    before: CultivationBuildSnapshot;
    after: CultivationBuildSnapshot;
    headline: string;
    detail: string;
    milestone?: string;
}

export interface RelicPulseSpec {
    kind: 'sword-echo' | 'thunder-brand' | 'shield-bloom';
    cadence: number;
    label: string;
    magnitude: number;
}

export type UpgradeShowcaseKind = 'sword-volley' | 'thunder-chain' | 'shield-bloom';

export interface UpgradeShowcaseSpec {
    kind: UpgradeShowcaseKind;
    label: string;
    tier: RelicTier;
    amount: number;
    radius: number;
    damageMultiplier: number;
    shieldAmount: number;
}

export interface UpgradeMomentumSpec {
    path: UpgradePath;
    label: string;
    tier: RelicTier;
    duration: number;
    damageMultiplier: number;
    attackIntervalMultiplier: number;
    cooldownAcceleration: number;
    shieldPerSecond: number;
}

export interface BossReadinessPresentation {
    grade: 'forming' | 'awakened' | 'resonant' | 'true-form';
    title: string;
    detail: string;
}

export const CULTIVATION_RELICS: Readonly<Record<UpgradePath, CultivationRelicDefinition>> = {
    edge: {
        path: 'edge',
        name: '太初剑匣',
        title: '本命法宝 · 御剑',
        iconResourcePath: 'art/relics/xianxia-relics_00/spriteFrame',
        tierNames: ['初醒', '共鸣', '真形'],
        evolutionNames: ['剑气随身', '回锋成潮', '万剑归宗'],
    },
    mystic: {
        path: 'mystic',
        name: '九霄雷篆',
        title: '本命法宝 · 引雷',
        iconResourcePath: 'art/relics/xianxia-relics_11/spriteFrame',
        tierNames: ['初醒', '共鸣', '真形'],
        evolutionNames: ['雷印显化', '术剑相引', '九霄劫阵'],
    },
    vitality: {
        path: 'vitality',
        name: '青木剑心',
        title: '本命法宝 · 护生',
        iconResourcePath: 'art/relics/xianxia-relics_19/spriteFrame',
        tierNames: ['初醒', '共鸣', '真形'],
        evolutionNames: ['生息护体', '破盾还锋', '不灭剑体'],
    },
};

/**
 * 法宝不再是需要单独理解的元系统，它就是角色身上那层光效的强度：
 * 某一系每修一级，本命法宝就更亮一分。一局约五次破境，1/3/5 让真形刚好够得着。
 */
function relicTier(total: number): RelicTier {
    if (total >= 5) return 3;
    if (total >= 3) return 2;
    if (total >= 1) return 1;
    return 0;
}

export function resolveCultivationBuild(getLevel: UpgradeLevelReader): CultivationBuildSnapshot {
    const totals = summarizeUpgradePaths(getLevel);
    const total = UPGRADE_PATH_ORDER.reduce((sum, path) => sum + totals[path], 0);
    if (total <= 0) {
        return {
            pathTotal: 0,
            pathTotals: totals,
            total: 0,
            tier: 0,
            tierName: '未觉醒',
            evolutionName: '待择本命法宝',
            resonanceText: '破境后显化',
            nextText: '破境修行以觉醒法宝',
        };
    }
    const path = UPGRADE_PATH_ORDER.reduce((best, current) => (
        totals[current] > totals[best] ? current : best
    ), UPGRADE_PATH_ORDER[0]);
    const pathTotal = totals[path];
    const tier = relicTier(pathTotal);
    const relic = CULTIVATION_RELICS[path];
    const index = Math.max(0, tier - 1);
    const nextText = tier < 2
        ? `再修 ${3 - pathTotal} 级，法宝共鸣`
        : tier < 3
            ? `再修 ${5 - pathTotal} 级，显化真形`
            : '真形已成 · 光华圆满';
    return {
        path,
        pathTotal,
        pathTotals: totals,
        total,
        tier,
        relic,
        tierName: tier > 0 ? relic.tierNames[index] : '未觉醒',
        evolutionName: tier > 0 ? relic.evolutionNames[index] : '待觉醒',
        resonanceText: `${UPGRADE_PATH_LABELS[path]} ${pathTotal}级 · ${tier > 0 ? relic.tierNames[index] : '未觉醒'}`,
        nextText,
    };
}

export function previewUpgradeImpact(
    choice: UpgradeConfig,
    getLevel: UpgradeLevelReader,
): UpgradeImpactPreview {
    const before = resolveCultivationBuild(getLevel);
    const afterLevel = Math.min(choice.maxLevel, getLevel(choice.id) + 1);
    const after = resolveCultivationBuild((id: UpgradeId) => (
        id === choice.id ? afterLevel : getLevel(id)
    ));
    // 满级即质变，是这套精简牌池里唯一需要预告的"里程碑"；法宝升阶次之。
    const milestone = afterLevel >= choice.maxLevel
        ? `${choice.title} 圆满`
        : before.tier !== after.tier && after.relic
            ? `${after.relic.name} · ${after.tierName}`
            : undefined;
    const headline = `${choice.title} Lv${afterLevel}`;
    const detail = choice.descriptions[Math.max(0, afterLevel - 1)] ?? '';
    return { before, after, headline, detail, milestone };
}

/** 战斗中的升级记录只保留“哪项升到了几级”，具体效果由紧随其后的战场显化直接证明。 */
export function describeUpgradeDelta(impact: UpgradeImpactPreview): string {
    return impact.headline;
}

/**
 * 关底前只评价玩家已经形成的构筑，不以隐藏战力给出“强/弱”结论；
 * 阶段文案同时指出下一步战斗策略，让构筑检验成为可执行提示而非单纯评分。
 */
export function resolveBossReadiness(
    build: CultivationBuildSnapshot,
    hpRatio: number,
): BossReadinessPresentation {
    const survival = hpRatio < 0.45 ? '气血偏低 · 先避首轮' : '气血稳固';
    if (build.tier >= 3) {
        return {
            grade: 'true-form',
            title: `${build.evolutionName} · 真形应劫`,
            detail: `构筑完成 · ${survival}`,
        };
    }
    if (build.tier >= 2) {
        return {
            grade: 'resonant',
            title: `${build.evolutionName} · 共鸣应劫`,
            detail: `法宝共鸣 · ${survival}`,
        };
    }
    if (build.tier >= 1) {
        return {
            grade: 'awakened',
            title: `${build.relic?.name ?? '本命法宝'} · 初醒`,
            detail: `尚未共鸣 · ${survival}`,
        };
    }
    return {
        grade: 'forming',
        title: '道基未成 · 以身法应劫',
        detail: `依赖基础御剑 · ${survival}`,
    };
}

/** 共鸣后的本命法宝会周期性介入普攻，让路线成长改变战斗节奏而不增加新按钮。 */
export function resolveRelicPulse(build: CultivationBuildSnapshot): RelicPulseSpec | undefined {
    if (!build.path || build.tier < 1) return undefined;
    const cadence = build.tier >= 3 ? 3 : 4;
    if (build.path === 'edge') {
        return { kind: 'sword-echo', cadence, label: '剑匣共鸣 · 追锋', magnitude: build.tier >= 3 ? 2 : 1 };
    }
    if (build.path === 'mystic') {
        return { kind: 'thunder-brand', cadence, label: '雷篆共鸣 · 引雷', magnitude: build.tier >= 3 ? 0.62 : 0.38 };
    }
    return { kind: 'shield-bloom', cadence, label: '青木共鸣 · 生息', magnitude: build.tier >= 3 ? 9 : 5 };
}

/**
 * 选卡后的第一拍必须直接兑现到战场，且不消耗常规功法冷却。
 * 2/3/5 重分别对应初醒、共鸣、真形，数量与范围同步跃迁，避免进化只停留在面板数字上。
 */
export function resolveUpgradeShowcase(
    choice: UpgradeConfig,
    build: CultivationBuildSnapshot,
): UpgradeShowcaseSpec {
    // 混修时只读取本次路线自己的重数，不能让满阶主修把旁系的一重选择错误放大为真形爆发。
    const tier = Math.max(1, relicTier(build.pathTotals[choice.path])) as RelicTier;
    const evolution = build.path === choice.path && build.relic
        ? build.evolutionName
        : choice.title;
    if (choice.path === 'edge') {
        const amount = tier >= 3 ? 9 : tier >= 2 ? 5 : 3;
        return {
            kind: 'sword-volley',
            label: `${evolution} · 万剑齐发`,
            tier,
            amount,
            radius: 108 + tier * 18,
            damageMultiplier: tier >= 3 ? 0.92 : tier >= 2 ? 0.78 : 0.66,
            shieldAmount: 0,
        };
    }
    if (choice.path === 'mystic') {
        return {
            kind: 'thunder-chain',
            label: `${evolution} · 天雷显化`,
            tier,
            amount: tier >= 3 ? 7 : tier >= 2 ? 5 : 4,
            radius: 92 + tier * 14,
            damageMultiplier: tier >= 3 ? 0.82 : tier >= 2 ? 0.68 : 0.55,
            shieldAmount: 0,
        };
    }
    return {
        kind: 'shield-bloom',
        label: `${evolution} · 护体反震`,
        tier,
        amount: 4 + tier * 2,
        radius: 118 + tier * 22,
        damageMultiplier: tier >= 3 ? 0.86 : tier >= 2 ? 0.7 : 0.52,
        shieldAmount: 12 + tier * 8,
    };
}

/**
 * 免费显化负责升级后的第一拍，破境余势负责随后数秒的可玩变化。
 * 三条路线分别强化御剑频率、功法周转与护体续航，避免所有升级都退化成同一种伤害加成。
 */
export function resolveUpgradeMomentum(
    choice: UpgradeConfig,
    build: CultivationBuildSnapshot,
    milestone = false,
): UpgradeMomentumSpec {
    const tier = Math.max(1, relicTier(build.pathTotals[choice.path])) as RelicTier;
    const duration = 6 + tier * 2 + (milestone ? 2 : 0);
    if (choice.path === 'edge') {
        return {
            path: choice.path,
            label: '剑势正盛',
            tier,
            duration,
            damageMultiplier: 1.06 + tier * 0.04,
            attackIntervalMultiplier: 0.88 - tier * 0.06,
            cooldownAcceleration: 0,
            shieldPerSecond: 0,
        };
    }
    if (choice.path === 'mystic') {
        return {
            path: choice.path,
            label: '雷法贯通',
            tier,
            duration,
            damageMultiplier: 1.08 + tier * 0.06,
            attackIntervalMultiplier: 0.94,
            cooldownAcceleration: 0.25 + tier * 0.2,
            shieldPerSecond: 0,
        };
    }
    return {
        path: choice.path,
        label: '青木回春',
        tier,
        duration,
        damageMultiplier: 1.04 + tier * 0.035,
        attackIntervalMultiplier: 0.96,
        cooldownAcceleration: 0,
        shieldPerSecond: 2 + tier * 2,
    };
}
