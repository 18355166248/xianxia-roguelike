import {
    buildRouteTrace,
    describeChapterBranchMemory,
    describeNextWaveModifiers,
    mapEventScenarioFor,
    MapEventRuntime,
    revealRouteTrace,
    resolveChapterPreviewMotion,
    resolveMapEventPreludeMotion,
    resolveRouteCommitFrame,
    resolveRouteHudSegmentState,
} from '../assets/scripts/systems/MapEventRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

const early = new MapEventRuntime();
early.begin('qingshi-road', () => 0);
assert(early.triggerWaveIndex() === 0, 'runtime should expose the announced branch timing');
assert(early.routeHudText(0).includes('本境后分岔'), 'current trigger wave should use immediate timing copy');
assert(early.shouldTriggerAfterWave(0), 'low random should trigger after first wave');
assert(!early.shouldTriggerAfterWave(1), 'event should not trigger on another wave');
const qingshi = early.open();
assert(qingshi.choices.length === 2, 'event should always expose two choices');
assert(
    qingshi.choices[1].commitEffect === 'spring-flow',
    'qingshi stable choice should trigger the restrained spring sprite flow',
);
const swordChoice = early.resolve('read-the-scar');
assert(swordChoice.effect.swordDamageMultiplier === 1.22, 'qingshi risk choice should boost sword damage');
assert(swordChoice.geometryPreview === '剑碑阵列', 'qingshi risk choice should preview the stele array');
assert(swordChoice.commitLine.includes('三碑落阵'), 'route choice should declare its immediate spatial commitment');
assert(swordChoice.commitEffect === 'stele-burst', 'qingshi risk choice should trigger the stele sprite burst');
assert(swordChoice.effect.qingshiRoute === 'sword-stele-array', 'qingshi risk choice should create the stele arena');
assert(
    early.routeHudText(1, 4) === '剑碑阵列  ·  第 2/4 境  ·  代价：损血',
    'resolved route HUD should combine the selected geometry, run progress, and route cost',
);
assert(!early.shouldTriggerAfterWave(0), 'resolved event should not reopen');
const preBranchSegment = resolveRouteHudSegmentState(0, 0, 0, false);
assert(!preBranchSegment.completed, 'current wave segment should remain pending');
assert(!preBranchSegment.followsSelectedRoute, 'unresolved fork should not imply a selected route');
const selectedBranchSegment = resolveRouteHudSegmentState(0, 1, 0, true);
assert(selectedBranchSegment.completed, 'segment behind the active wave should be complete');
assert(selectedBranchSegment.followsSelectedRoute, 'selected route color should begin after the trigger wave');
const beforeLateBranch = resolveRouteHudSegmentState(0, 1, 1, true);
assert(
    !beforeLateBranch.followsSelectedRoute,
    'segments before a later branch must retain the neutral journey color',
);

const late = new MapEventRuntime();
late.begin('bamboo-ambush', () => 0.999);
assert(late.shouldTriggerAfterWave(1), 'high random should trigger after second wave');
late.open();
const hiddenRoute = late.resolve('hide-in-bamboo');
assert(hiddenRoute.geometryPreview === '竹影夹道', 'bamboo choice should preview its spatial commitment');
assert(hiddenRoute.commitLine.includes('左右夹击'), 'bamboo route commitment should describe the changed attack direction');
assert(hiddenRoute.effect.bambooRoute === 'shadow-corridor', 'hidden route should select the corridor layout');
assert(hiddenRoute.commitEffect === 'bamboo-shadow', 'bamboo stable choice should trigger the shadow sprite veil');
const bambooModifiers = late.modifiersForWave(true);
assert(bambooModifiers.hp === 0.88, 'bamboo ambush choice should reduce next-wave hp');
assert(bambooModifiers.speed === 1.1, 'bamboo ambush choice should increase next-wave speed');
assert(
    describeNextWaveModifiers(bambooModifiers) === '敌血 -12% · 敌速 +10%',
    'next-wave modifiers should become readable branch preview copy',
);
assert(
    late.routeHudText(2, 4) === '竹影夹道  ·  第 3/4 境  ·  敌血 -12% · 敌速 +10%',
    'route HUD should expose the selected branch and its next-wave pressure without verbose title copy',
);
assert(late.modifiersForWave(false).hp === 1, 'modifiers should only apply to the marked wave');

const bamboo = new MapEventRuntime();
bamboo.begin('bamboo-ambush', () => 0);
bamboo.openForQa();
assert(
    bamboo.resolve('burn-the-barriers').commitEffect === 'bamboo-burn',
    'bamboo risk choice should trigger the barrier burn sprite burst',
);

