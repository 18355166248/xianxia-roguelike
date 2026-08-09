import {
    resultMilestonePresentation,
    resultActionGuidanceFor,
    resultRevealFrameFor,
    resultStagePresentationFor,
} from '../assets/scripts/systems/ResultPresentationRuntime';
import { STAGE_FIRST_CLEAR_REWARDS } from '../assets/scripts/systems/StageProgressRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

const stages = [
    resultStagePresentationFor('qingshi-road'),
    resultStagePresentationFor('bamboo-ambush'),
    resultStagePresentationFor('frozen-ruins'),
];
assert(new Set(stages.map((stage) => stage.accent)).size === 3, '三章战报必须使用独立章节色');
assert(new Set(stages.map((stage) => stage.closure)).size === 3, '三章战报必须拥有独立收束语');
assert(stages.every((stage) => stage.rewardFootnote.includes('后续试炼')), '章节奖励要说明下局生效');

const firstClear = resultMilestonePresentation(
    true,
    STAGE_FIRST_CLEAR_REWARDS['qingshi-road'],
    {
        firstClear: true,
        newBest: true,
        record: { clears: 1, bestSeconds: 148 },
    },
    { clears: 0 },
    (seconds) => `${seconds}s`,
);
assert(firstClear.kind === 'first-clear', '首破必须进入独立奖励里程碑');
assert(firstClear.title.includes('青石剑印'), '首破主标题必须直接显示永久奖励');
assert(firstClear.detail.includes('永久生效'), '首破奖励必须明确永久生效');

const newBest = resultMilestonePresentation(
    true,
    STAGE_FIRST_CLEAR_REWARDS['bamboo-ambush'],
    {
        firstClear: false,
        newBest: true,
        record: { clears: 4, bestSeconds: 121 },
    },
    { clears: 3, bestSeconds: 140 },
    (seconds) => `${seconds}s`,
);
assert(newBest.kind === 'new-best' && newBest.title.includes('121s'), '重复胜利要突出新最速');

const echo = resultMilestonePresentation(
    true,
    STAGE_FIRST_CLEAR_REWARDS['frozen-ruins'],
    {
        firstClear: false,
        newBest: false,
        record: { clears: 6, bestSeconds: 166 },
    },
    { clears: 5, bestSeconds: 166 },
    (seconds) => `${seconds}s`,
);
assert(echo.kind === 'echo' && echo.title.includes('6 次'), '普通重复胜利要显示累计通关次数');

const nextChapter = resultActionGuidanceFor({
    victory: true,
    firstClear: true,
    nextStageName: '竹林伏击',
});
assert(nextChapter.title.includes('竹林伏击'), '首次胜利要把下一章变成明确行动目标');

const frostFailure = resultActionGuidanceFor({
    victory: false,
    firstClear: false,
    failureCause: 'frost-tide',
});
assert(frostFailure.eyebrow.includes('寒 潮'), '失败战报要显示真实伤害来源');
assert(frostFailure.detail.includes('安全区'), '失败战报要给出可执行的重试建议');

const start = resultRevealFrameFor(0);
const middle = resultRevealFrameFor(0.36);
const end = resultRevealFrameFor(0.72);
assert(start.panelOpacity === 0 && start.rewardOpacity === 0, '战报与奖励应从隐藏态开始');
assert(middle.panelOpacity === 255 && middle.rewardOpacity > 0, '奖励要晚于战报主体揭示');
assert(end.panelScale === 1 && end.rewardScale === 1 && end.auraFrame === 3, '揭示结束必须稳定在峰值帧');

console.log('ResultPresentationRuntime tests passed');
