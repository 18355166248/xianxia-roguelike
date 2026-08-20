import type { UpgradeId } from '../assets/scripts/config/GameConfig';
import { UPGRADES } from '../assets/scripts/config/GameConfig';
import {
    describeUpgradeDelta,
    previewUpgradeImpact,
    resolveRelicPulse,
    resolveCultivationBuild,
    resolveBossReadiness,
    resolveUpgradeMomentum,
    resolveUpgradeShowcase,
} from '../assets/scripts/systems/CultivationBuildRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

const art = (id: UpgradeId) => {
    const found = UPGRADES.find((choice) => choice.id === id);
    if (!found) throw new Error(`missing cultivation art: ${id}`);
    return found;
};
const read = (levels: Partial<Record<UpgradeId, number>>) => (id: UpgradeId): number => levels[id] ?? 0;

const empty = read({});
assert(resolveCultivationBuild(empty).tier === 0, 'an empty build has no relic yet');
assert(
    resolveBossReadiness(resolveCultivationBuild(empty), 0.4).detail.includes('先避首轮'),
    'boss readiness should turn low health into an actionable opening instruction',
);
assert(
    resolveRelicPulse(resolveCultivationBuild(empty)) === undefined,
    'no relic means no pulse',
);

// 第一级就点亮法宝：光效从第一次破境起就长在角色身上，而不是攒够重数才出现。
const firstSword = previewUpgradeImpact(art('sword'), empty);
assert(firstSword.after.tier === 1, 'the very first level should awaken the relic');
assert(firstSword.after.relic?.name === '太初剑匣', 'edge arts equip the sword relic');
assert(firstSword.headline === '御剑诀 Lv1', 'the card headline states the art and the level it reaches');
assert(
    firstSword.detail === art('sword').descriptions[0],
    'the detail line is simply that level of the card copy, with no extra vocabulary',
);
assert(
    describeUpgradeDelta(firstSword) === '御剑诀 Lv1',
    'the persistent upgrade record stays to one direct name-and-level line',
);

// 满级是这套牌池里唯一需要预告的里程碑。
const swordToMax = previewUpgradeImpact(art('sword'), read({ sword: 2 }));
assert(swordToMax.milestone === '御剑诀 圆满', 'reaching max level must be announced as the milestone');
assert(
    previewUpgradeImpact(art('sword'), read({ sword: 0 })).milestone !== '御剑诀 圆满',
    'a first level is not a completion milestone',
);

const edgeThree = read({ sword: 2, damage: 1 });
assert(resolveCultivationBuild(edgeThree).tier === 2, 'three levels in one path resonate the relic');
const edgeFive = read({ sword: 3, damage: 2 });
const completed = resolveCultivationBuild(edgeFive);
assert(completed.tier === 3, 'five levels in one path reveal the relic true form');
assert(completed.evolutionName === '万剑归宗', 'edge true form keeps a readable identity');
assert(
    resolveBossReadiness(completed, 0.8).grade === 'true-form',
    'a completed path should enter the boss fight as a named true form',
);

const pulse = resolveRelicPulse(completed);
assert(pulse?.kind === 'sword-echo' && pulse.cadence === 3, 'true-form sword relic pulses every third volley');
assert(
    resolveRelicPulse(resolveCultivationBuild(read({ sword: 1 })))?.cadence === 4,
    'an awakened relic already pulses, just more slowly',
);

assert(
    resolveUpgradeShowcase(art('sword'), resolveCultivationBuild(read({ sword: 1 }))).amount === 3,
    'edge awakening immediately demonstrates three swords',
);
assert(
    resolveUpgradeShowcase(art('sword'), completed).amount === 9,
    'edge true form culminates in a nine-sword volley',
);
assert(
    resolveUpgradeShowcase(art('formation'), resolveCultivationBuild(read({ formation: 1 }))).kind === 'thunder-chain',
    'mystic arts demonstrate as a thunder chain',
);
assert(
    resolveUpgradeShowcase(art('guard'), resolveCultivationBuild(read({ guard: 1 }))).shieldAmount > 0,
    'vitality arts demonstrate as shield and retaliation',
);

// 混修时旁系不能借用主修的阶数。
const sidePathBuild = previewUpgradeImpact(art('guard'), edgeFive).after;
assert(
    resolveUpgradeShowcase(art('guard'), sidePathBuild).tier === 1
    && resolveUpgradeMomentum(art('guard'), sidePathBuild).tier === 1,
    'a true-form main path must not promote a freshly chosen side path to tier three',
);

const edgeMomentum = resolveUpgradeMomentum(art('sword'), firstSword.after, Boolean(firstSword.milestone));
assert(
    edgeMomentum.label === '剑势正盛' && edgeMomentum.attackIntervalMultiplier < 1,
    'edge momentum opens a visible rapid-sword window',
);
assert(
    resolveUpgradeMomentum(art('formation'), resolveCultivationBuild(read({ formation: 1 }))).cooldownAcceleration > 0,
    'mystic momentum accelerates spell circulation',
);
assert(
    resolveUpgradeMomentum(art('guard'), resolveCultivationBuild(read({ guard: 1 }))).shieldPerSecond > 0,
    'vitality momentum continuously restores cultivation shield',
);

console.log('CultivationBuildRuntime tests passed');
