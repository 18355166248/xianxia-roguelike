import type { StageMapId } from '../config/GameConfig';

export const BOSS_PHASE_TWO_THRESHOLD = 0.55;

export interface BossPhasePresentation {
    bossName: string;
    phaseName: string;
    phaseIndex: 1 | 2;
    hudDetail: string;
    transitionTitle: string;
    transitionDetail: string;
    tone: string;
}

const BOSS_NAMES: Readonly<Record<StageMapId, string>> = {
    'qingshi-road': '镇关山魈',
    'bamboo-ambush': '竹心山魈',
    'frozen-ruins': '寒渊山魈',
};

export function bossEntranceRiskFor(mapId: StageMapId): string {
    if (mapId === 'frozen-ruins') return '唤潮落印  ·  55% 寒狱相  ·  冻尸增援';
    if (mapId === 'bamboo-ambush') return '竹影合围  ·  55% 狂相  ·  狐影夹击';
    return '三叠地脉  ·  55% 狂相  ·  魇影增援';
}

export function bossPhasePresentationFor(
    mapId: StageMapId,
    phase: 1 | 2,
): BossPhasePresentation {
    const frozen = mapId === 'frozen-ruins';
    const bamboo = mapId === 'bamboo-ambush';
    if (phase === 2) {
        return {
            bossName: BOSS_NAMES[mapId],
            phaseName: frozen ? '寒狱相' : '狂相',
            phaseIndex: 2,
            hudDetail: frozen
                ? '第二相  ·  落印唤潮  ·  冻尸增援'
                : bamboo
                    ? '第二相  ·  合围收隙  ·  狐影夹击'
                    : '第二相  ·  三印提速  ·  魇影增援',
            transitionTitle: frozen ? '第 二 相 · 寒 狱 相' : '第 二 相 · 狂 相',
            transitionDetail: frozen
                ? '落印唤潮 · 冻尸增援'
                : bamboo
                    ? '合围收隙 · 狐影夹击'
                    : '三印提速 · 魇影增援',
            tone: frozen ? '#70DDEB' : '#D65D3F',
        };
    }
    return {
        bossName: BOSS_NAMES[mapId],
        phaseName: frozen ? '霜甲相' : '镇相',
        phaseIndex: 1,
        hudDetail: frozen
            ? '55% 入寒狱  ·  落印唤潮  ·  冻尸增援'
            : bamboo
                ? '55% 入狂相  ·  合围收隙  ·  狐影夹击'
                : '55% 入狂相  ·  三印提速  ·  魇影增援',
        transitionTitle: frozen ? '第 一 相 · 霜 甲 相' : '第 一 相 · 镇 相',
        transitionDetail: frozen
            ? '离开落印 · 留意寒潮'
            : bamboo
                ? '寻找缺口 · 预备夹击'
                : '横移避印 · 预备召援',
        tone: frozen ? '#9ADFE8' : '#B97738',
    };
}
