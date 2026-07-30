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
    edge: '持续攻伐',
    mystic: '主动术法',
    vitality: '气血续战',
};

export type UpgradeLevelReader = (id: UpgradeId) => number;

function takeRandom<T>(values: T[], random: () => number): T | undefined {
    if (values.length === 0) return undefined;
    const index = Math.min(values.length - 1, Math.floor(Math.max(0, random()) * values.length));
    return values.splice(index, 1)[0];
}

/**
 * 破境先从锋芒、玄术、守元各发一张牌，确保每次选择都同时包含输出、操作与续航方向。
 * 同一路线内部优先未解锁的主动功法；某一路线耗尽后才用剩余卡补位。
 */
export function pickUpgradeChoices(
    getLevel: UpgradeLevelReader,
    count: number,
    random: () => number = Math.random,
): UpgradeConfig[] {
    const available = UPGRADES.filter((choice) => getLevel(choice.id) < choice.maxLevel);
    const result: UpgradeConfig[] = [];
    const activeIds: ReadonlySet<UpgradeId> = new Set(['dash', 'formation', 'tribulation', 'sword']);

    for (const path of UPGRADE_PATH_ORDER) {
        if (result.length >= count) break;
        const pathChoices = available.filter((choice) => choice.path === path);
        const lockedActives = pathChoices.filter(
            (choice) => activeIds.has(choice.id) && getLevel(choice.id) === 0,
        );
        const choice = takeRandom(lockedActives.length > 0 ? lockedActives : pathChoices, random);
        if (!choice) continue;
        result.push(choice);
        available.splice(available.indexOf(choice), 1);
    }

    while (result.length < count && available.length > 0) {
        const choice = takeRandom(available, random);
        if (choice) result.push(choice);
    }
    return result;
}

export function summarizeUpgradePaths(
    getLevel: UpgradeLevelReader,
): Readonly<Record<UpgradePath, number>> {
    const totals: Record<UpgradePath, number> = { edge: 0, mystic: 0, vitality: 0 };
    for (const choice of UPGRADES) totals[choice.path] += getLevel(choice.id);
    return totals;
}
