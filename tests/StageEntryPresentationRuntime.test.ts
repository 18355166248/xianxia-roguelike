import {
    STAGE_ENTRY_DURATION,
    STAGE_ENTRY_REDUCED_MOTION_DURATION,
    stageEntryPresentationFor,
    stageEntryRevealFrameFor,
} from '../assets/scripts/systems/StageEntryPresentationRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

const stages = [
    stageEntryPresentationFor('qingshi-road'),
    stageEntryPresentationFor('bamboo-ambush'),
    stageEntryPresentationFor('frozen-ruins'),
];
assert(new Set(stages.map((stage) => stage.title)).size === 3, '三章入境必须显示独立章节名');
assert(new Set(stages.map((stage) => stage.effect)).size === 3, '三章入境必须使用独立场地动作');
assert(stages.every((stage) => stage.route.includes('入境') && stage.route.includes('→')), '入境必须复述路线方向');
assert(stages.every((stage) => stage.objective.startsWith('首境戒律')), '交权前必须揭示首境目标');

const start = stageEntryRevealFrameFor(0);
const chapter = stageEntryRevealFrameFor(0.28);
const route = stageEntryRevealFrameFor(0.72);
const objective = stageEntryRevealFrameFor(1.18);
const end = stageEntryRevealFrameFor(STAGE_ENTRY_DURATION);
assert(start.veilOpacity > 0 && start.chapterOpacity === 0, '入境应先落地图再显示章节名');
assert(chapter.chapterOpacity > 200 && chapter.routeOpacity === 0, '章节名必须早于路线信息');
assert(route.routeOpacity > 150 && route.markerFrame >= 2, '路线方向应与场地动作同步建立');
assert(objective.objectiveOpacity > 200, '首境目标必须在交权前清晰出现');
assert(end.veilOpacity === 0 && end.routeOpacity === 0 && end.worldOffsetY === 0, '入境结束必须完整交还战场');
assert(
    STAGE_ENTRY_REDUCED_MOTION_DURATION < STAGE_ENTRY_DURATION / 2,
    '减少动态模式必须显著缩短入境等待',
);

console.log('StageEntryPresentationRuntime tests passed');
