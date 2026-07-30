import type { StageMapId } from '../config/GameConfig';

export type StageEntryEffect =
    | 'qingshi-stele'
    | 'bamboo-burn'
    | 'frost-tide';

export interface StageEntryPresentation {
    accent: string;
    eyebrow: string;
    title: string;
    route: string;
    objective: string;
    effect: StageEntryEffect;
    markerPosition: {
        x: number;
        y: number;
    };
}

export interface StageEntryRevealFrame {
    veilOpacity: number;
    chapterOpacity: number;
    chapterScale: number;
    routeOpacity: number;
    objectiveOpacity: number;
    markerOpacity: number;
    markerFrame: number;
    worldOffsetY: number;
}

export const STAGE_ENTRY_DURATION = 1.9;
export const STAGE_ENTRY_REDUCED_MOTION_DURATION = 0.82;

export function stageEntryPresentationFor(mapId: StageMapId): StageEntryPresentation {
    if (mapId === 'bamboo-ambush') {
        return {
            accent: '#B7E4C7',
            eyebrow: '第 二 章 · 伏 路 初 境',
            title: '竹 林 伏 击',
            route: '入境  →  破竹开径  →  竹心魇兽',
            objective: '首境戒律 · 先辨竹隙，再破狐围',
            effect: 'bamboo-burn',
            markerPosition: { x: -8, y: 84 },
        };
    }
    if (mapId === 'frozen-ruins') {
        return {
            accent: '#BCEFF5',
            eyebrow: '第 三 章 · 寒 渊 初 境',
            title: '寒 潭 遗 迹',
            route: '入境  →  冰面寒潮  →  寒渊山魈',
            objective: '首境戒律 · 认清潮线，再入封脉',
            effect: 'frost-tide',
            markerPosition: { x: 6, y: 30 },
        };
    }
    return {
        accent: '#E3C06F',
        eyebrow: '第 一 章 · 山 门 初 境',
        title: '青 石 山 道',
        route: '入境  →  灵脉剑阵  →  镇关山魈',
        objective: '首境戒律 · 引动剑脉，再迎山精',
        effect: 'qingshi-stele',
        markerPosition: { x: 20, y: 80 },
    };
}

function clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
}

function smoothstep(value: number): number {
    const progress = clamp01(value);
    return progress * progress * (3 - 2 * progress);
}

export function stageEntryRevealFrameFor(elapsed: number): StageEntryRevealFrame {
    const time = Math.max(0, Math.min(STAGE_ENTRY_DURATION, elapsed));
    const settle = smoothstep(time / 0.78);
    const chapterIn = smoothstep(time / 0.24);
    const chapterOut = 1 - smoothstep((time - 1.42) / 0.36);
    const routeIn = smoothstep((time - 0.34) / 0.3);
    const objectiveIn = smoothstep((time - 0.82) / 0.3);
    const exit = 1 - smoothstep((time - 1.52) / 0.38);
    const markerProgress = clamp01((time - 0.18) / 0.74);
    return {
        veilOpacity: Math.round(172 * (1 - smoothstep(time / 1.72))),
        chapterOpacity: Math.round(255 * chapterIn * chapterOut),
        chapterScale: 0.94 + settle * 0.06,
        routeOpacity: Math.round(235 * routeIn * exit),
        objectiveOpacity: Math.round(255 * objectiveIn * exit),
        markerOpacity: Math.round(215 * smoothstep(markerProgress / 0.18) * exit),
        markerFrame: Math.min(3, Math.floor(Math.min(0.999, markerProgress) * 4)),
        worldOffsetY: Math.round(42 * (1 - settle)),
    };
}
