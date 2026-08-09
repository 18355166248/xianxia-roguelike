import {
    describeMapAchievement,
    describeMapEventDecision,
    describeRouteReplaySteps,
    formatRunDuration,
    RunStatsRuntime,
} from '../assets/scripts/systems/RunStatsRuntime';

function assertEqual<T>(actual: T, expected: T, message: string): void {
    if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
}

const stats = new RunStatsRuntime();
stats.tick(61.9);
stats.recordEnemyDefeated();
stats.recordDamageDealt(28);
stats.recordDamageTaken(7, 'frost-tide');
stats.recordSpiritVeinClaimed();
stats.recordObstacleBroken();
stats.recordTideEnemyHit();
stats.recordCombatFlow(12, 2);
stats.recordMapEvent({
    choiceId: 'read-the-scar',
    title: '以血悟痕',
    role: '锋芒捷径',
    geometryPreview: '剑碑阵列',
    commitLine: '三碑落阵 · 诱敌入痕承伤',
    commitEffect: 'stele-burst',
    outcome: '飞剑伤害 +22%',
    tone: 'gold',
    iconResourcePath: 'art/relics/xianxia-relics_00/spriteFrame',
});
const snapshot = stats.snapshot();

assertEqual(formatRunDuration(snapshot.elapsedSeconds), '01:01', 'duration should use mm:ss');
assertEqual(snapshot.enemiesDefeated, 1, 'enemy count');
assertEqual(snapshot.damageDealt, 28, 'damage dealt');
assertEqual(snapshot.damageTaken, 7, 'damage taken');
assertEqual(snapshot.lastDamageCause, 'frost-tide', 'last damage cause should support defeat guidance');
assertEqual(snapshot.bestCombo, 12, 'best combo');
assertEqual(snapshot.peakFlowTier, 2, 'peak combat flow tier');
assertEqual(
    describeMapAchievement('bamboo-ambush', snapshot),
    '破竹 1 道  ·  灵脉共鸣 1 次',
    'bamboo achievement',
);
assertEqual(
    describeMapAchievement('frozen-ruins', snapshot),
    '借潮伤敌 1 次  ·  灵脉共鸣 1 次',
    'frozen achievement',
);
assertEqual(
    describeMapEventDecision(snapshot),
    '以血悟痕  ·  飞剑伤害 +22%',
    'map event decision',
);
const replaySteps = describeRouteReplaySteps(snapshot);
assertEqual(replaySteps.length, 3, 'route replay should connect preview, choice, and result');
assertEqual(replaySteps[0].value, '剑碑阵列', 'route replay should preserve the spatial preview');
assertEqual(replaySteps[2].value, '飞剑伤害 +22%', 'route replay should preserve the confirmed outcome');

stats.reset();
assertEqual(stats.snapshot().elapsedSeconds, 0, 'reset duration');
assertEqual(
    describeMapEventDecision(stats.snapshot()),
    '未逢奇遇  ·  此局未留路线印记',
    'empty map event decision',
);
assertEqual(describeRouteReplaySteps(stats.snapshot()).length, 0, 'empty runs should not expose replay steps');

console.log('RunStatsRuntime tests passed');
