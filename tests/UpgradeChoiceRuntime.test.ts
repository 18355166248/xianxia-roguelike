import {
    pickUpgradeChoices,
    summarizeUpgradePaths,
    UPGRADE_PATH_ORDER,
} from '../assets/scripts/systems/UpgradeChoiceRuntime';
import { UPGRADES, type UpgradeId } from '../assets/scripts/config/GameConfig';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

const read = (levels: Partial<Record<UpgradeId, number>>) => (id: UpgradeId) => levels[id] ?? 0;

assert(UPGRADES.length === 9, 'the casual pool is nine cultivation arts, no more');
assert(
    UPGRADES.every((choice) => choice.maxLevel === 3 && choice.descriptions.length === 3),
    'every art must be a three-step progression with one line of copy per level',
);
for (const path of UPGRADE_PATH_ORDER) {
    assert(
        UPGRADES.filter((choice) => choice.path === path).length === 3,
        `${path} must contribute exactly three arts so every draft can offer one per path`,
    );
}

const fresh = pickUpgradeChoices(read({}), 3, () => 0.5);
assert(fresh.length === 3, 'a draft always fills three slots');
assert(
    new Set(fresh.map((choice) => choice.path)).size === 3,
    'a fresh draft offers one art per path so the choice reads as attack / skill / survival',
);

// 锋芒三张全部修满后，该槽位必须由仍能成长的道法补上，而不是留空。
const afterEdge = pickUpgradeChoices(read({ sword: 3, damage: 3, haste: 3 }), 3, () => 0.5);
assert(afterEdge.length === 3, 'a maxed path must not shrink the draft');
assert(
    afterEdge.every((choice) => choice.path !== 'edge'),
    'a fully maxed path should stop being offered',
);
assert(
    new Set(afterEdge.map((choice) => choice.id)).size === 3,
    'a draft never repeats the same art twice',
);

const last = pickUpgradeChoices(read({
    sword: 3, damage: 3, haste: 3,
    dash: 3, formation: 3, tribulation: 3,
    guard: 3, heal: 3,
}), 3, () => 0.5);
assert(last.length === 1 && last[0].id === 'endless-life', 'only genuinely upgradable arts are offered');
assert(
    pickUpgradeChoices(read({
        sword: 3, damage: 3, haste: 3,
        dash: 3, formation: 3, tribulation: 3,
        guard: 3, heal: 3, 'endless-life': 3,
    }), 3, () => 0.5).length === 0,
    'a fully completed build offers nothing rather than repeating maxed arts',
);

const totals = summarizeUpgradePaths(read({ sword: 3, damage: 1, dash: 2 }));
assert(totals.edge === 4, 'path progress is simply the sum of levels held in that path');
assert(totals.mystic === 2 && totals.vitality === 0, 'untouched paths stay at zero');
assert(
    summarizeUpgradePaths(read({ sword: 99 })).edge === 3,
    'path progress must clamp to the maximum level rather than trust bad input',
);

console.log('UpgradeChoiceRuntime tests passed');