const frozen = new MapEventRuntime();
frozen.begin('frozen-ruins', () => 0.5);
assert(frozen.scenario().id === 'frozen-tide-altar', 'map should select its own event');
frozen.openForQa();
const tideChoice = frozen.resolve('borrow-the-tide');
assert(tideChoice.riskLabel.includes('敌伤'), 'choice should expose a readable risk');
assert(tideChoice.geometryPreview === '潮线聚敌', 'frozen route should preview its spatial result');
assert(tideChoice.commitLine.includes('寒潮穿阵'), 'frozen route commitment should describe the arena consequence');
assert(tideChoice.commitEffect === 'tide-convergence', 'frozen risk choice should trigger the tide sprite burst');
assert(tideChoice.effect.frostRoute === 'tide-convergence', 'borrowed tide should select the convergence arena');
assert(
    frozen.scenario().choices[1].commitEffect === 'sealed-sanctuary',
    'frozen stable choice should trigger the restrained sanctuary seal',
);
assert(describeNextWaveModifiers(undefined) === '敌军常态', 'choices without next-wave modifiers need a clear neutral state');
assert(resolveRouteCommitFrame(-1) === 0, 'route commit frames should clamp negative progress');
assert(resolveRouteCommitFrame(0.24) === 0, 'route commit frames should hold the first quarter');
assert(resolveRouteCommitFrame(0.25) === 1, 'route commit frames should advance at quarter boundaries');
assert(resolveRouteCommitFrame(0.74) === 2, 'route commit frames should expose the third frame');
assert(resolveRouteCommitFrame(1) === 3, 'route commit frames should clamp to the last frame');
const previewStart = resolveChapterPreviewMotion(0);
const previewPeak = resolveChapterPreviewMotion(0.5);
const previewEnd = resolveChapterPreviewMotion(1);
assert(previewStart.frameIndex === 0 && previewStart.opacity === 0, 'chapter preview should start hidden on its first frame');
assert(previewPeak.frameIndex === 3 && previewPeak.opacity === 1, 'chapter preview should reach its readable peak before fading');
assert(previewEnd.frameIndex === 3 && previewEnd.opacity === 0, 'chapter preview should finish hidden without looping');
assert(previewPeak.scale > previewStart.scale, 'chapter preview should expand gently while it plays');
const preludeRiskPeak = resolveMapEventPreludeMotion(0.3, 0);
const preludeStableBefore = resolveMapEventPreludeMotion(0.3, 1);
const preludeStablePeak = resolveMapEventPreludeMotion(0.75, 1);
assert(preludeRiskPeak.opacity === 1, 'event prelude should reveal the risk geometry first');
assert(preludeStableBefore.opacity === 0, 'stable geometry should wait for its own prelude beat');
assert(preludeStablePeak.opacity === 1, 'event prelude should reveal the stable geometry second');
assert(
    resolveMapEventPreludeMotion(1, 1).opacity === 0,
    'event prelude should release the scene before the choice modal opens',
);
assert(mapEventScenarioFor('qingshi-road').choices[0].title === '以血悟痕', 'menu brief should read qingshi routes without mutating run state');
assert(mapEventScenarioFor('bamboo-ambush').choices[1].geometryPreview === '竹影夹道', 'menu brief should expose bamboo spatial outcomes');
assert(mapEventScenarioFor('frozen-ruins').choices[0].commitLine.includes('寒潮穿阵'), 'menu brief should expose frost route commitments');
assert(
    describeChapterBranchMemory('qingshi-road') === '分岔预见 · 剑碑阵列 / 灵泉侧路',
    'qingshi first-wave memory should repeat both spatial branches',
);
assert(
    describeChapterBranchMemory('bamboo-ambush') === '分岔预见 · 开阔正面 / 竹影夹道',
    'bamboo first-wave memory should repeat both spatial branches',
);
assert(
    describeChapterBranchMemory('frozen-ruins') === '分岔预见 · 潮线聚敌 / 封脉结界',
    'frozen first-wave memory should repeat both spatial branches',
);
const unorderedTracePlacements = [{ x: 30, y: 20 }, { x: -18, y: -12 }, { x: 0, y: 4 }];
const routeTrace = buildRouteTrace(
    unorderedTracePlacements,
    { x: 0, y: -40 },
    { x: 0, y: 40 },
);
assert(routeTrace.length === 5, 'route trace should connect entry, every placement, and the boss');
assert(routeTrace[0].y === -40 && routeTrace[4].y === 40, 'route trace should preserve its semantic endpoints');
assert(routeTrace[1].y === -12 && routeTrace[3].y === 20, 'route trace should order arena placements from entry to boss');
assert(unorderedTracePlacements[0].y === 20, 'route trace construction should not mutate arena placements');
const halfTrace = revealRouteTrace(routeTrace, 0.5);
assert(halfTrace.length >= 2, 'route trace reveal should expose a continuous partial path');
assert(
    halfTrace[halfTrace.length - 1].y > -40 && halfTrace[halfTrace.length - 1].y < 40,
    'half reveal should interpolate within the route instead of jumping to the boss',
);
const fullTrace = revealRouteTrace(routeTrace, 2);
assert(fullTrace.length === routeTrace.length, 'route trace reveal should clamp progress above one');
assert(fullTrace[fullTrace.length - 1].y === 40, 'full route trace should finish at the boss');

console.log('MapEventRuntime tests passed');
