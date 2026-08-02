import type { UpgradeId } from '../assets/scripts/config/GameConfig';
import { UPGRADES } from '../assets/scripts/config/GameConfig';
import {
    previewUpgradeImpact,
    resolveRelicPulse,
    resolveCultivationBuild,
} from '../assets/scripts/systems/CultivationBuildRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

const levels: Partial<Record<UpgradeId, number>> = {};
const read = (id: UpgradeId): number => levels[id] ?? 0;
assert(resolveCultivationBuild(read).tier === 0, 'empty build should have no relic');

const edgeSeed = UPGRADES.find((choice) => choice.id === 'seed-edge');
assert(Boolean(edgeSeed), 'edge seed config should exist');
if (edgeSeed) {
    const preview = previewUpgradeImpact(edgeSeed, read);
    assert(preview.after.relic?.name === '太初剑匣', 'edge seed should equip sword relic');
    assert(preview.after.tier === 1, 'seed contribution should awaken tier one');
    assert(preview.milestone?.includes('初醒') ?? false, 'seed should announce awakening');
}

levels['seed-edge'] = 1;
const returnSword = UPGRADES.find((choice) => choice.id === 'returning-sword');
assert(Boolean(returnSword), 'returning sword config should exist');
if (returnSword) {
    const preview = previewUpgradeImpact(returnSword, read);
    assert(preview.before.pathTotal === 2 && preview.after.pathTotal === 3, 'route progress should be explicit');
    assert(preview.after.tier === 2, 'third route point should trigger resonance');
    assert(preview.milestone?.includes('共鸣') ?? false, 'tier change should be surfaced');
}

levels['returning-sword'] = 1;
levels['sword-mark'] = 1;
levels['split-sword'] = 1;
const completed = resolveCultivationBuild(read);
assert(completed.tier === 3, 'five route points should reveal true form');
assert(completed.evolutionName === '万剑归宗', 'edge true form should have a readable identity');
const pulse = resolveRelicPulse(completed);
assert(pulse?.kind === 'sword-echo' && pulse.cadence === 3, 'true-form sword relic should pulse every third volley');

console.log('CultivationBuildRuntime tests passed');
