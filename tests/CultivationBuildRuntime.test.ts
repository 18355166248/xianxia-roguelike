import type { UpgradeId } from '../assets/scripts/config/GameConfig';
import { UPGRADES } from '../assets/scripts/config/GameConfig';
import {
    previewUpgradeImpact,
    resolveRelicPulse,
    resolveCultivationBuild,
    resolveUpgradeMomentum,
    resolveUpgradeShowcase,
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
    const showcase = resolveUpgradeShowcase(edgeSeed, preview.after);
    assert(
        showcase.kind === 'sword-volley' && showcase.amount === 3,
        'edge awakening should immediately demonstrate three swords',
    );
    const momentum = resolveUpgradeMomentum(edgeSeed, preview.after, Boolean(preview.milestone));
    assert(
        momentum.label === '剑势正盛'
        && momentum.duration === 10
        && momentum.attackIntervalMultiplier < 1,
        'edge awakening should open a visible rapid-sword momentum window',
    );
}

levels['seed-edge'] = 1;
const awakenedPulse = resolveRelicPulse(resolveCultivationBuild(read));
assert(
    awakenedPulse?.kind === 'sword-echo' && awakenedPulse.cadence === 4,
    'first seed should immediately unlock a readable relic pulse',
);
const returnSword = UPGRADES.find((choice) => choice.id === 'returning-sword');
assert(Boolean(returnSword), 'returning sword config should exist');
if (returnSword) {
    const preview = previewUpgradeImpact(returnSword, read);
    assert(preview.before.pathTotal === 2 && preview.after.pathTotal === 3, 'route progress should be explicit');
    assert(preview.after.tier === 2, 'third route point should trigger resonance');
    assert(preview.milestone?.includes('共鸣') ?? false, 'tier change should be surfaced');
    assert(
        resolveUpgradeShowcase(returnSword, preview.after).amount === 5,
        'edge resonance should expand the free volley to five swords',
    );
}

levels['returning-sword'] = 1;
levels['sword-mark'] = 1;
levels['split-sword'] = 1;
const completed = resolveCultivationBuild(read);
assert(completed.tier === 3, 'five route points should reveal true form');
assert(completed.evolutionName === '万剑归宗', 'edge true form should have a readable identity');
const pulse = resolveRelicPulse(completed);
assert(pulse?.kind === 'sword-echo' && pulse.cadence === 3, 'true-form sword relic should pulse every third volley');
if (returnSword) {
    const trueFormShowcase = resolveUpgradeShowcase(returnSword, completed);
    assert(
        trueFormShowcase.amount === 9 && trueFormShowcase.label.includes('万剑归宗'),
        'edge true form should culminate in a named nine-sword volley',
    );
}

const mysticSeed = UPGRADES.find((choice) => choice.id === 'seed-mystic');
const vitalitySeed = UPGRADES.find((choice) => choice.id === 'seed-vitality');
const emptyRead = (_id: UpgradeId): number => 0;
if (mysticSeed) {
    const preview = previewUpgradeImpact(mysticSeed, emptyRead);
    const showcase = resolveUpgradeShowcase(mysticSeed, preview.after);
    assert(
        showcase.kind === 'thunder-chain' && showcase.amount === 4,
        'mystic awakening should immediately chain thunder across four targets',
    );
    const momentum = resolveUpgradeMomentum(mysticSeed, preview.after, true);
    assert(
        momentum.cooldownAcceleration > 0 && momentum.shieldPerSecond === 0,
        'mystic momentum should accelerate spell circulation',
    );
}
if (vitalitySeed) {
    const preview = previewUpgradeImpact(vitalitySeed, emptyRead);
    const showcase = resolveUpgradeShowcase(vitalitySeed, preview.after);
    assert(
        showcase.kind === 'shield-bloom' && showcase.shieldAmount > 0,
        'vitality awakening should immediately grant shield and retaliation',
    );
    const momentum = resolveUpgradeMomentum(vitalitySeed, preview.after, true);
    assert(
        momentum.shieldPerSecond > 0 && momentum.cooldownAcceleration === 0,
        'vitality momentum should continuously restore cultivation shield',
    );
}

if (vitalitySeed && returnSword) {
    const sidePathBuild = previewUpgradeImpact(vitalitySeed, read).after;
    const sidePathShowcase = resolveUpgradeShowcase(vitalitySeed, sidePathBuild);
    const sidePathMomentum = resolveUpgradeMomentum(vitalitySeed, sidePathBuild);
    assert(
        sidePathShowcase.tier === 1 && sidePathMomentum.tier === 1,
        'a true-form main path must not promote a newly chosen side path to tier three',
    );
}

console.log('CultivationBuildRuntime tests passed');
