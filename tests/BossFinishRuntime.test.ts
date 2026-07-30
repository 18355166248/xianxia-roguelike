import {
    bossFinishFrameFor,
    bossFinishPatternFor,
    shouldDeferUpgradeForKill,
} from '../assets/scripts/systems/BossFinishRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

const qingshi = bossFinishPatternFor('qingshi-road');
const bamboo = bossFinishPatternFor('bamboo-ambush');
const frost = bossFinishPatternFor('frozen-ruins');

assert(qingshi.kind === 'qingshi-seal' && qingshi.title === '山魈伏诛', 'qingshi finish must seal the earth vein');
assert(bamboo.kind === 'bamboo-release' && bamboo.detail === '竹心复明', 'bamboo finish must release the bamboo heart');
assert(frost.kind === 'frost-shatter' && frost.detail === '潮声俱寂', 'frost finish must silence the tide');
assert(new Set([qingshi.tone, bamboo.tone, frost.tone]).size === 3, 'three finishes need distinct stage tones');
assert(bossFinishFrameFor(0.05).column === 0, 'finish starts from the real hit frame');
assert(bossFinishFrameFor(0.24).column === 1, 'finish holds the real stagger frame');
assert(shouldDeferUpgradeForKill('boss', true), 'final boss kill must not open upgrade before the finisher');
assert(!shouldDeferUpgradeForKill('boss', false), 'non-final boss kill keeps normal progression');
assert(!shouldDeferUpgradeForKill('guardian', true), 'normal final-wave enemies keep normal progression');

console.log('BossFinishRuntime tests passed');
