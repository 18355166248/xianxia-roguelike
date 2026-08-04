import {
    formatFirstClearReward,
    formatStageRecord,
    StageProgressRuntime,
} from '../assets/scripts/systems/StageProgressRuntime';

function assertEqual<T>(actual: T, expected: T, message: string): void {
    if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
}

const progress = new StageProgressRuntime();
assertEqual(
    formatFirstClearReward('qingshi-road', false),
    '首破可得  ·  青石剑印  ·  御剑伤害 +2',
    'uncleared stage should preview its first-clear reward',
);
assertEqual(
    formatStageRecord(progress.recordFor('qingshi-road')),
    '尚未通关  ·  通关后留下道印',
    'new stage should use empty copy',
);

const first = progress.recordVictory('qingshi-road', 148.8);
assertEqual(first.firstClear, true, 'first victory should mark first clear');
assertEqual(first.newBest, true, 'first victory should set best time');
assertEqual(
    formatStageRecord(progress.recordFor('qingshi-road')),
    '已破 1 次  ·  最速 02:28',
    'first record summary',
);
assertEqual(
    formatFirstClearReward('qingshi-road', true),
    '已获得  ·  青石剑印  ·  御剑伤害 +2',
    'cleared stage should mark its reward obtained',
);
assertEqual(progress.rewardBonuses().swordDamage, 2, 'first clear should grant sword damage bonus');
assertEqual(progress.rewardBonuses().moveSpeed, 0, 'uncleared rewards should not be active');

const slower = progress.recordVictory('qingshi-road', 170);
assertEqual(slower.firstClear, false, 'repeat victory should not mark first clear');
assertEqual(slower.newBest, false, 'slower victory should preserve best time');
assertEqual(progress.recordFor('qingshi-road').bestSeconds, 148.8, 'best time should stay unchanged');

const faster = progress.recordVictory('qingshi-road', 91.2);
assertEqual(faster.newBest, true, 'faster victory should refresh best time');
assertEqual(
    formatStageRecord(progress.recordFor('qingshi-road')),
    '已破 3 次  ·  最速 01:31',
    'updated record summary',
);

progress.recordVictory('qingshi-road', 120, {
    bestCombo: 24,
    buildName: '太初剑匣 · 万剑归宗',
    path: 'edge',
    tier: 3,
});
const archive = progress.cultivationArchive();
assertEqual(archive.bestCombo, 24, 'archive should preserve the best combo');
assertEqual(archive.masteredPaths.includes('edge'), true, 'true-form path should enter the archive');
assertEqual(archive.lastBuild, '太初剑匣 · 万剑归宗', 'archive should preserve the latest build identity');

const serialized = progress.serialize();
const restored = new StageProgressRuntime();
assertEqual(restored.restore(serialized), true, 'serialized progress should restore');
assertEqual(restored.recordFor('qingshi-road').clears, 4, 'restored clear count');
restored.recordVictory('bamboo-ambush', 176.2);
restored.recordVictory('frozen-ruins', 210);
const allBonuses = restored.rewardBonuses();
assertEqual(allBonuses.swordDamage, 2, 'restored sword reward');
assertEqual(allBonuses.moveSpeed, 10, 'bamboo reward should add movement speed');
assertEqual(allBonuses.maxHp, 8, 'frozen reward should add maximum health');
assertEqual(restored.restore('{broken'), false, 'invalid json should be ignored');
assertEqual(restored.recordFor('qingshi-road').clears, 4, 'invalid restore should preserve current state');

console.log('StageProgressRuntime tests passed');
