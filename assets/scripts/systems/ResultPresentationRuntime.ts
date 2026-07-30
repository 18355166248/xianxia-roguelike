import type { StageMapId } from '../config/GameConfig';
import type {
    StageFirstClearReward,
    StageProgressRecord,
    StageVictoryResult,
} from './StageProgressRuntime';

export interface ResultStagePresentation {
    accent: string;
    chapterMark: string;
    closure: string;
    rewardEyebrow: string;
    rewardFootnote: string;
    auraDiameter: number;
}

export type ResultMilestoneKind =
    | 'incomplete'
    | 'first-clear'
    | 'new-best'
    | 'echo';

export interface ResultMilestonePresentation {
    kind: ResultMilestoneKind;
    badge: string;
    title: string;
    detail: string;
    footnote: string;
}

export interface ResultRevealFrame {
    panelOpacity: number;
    panelScale: number;
    rewardOpacity: number;
    rewardScale: number;
    auraFrame: number;
}

export function resultStagePresentationFor(mapId: StageMapId): ResultStagePresentation {
    if (mapId === 'bamboo-ambush') {
        return {
            accent: '#B7E4C7',
            chapterMark: '竹 心 战 报',
            closure: '竹心复明',
            rewardEyebrow: '竹 符 归 心',
            rewardFootnote: '竹影行符已写入后续试炼',
            auraDiameter: 132,
        };
    }
    if (mapId === 'frozen-ruins') {
        return {
            accent: '#BCEFF5',
            chapterMark: '寒 渊 战 报',
            closure: '潮声俱寂',
            rewardEyebrow: '玉 魄 凝 华',
            rewardFootnote: '寒潭玉魄已写入后续试炼',
            auraDiameter: 148,
        };
    }
    return {
        accent: '#E3C06F',
        chapterMark: '山 门 战 报',
        closure: '地脉归寂',
        rewardEyebrow: '剑 印 归 山',
        rewardFootnote: '青石剑印已写入后续试炼',
        auraDiameter: 126,
    };
}

export function resultMilestonePresentation(
    victory: boolean,
    reward: Readonly<StageFirstClearReward>,
    result: Readonly<StageVictoryResult> | undefined,
    fallbackRecord: Readonly<StageProgressRecord>,
    formatDuration: (seconds: number) => string,
): ResultMilestonePresentation {
    if (!victory) {
        return {
            kind: 'incomplete',
            badge: '未落印',
            title: '此局未落印',
            detail: '仅胜利会更新章节战绩',
            footnote: '重整道心后可再次挑战',
        };
    }
    if (result?.firstClear) {
        return {
            kind: 'first-clear',
            badge: '新道印',
            title: `${reward.title}  凝 成`,
            detail: `永久生效  ·  ${reward.benefit}`,
            footnote: '已写入后续试炼',
        };
    }
    if (result?.newBest) {
        return {
            kind: 'new-best',
            badge: '新最速',
            title: `刷新最速  ·  ${formatDuration(result.record.bestSeconds ?? 0)}`,
            detail: `本章已破 ${result.record.clears} 次`,
            footnote: '新的最快道痕已留在试炼图',
        };
    }
    const record = result?.record ?? fallbackRecord;
    return {
        kind: 'echo',
        badge: '道印回响',
        title: `已破 ${record.clears} 次`,
        detail: record.bestSeconds === undefined
            ? '尚无最快道痕'
            : `最速  ·  ${formatDuration(record.bestSeconds)}`,
        footnote: '重复通关继续刷新次数与最速',
    };
}

export function resultRevealFrameFor(elapsed: number): ResultRevealFrame {
    const progress = Math.max(0, Math.min(1, elapsed / 0.72));
    const panelProgress = Math.min(1, progress / 0.28);
    const rewardProgress = Math.max(0, Math.min(1, (progress - 0.2) / 0.52));
    const auraProgress = Math.max(0, Math.min(0.999, (progress - 0.08) / 0.56));
    return {
        panelOpacity: Math.round(255 * panelProgress),
        panelScale: 0.96 + panelProgress * 0.04,
        rewardOpacity: Math.round(255 * rewardProgress),
        rewardScale: 0.9 + rewardProgress * 0.1,
        auraFrame: Math.min(3, Math.floor(auraProgress * 4)),
    };
}
