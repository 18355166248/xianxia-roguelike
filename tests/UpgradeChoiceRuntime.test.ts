import {
    choiceBuildProgress,
    cultivationSeedPath,
    pickBossCultivationChoices,
    pickUpgradeChoices,
    summarizeUpgradePaths,
    unlockedFormationChoices,
    upgradeRarityPresentation,
} from '../assets/scripts/systems/UpgradeChoiceRuntime';
import type { UpgradeId } from '../assets/scripts/config/GameConfig';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

const emptyLevel = (_id: UpgradeId): number => 0;
const opening = pickUpgradeChoices(emptyLevel, 3, () => 0);
assert(opening.length === 3, 'opening should provide three seeds');
assert(opening.every((choice) => choice.offerKind === 'seed'), 'opening should contain seeds only');
assert(new Set(opening.map((choice) => choice.path)).size === 3, 'opening should cover all three paths');

const edgeSeed: Partial<Record<UpgradeId, number>> = { 'seed-edge': 1 };
assert(cultivationSeedPath((id) => edgeSeed[id] ?? 0) === 'edge', 'edge seed should set main path');
const afterSeed = pickUpgradeChoices((id) => edgeSeed[id] ?? 0, 3, () => 0);
assert(afterSeed.length === 3, 'regular breakthrough should provide three choices');
assert(afterSeed.some((choice) => choice.path === 'edge' && choice.offerKind === 'regular'), 'deepen slot');
assert(afterSeed.some((choice) => choice.path !== 'edge' && choice.offerKind === 'regular'), 'link slot');
assert(afterSeed.some((choice) => choice.offerKind === 'common'), 'breakout slot');

const buildLevels: Partial<Record<UpgradeId, number>> = {
    'seed-edge': 1,
    'returning-sword': 1,
    'seed-mystic': 1,
};
const summary = summarizeUpgradePaths((id) => buildLevels[id] ?? 0);
assert(summary.edge === 3, 'seed should contribute two and edge card one');
assert(summary.mystic === 2, 'mystic seed should contribute two');
assert(summary.vitality === 0, 'unused vitality path');

const formations = unlockedFormationChoices((id) => buildLevels[id] ?? 0);
assert(formations.some((choice) => choice.id === 'thunder-swords'), '3+2 should unlock thunder swords');
const bossChoices = pickBossCultivationChoices((id) => buildLevels[id] ?? 0, 2);
assert(bossChoices.length === 2, 'boss cultivation should always present two formations');
assert(bossChoices.some((choice) => choice.id === 'thunder-swords'), 'eligible synergy should be prioritized');

const returning = afterSeed.find((choice) => choice.id === 'returning-sword');
assert(Boolean(returning), 'deterministic deepen choice should be returning sword');
if (returning) {
    const progress = choiceBuildProgress(returning, (id) => edgeSeed[id] ?? 0);
    assert(progress.current === 2 && progress.next === 3, 'card should show route progress');
    assert(progress.milestone?.includes('剑痕') ?? false, '3 edge should announce sword-mark resonance');
    assert(
        upgradeRarityPresentation(returning, true).rarity === 'earth',
        'a choice that crosses resonance should be presented as a breakthrough rarity',
    );
    assert(
        upgradeRarityPresentation(returning, false, true).stars === 3,
        'refining should raise the next choice presentation by one rarity step',
    );
}

console.log('UpgradeChoiceRuntime tests passed');
