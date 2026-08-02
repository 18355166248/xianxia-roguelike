import {
    type UpgradeConfig,
    type UpgradeId,
    type UpgradePath,
    UPGRADES,
} from '../config/GameConfig';

export const UPGRADE_PATH_ORDER: readonly UpgradePath[] = ['edge', 'mystic', 'vitality'];

export const UPGRADE_PATH_LABELS: Readonly<Record<UpgradePath, string>> = {
    edge: '锋芒',
    mystic: '玄术',
    vitality: '守元',
};

export const UPGRADE_PATH_DESCRIPTIONS: Readonly<Record<UpgradePath, string>> = {
    edge: '飞剑追击',
    mystic: '功法循环',
    vitality: '护体续战',
};

export const CULTIVATION_SEED_IDS: Readonly<Record<UpgradePath, UpgradeId>> = {
    edge: 'seed-edge',
    mystic: 'seed-mystic',
    vitality: 'seed-vitality',
};

export type UpgradeLevelReader = (id: UpgradeId) => number;

function takeRandom<T>(values: readonly T[], random: () => number): T | undefined {
    if (values.length === 0) return undefined;
    const index = Math.min(values.length - 1, Math.floor(Math.max(0, random()) * values.length));
    return values[index];
}

function availableChoices(getLevel: UpgradeLevelReader, kinds: ReadonlySet<string>): UpgradeConfig[] {
    return UPGRADES.filter((choice) => (
        kinds.has(choice.offerKind ?? 'hidden')
        && getLevel(choice.id) < choice.maxLevel
    ));
}

export function cultivationSeedPath(getLevel: UpgradeLevelReader): UpgradePath | undefined {
    return UPGRADE_PATH_ORDER.find((path) => getLevel(CULTIVATION_SEED_IDS[path]) > 0);
}

export function summarizeUpgradePaths(
    getLevel: UpgradeLevelReader,
): Readonly<Record<UpgradePath, number>> {
    const totals: Record<UpgradePath, number> = { edge: 0, mystic: 0, vitality: 0 };
    for (const choice of UPGRADES) {
        totals[choice.path] += getLevel(choice.id) * (choice.routeContribution ?? 0);
    }
    return totals;
}

function synergyEligible(choice: UpgradeConfig, totals: Readonly<Record<UpgradePath, number>>): boolean {
    if (choice.id === 'thunder-swords') return totals.edge >= 3 && totals.mystic >= 2;
    if (choice.id === 'blood-sword-return') return totals.edge >= 3 && totals.vitality >= 2;
    if (choice.id === 'heavenly-cycle') return totals.mystic >= 3 && totals.vitality >= 2;
    return false;
}

function ultimateEligible(choice: UpgradeConfig, totals: Readonly<Record<UpgradePath, number>>): boolean {
    if (choice.id === 'myriad-swords') return totals.edge >= 5;
    if (choice.id === 'ninefold-tribulation') return totals.mystic >= 5;
    if (choice.id === 'undying-sword-body') return totals.vitality >= 5;
    return false;
}

export function unlockedFormationChoices(getLevel: UpgradeLevelReader): UpgradeConfig[] {
    const totals = summarizeUpgradePaths(getLevel);
    return UPGRADES.filter((choice) => (
        getLevel(choice.id) < choice.maxLevel
        && (
            (choice.offerKind === 'synergy' && synergyEligible(choice, totals))
            || (choice.offerKind === 'ultimate' && ultimateEligible(choice, totals))
        )
    ));
}

function pushUnique(result: UpgradeConfig[], choice: UpgradeConfig | undefined): void {
    if (choice && !result.some((current) => current.id === choice.id)) result.push(choice);
}

/**
 * 第一次破境固定三道种。之后三槽分别服务于“深化当前主修、推进跨路联动、补足短板”，
 * 不再按固定路径顺序截断候选，避免二选一时守元永远进不了牌池。
 */
