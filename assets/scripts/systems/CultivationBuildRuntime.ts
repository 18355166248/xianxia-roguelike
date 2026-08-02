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

function relicTier(total: number): RelicTier {
    if (total >= 5) return 3;
    if (total >= 3) return 2;
    if (total >= 2) return 1;
    return 0;
}

export function resolveCultivationBuild(getLevel: UpgradeLevelReader): CultivationBuildSnapshot {
    const totals = summarizeUpgradePaths(getLevel);
    const total = UPGRADE_PATH_ORDER.reduce((sum, path) => sum + totals[path], 0);
    if (total <= 0) {
        return {
            pathTotal: 0,
            total: 0,
            tier: 0,
            tierName: '未觉醒',
            evolutionName: '待择本命法宝',
            resonanceText: '破境后显化',
            nextText: '选择道种以觉醒法宝',
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
        ? `再修 ${3 - pathTotal} 重，共鸣进化`
        : tier < 3
            ? `再修 ${5 - pathTotal} 重，显化真形`
            : '真形已成 · 流派核心生效';
    return {
        path,
        pathTotal,
        total,
        tier,
        relic,
        tierName: tier > 0 ? relic.tierNames[index] : '未觉醒',
        evolutionName: tier > 0 ? relic.evolutionNames[index] : '待觉醒',
        resonanceText: `${UPGRADE_PATH_LABELS[path]} ${pathTotal}重 · ${tier > 0 ? relic.tierNames[index] : '未觉醒'}`,
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
    const changedRelic = before.tier !== after.tier || before.path !== after.path;
    const milestone = changedRelic && after.relic
        ? `${after.relic.name} · ${after.tierName}`
        : choice.offerKind === 'synergy'
            ? '双脉共鸣已接通'
            : choice.offerKind === 'ultimate'
                ? '真诀已刻入本命法宝'
                : undefined;
    const headline = choice.offerKind === 'seed'
        ? `装备 ${after.relic?.name ?? choice.title}`
        : `${choice.title} · ${UPGRADE_PATH_LABELS[choice.path]} +${choice.routeContribution ?? 0}重`;
    const detail = after.path === choice.path && after.pathTotal !== before.pathTotal
        ? `${UPGRADE_PATH_LABELS[choice.path]} ${before.pathTotal}重 → ${after.pathTotal}重 · ${after.nextText}`
        : choice.combatRead ?? choice.descriptions[Math.max(0, afterLevel - 1)] ?? '';
    return { before, after, headline, detail, milestone };
}

/** 共鸣后的本命法宝会周期性介入普攻，让路线成长改变战斗节奏而不增加新按钮。 */
export function resolveRelicPulse(build: CultivationBuildSnapshot): RelicPulseSpec | undefined {
    if (!build.path || build.tier < 2) return undefined;
    const cadence = build.tier >= 3 ? 3 : 4;
    if (build.path === 'edge') {
        return { kind: 'sword-echo', cadence, label: '剑匣共鸣 · 追锋', magnitude: build.tier >= 3 ? 2 : 1 };
    }
    if (build.path === 'mystic') {
        return { kind: 'thunder-brand', cadence, label: '雷篆共鸣 · 引雷', magnitude: build.tier >= 3 ? 0.62 : 0.38 };
    }
    return { kind: 'shield-bloom', cadence, label: '青木共鸣 · 生息', magnitude: build.tier >= 3 ? 9 : 5 };
}
