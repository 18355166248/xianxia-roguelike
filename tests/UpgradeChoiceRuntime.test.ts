import {
    pickUpgradeChoices,
    summarizeUpgradePaths,
} from '../assets/scripts/systems/UpgradeChoiceRuntime';
import type { UpgradeId } from '../assets/scripts/config/GameConfig';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

const emptyLevel = (_id: UpgradeId): number => 0;
const opening = pickUpgradeChoices(emptyLevel, 3, () => 0);
assert(opening.length === 3, 'opening should provide three choices');
assert(new Set(opening.map((choice) => choice.path)).size === 3, 'opening should cover all three paths');
assert(opening.some((choice) => choice.id === 'dash'), 'mystic path should prioritize a locked active skill');

const cappedLevels: Partial<Record<UpgradeId, number>> = {
    sword: 3,
    damage: 3,
    haste: 3,
};
const afterEdgeCap = pickUpgradeChoices((id) => cappedLevels[id] ?? 0, 3, () => 0);
assert(afterEdgeCap.length === 3, 'depleted path should be backfilled');
assert(afterEdgeCap.every((choice) => choice.path !== 'edge'), 'capped path should not leak into choices');

const pathLevels: Partial<Record<UpgradeId, number>> = { sword: 2, dash: 1, heal: 3 };
const summary = summarizeUpgradePaths((id) => pathLevels[id] ?? 0);
assert(summary.edge === 2, 'edge summary');
assert(summary.mystic === 1, 'mystic summary');
assert(summary.vitality === 3, 'vitality summary');

console.log('UpgradeChoiceRuntime tests passed');
