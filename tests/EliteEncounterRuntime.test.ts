import {
    EliteEncounterRuntime,
    eliteEncounterPresentationFor,
    eliteEncounterSpawnDirectiveFor,
    isInsideQingshiEliteVein,
    qingshiEliteVeinDamageMultiplier,
    shouldStaggerBambooWarden,
} from '../assets/scripts/systems/EliteEncounterRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

{
    const presentations = [
        eliteEncounterPresentationFor('qingshi-road'),
        eliteEncounterPresentationFor('bamboo-ambush'),
        eliteEncounterPresentationFor('frozen-ruins'),
    ];
    assert(new Set(presentations.map((item) => item.kind)).size === 3, '三章必须使用不同境中试炼规则');
    assert(new Set(presentations.map((item) => item.eyebrow)).size === 3, '三章必须使用不同目标标题');
}

{
    const runtime = new EliteEncounterRuntime();
    runtime.begin('qingshi-road', 1);
    runtime.recordQingshiVeinKill();
    runtime.recordQingshiVeinKill();
    assert(runtime.snapshot().text.includes('2/3'), '青石目标必须显示圈内斩敌进度');
    runtime.recordQingshiVeinKill();
    assert(runtime.snapshot().completed, '青石三次圈内斩敌后必须完成试炼');
}

{
    const runtime = new EliteEncounterRuntime();
    runtime.begin('bamboo-ambush', 1);
    runtime.recordBambooBarrierStagger();
    assert(runtime.snapshot().text.includes('1/2'), '竹林目标必须显示撞障进度');
    runtime.recordBambooBarrierStagger();
    assert(runtime.snapshot().completed, '竹林两次截锋后必须完成试炼');
}

{
    const runtime = new EliteEncounterRuntime();
    runtime.begin('frozen-ruins', 1);
    runtime.recordFrostTideHit('corpse-a');
    runtime.recordFrostTideHit('corpse-a');
    runtime.recordFrostTideHit('corpse-b');
    assert(runtime.snapshot().current === 2, '同一冰尸同轮寒潮命中不能重复计数');
    runtime.recordFrostTideHit('corpse-c');
    assert(runtime.snapshot().completed, '寒潮命中三只冰尸后必须完成试炼');
}

{
    assert(isInsideQingshiEliteVein({ x: 20, y: 10 }, { x: 0, y: 0 }), '圈内敌人必须被识别');
    assert(
        qingshiEliteVeinDamageMultiplier(1, { x: 20, y: 10 }, { x: 0, y: 0 }) === 1.35,
        '第二波剑脉内敌人必须承受额外伤害',
    );
    assert(
        qingshiEliteVeinDamageMultiplier(2, { x: 20, y: 10 }, { x: 0, y: 0 }) === 1,
        '后续波次不能沿用境中试炼倍率',
    );
}

{
    assert(shouldStaggerBambooWarden(1, true, true, 0), '真实突进撞障必须触发失衡');
    assert(!shouldStaggerBambooWarden(1, false, true, 0), '普通压步不能冒充撞障');
    assert(!shouldStaggerBambooWarden(1, true, true, 0.4), '碰撞冷却期间不能重复计数');
}

{
    const qingshi = eliteEncounterSpawnDirectiveFor('qingshi-road', 0);
    const bamboo = eliteEncounterSpawnDirectiveFor('bamboo-ambush', 0);
    const frost = eliteEncounterSpawnDirectiveFor('frozen-ruins', 0);
    assert(qingshi.edge === 'left', '青石狐妖必须从两翼绕入');
    assert(bamboo.edge === 'top', '竹甲镇守必须从正面压向竹障');
    assert(frost.edge === 'top', '寒潭冰尸必须沿上层潮线列阵');
    assert(bamboo.xRatio !== frost.xRatio, '竹林与寒潭不能共用同一首敌落点');
}

console.log('EliteEncounterRuntime tests passed');
