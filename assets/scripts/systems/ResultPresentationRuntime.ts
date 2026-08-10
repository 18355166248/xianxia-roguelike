import type { StageMapId } from '../config/GameConfig';
import type { RunDamageCause } from './RunStatsRuntime';
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

export interface ResultActionGuidance {
    eyebrow: string;
    title: string;
    detail: string;
}

export interface ResultActionGuidanceInput {
    victory: boolean;
    firstClear: boolean;
    nextStageName?: string;
    alternateRouteName?: string;
    failureCause?: RunDamageCause;
}

/**
 * 战报的最后一块信息必须回答“下一步做什么”，避免胜负页只复述统计而中断游戏动机。
 * 失败建议只使用已经记录的伤害来源，不根据面板数值臆测玩家操作。
 */
export function resultActionGuidanceFor(
    input: Readonly<ResultActionGuidanceInput>,
): ResultActionGuidance {
    if (input.victory) {
        if (input.firstClear && input.nextStageName) {
            return {
                eyebrow: '下 一 目 标',
                title: `前往${input.nextStageName}`,
                detail: '新道印已生效 · 用本局构筑继续试炼',
            };
        }
        if (input.alternateRouteName) {
            return {
                eyebrow: '下 一 目 标',
                title: `改走${input.alternateRouteName}`,
                detail: '尚未印证的道途 · 将带来不同关底因果',
            };
        }
        return {
            eyebrow: '下 一 目 标',
            title: '刷新最速与连斩',
            detail: '重走本章，尝试让主修道基抵达真形',
        };
    }

    if (input.failureCause === 'frost-tide') {
        return {
            eyebrow: '败 因 · 寒 潮',
            title: '提前进入封脉圈',
            detail: '潮线发亮后停止追击，先横移到安全区',
        };
    }
    if (input.failureCause === 'boss-bamboo-pincer') {
        return {
            eyebrow: '败 因 · 夹 击',
            title: '预留中线退路',
            detail: '竹墙闭合前进入缺口，不要贴近两侧边缘',
        };
    }
    if (input.failureCause === 'boss-ground-slam' || input.failureCause === 'boss-frost-slam') {
        return {
            eyebrow: '败 因 · 首 领 重 击',
            title: '看见落印立即离圈',
            detail: '保留踏云应对预警，首领收招后再反击',
        };
    }
    return {
        eyebrow: '败 因 · 近 身 围 困',
        title: '保持移动并拆开敌群',
        detail: '先绕开正面包围，再用剑阵或踏云脱身',
    };
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