export function pickUpgradeChoices(
    getLevel: UpgradeLevelReader,
    count: number,
    random: () => number = Math.random,
): UpgradeConfig[] {
    const seedPath = cultivationSeedPath(getLevel);
    if (!seedPath) {
        return UPGRADE_PATH_ORDER
            .map((path) => UPGRADES.find((choice) => choice.id === CULTIVATION_SEED_IDS[path]))
            .filter((choice): choice is UpgradeConfig => Boolean(choice))
            .slice(0, count);
    }

    const result: UpgradeConfig[] = [];
    const regular = availableChoices(getLevel, new Set(['regular']));
    const commons = availableChoices(getLevel, new Set(['common']));
    const formations = unlockedFormationChoices(getLevel);

    // 深化：保证当前道种至少有一张可继续追求的牌。
    pushUnique(result, takeRandom(regular.filter((choice) => choice.path === seedPath), random));

    // 联动：前置一旦满足就优先展示，否则给一张非主修路线，让双修目标可达。
    pushUnique(result, takeRandom(formations, random));
    if (result.length < 2) {
        const offPath = regular.filter((choice) => choice.path !== seedPath);
        const leastRepresentedPath = UPGRADE_PATH_ORDER
            .filter((path) => path !== seedPath)
            .sort((a, b) => summarizeUpgradePaths(getLevel)[a] - summarizeUpgradePaths(getLevel)[b])[0];
        pushUnique(result, takeRandom(
            offPath.filter((choice) => choice.path === leastRepresentedPath),
            random,
        ));
        if (result.length < 2) pushUnique(result, takeRandom(offPath, random));
    }

    // 破局：优先通用能力；耗尽后从尚未出现的任意路线补位。
    pushUnique(result, takeRandom(commons, random));
    const remaining = [...formations, ...regular, ...commons]
        .filter((choice) => !result.some((current) => current.id === choice.id));
    while (result.length < count && remaining.length > 0) {
        const choice = takeRandom(remaining, random);
        pushUnique(result, choice);
        if (choice) remaining.splice(remaining.indexOf(choice), 1);
    }
    return result.slice(0, count);
}

/** 关底前只提供已经满足前置的天机/真诀；不足两张时用主修真诀补足预告位。 */
export function pickBossCultivationChoices(
    getLevel: UpgradeLevelReader,
    count = 2,
): UpgradeConfig[] {
    const totals = summarizeUpgradePaths(getLevel);
    const unlocked = unlockedFormationChoices(getLevel);
    const dominant = UPGRADE_PATH_ORDER.reduce((best, path) => (
        totals[path] > totals[best] ? path : best
    ), UPGRADE_PATH_ORDER[0]);
    const fallback = UPGRADES.filter((choice) => (
        choice.offerKind === 'ultimate'
        && choice.path === dominant
        && getLevel(choice.id) < choice.maxLevel
    ));
    const otherFormations = UPGRADES.filter((choice) => (
        (choice.offerKind === 'ultimate' || choice.offerKind === 'synergy')
        && getLevel(choice.id) < choice.maxLevel
    ));
    const result: UpgradeConfig[] = [];
    [...unlocked, ...fallback, ...otherFormations].forEach((choice) => pushUnique(result, choice));
    return result.slice(0, count);
}

export function choiceBuildProgress(
    choice: UpgradeConfig,
    getLevel: UpgradeLevelReader,
): { current: number; next: number; milestone?: string; future: string } {
    const totals = summarizeUpgradePaths(getLevel);
    const contribution = choice.routeContribution ?? 0;
    const current = totals[choice.path];
    const next = current + contribution;
    const milestone = current < 3 && next >= 3
        ? choice.path === 'edge'
            ? '将激活「剑痕」'
            : choice.path === 'mystic'
                ? '将激活「劫力」'
                : '将激活「护体」'
        : current < 5 && next >= 5
            ? '将开启关底真诀'
            : choice.offerKind === 'synergy' || choice.offerKind === 'ultimate'
                ? '此选成诀'
                : undefined;
    const future = choice.path === 'edge'
        ? `下一成形：万剑归宗 · ${Math.max(0, 5 - next)}重锋芒`
        : choice.path === 'mystic'
            ? `下一成形：九霄劫阵 · ${Math.max(0, 5 - next)}重玄术`
            : `下一成形：不灭剑体 · ${Math.max(0, 5 - next)}重守元`;
    return { current, next, milestone, future };
}
