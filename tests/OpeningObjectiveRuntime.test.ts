import {
    OpeningObjectiveRuntime,
    openingObjectivePresentationFor,
    openingSpawnDirectiveFor,
    type OpeningObjectiveInput,
} from '../assets/scripts/systems/OpeningObjectiveRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

function input(overrides: Partial<OpeningObjectiveInput> = {}): OpeningObjectiveInput {
    return {
        spiritVeinProgress: 0,
        spiritVeinClaimed: false,
        obstaclesRemaining: 2,
        frostTidePhase: 'calm',
        frostTideCycle: 0,
        frostSecondsToSurge: 5.8,
        frostPlayerHitCycle: -1,
        ...overrides,
    };
}

const maps = ['qingshi-road', 'bamboo-ambush', 'frozen-ruins'] as const;
const presentations = maps.map(openingObjectivePresentationFor);
assert(new Set(presentations.map((item) => item.kind)).size === 3, '三章首境动作必须使用不同规则');
assert(new Set(presentations.map((item) => item.markerEffect)).size === 3, '三章必须使用不同真实场地标记');
assert(presentations.every((item) => item.instruction.includes('·')), '首境动作必须同时说明动作和目的');

const qingshi = new OpeningObjectiveRuntime();
qingshi.begin('qingshi-road');
assert(qingshi.tick(0.2, input({ spiritVeinProgress: 0.5 })).progress === 0.5, '青石进度必须跟随引脉');
assert(
    qingshi.tick(0.2, input({ spiritVeinProgress: 1, spiritVeinClaimed: true })).outcome === 'success',
    '青石引脉完成后必须立即反馈',
);

const bamboo = new OpeningObjectiveRuntime();
bamboo.begin('bamboo-ambush');
assert(bamboo.tick(0.2, input({ obstaclesRemaining: 2 })).outcome === 'active', '竹林未破障时应保持目标');
assert(bamboo.tick(0.2, input({ obstaclesRemaining: 1 })).outcome === 'success', '击破下段竹障应打开通路');

const frostSuccess = new OpeningObjectiveRuntime();
frostSuccess.begin('frozen-ruins');
assert(
    frostSuccess.tick(0.2, input({ frostTideCycle: 1, frostPlayerHitCycle: -1 })).outcome === 'success',
    '无伤避过首潮应显示成功',
);
const frostRecover = new OpeningObjectiveRuntime();
frostRecover.begin('frozen-ruins');
assert(
    frostRecover.tick(0.2, input({ frostTideCycle: 1, frostPlayerHitCycle: 0 })).outcome === 'recover',
    '首潮受击应给纠错反馈但不能阻断关卡',
);
assert(frostRecover.isFrostSanctuaryActive() === false, '首潮结束后临时结界必须关闭');

const qingshiSpawn = openingSpawnDirectiveFor('qingshi-road', 0);
const bambooSpawn = openingSpawnDirectiveFor('bamboo-ambush', 0);
const frostSpawn = openingSpawnDirectiveFor('frozen-ruins', 0);
assert(qingshiSpawn.edge === 'top', '青石追兵应从山门正面压入');
assert(bambooSpawn.edge === 'left', '竹林追兵应从竹障两翼切入');
assert(frostSpawn.edge === 'top' && frostSpawn.y === 420, '寒潭敌群应从上层冰台压入');

console.log('OpeningObjectiveRuntime tests passed');
