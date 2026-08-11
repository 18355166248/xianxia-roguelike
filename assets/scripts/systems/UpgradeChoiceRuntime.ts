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

export type UpgradeLevelReader = (id: UpgradeId) => number;

/**
 * 道法只有九张、每张三级，进度就是各系已修等级之和，不再需要单独的路线权重。
 */
export function summarizeUpgradePaths(
    getLevel: UpgradeLevelReader,
): Readonly<Record<UpgradePath, number>> {
    const totals: Record<UpgradePath, number> = { edge: 0, mystic: 0, vitality: 0 };
    for (const choice of UPGRADES) {
        totals[choice.path] += Math.min(choice.maxLevel, Math.max(0, getLevel(choice.id)));
    }
    return totals;
}

function upgradableIn(path: UpgradePath, getLevel: UpgradeLevelReader): UpgradeConfig[] {
    return UPGRADES.filter((choice) => choice.path === path && getLevel(choice.id) < choice.maxLevel);
}

function takeRandom<T>(values: readonly T[], random: () => number): T | undefined {
    if (values.length === 0) return undefined;
    const index = Math.min(values.length - 1, Math.floor(Math.max(0, random()) * values.length));
    return values[index];
}

/**
 * 每次破境固定给"锋芒 / 玄术 / 守元各一张"，玩家不需要理解任何分类或前置，
 * 一眼就能判断这次是要打得更狠、多个主动手段，还是活得更久。
 * 某一系全部满级后，该槽位由仍可成长的其他系补上，绝不出现空槽。
 */
export function pickUpgradeChoices(
    getLevel: UpgradeLevelReader,
    count: number,
    random: () => number = Math.random,
): UpgradeConfig[] {
    const result: UpgradeConfig[] = [];
    for (const path of UPGRADE_PATH_ORDER) {
        const choice = takeRandom(upgradableIn(path, getLevel), random);
        if (choice) result.push(choice);
    }
    if (result.length < count) {
        const fill = UPGRADES.filter((choice) => (
            getLevel(choice.id) < choice.maxLevel
            && !result.some((current) => current.id === choice.id)
        ));
        while (result.length < count && fill.length > 0) {
            const choice = takeRandom(fill, random);
            if (!choice) break;
            fill.splice(fill.indexOf(choice), 1);
            result.push(choice);
        }
    }
    return result.slice(0, count);
}
