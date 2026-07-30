import type { StageMapId } from '../config/GameConfig';

export type BossFinishKind =
    | 'qingshi-seal'
    | 'bamboo-release'
    | 'frost-shatter';

export interface BossFinishPattern {
    kind: BossFinishKind;
    title: string;
    detail: string;
    tone: string;
    duration: number;
    burstAt: number;
    titleAt: number;
}

export interface BossFinishFrame {
    row: number;
    column: number;
}

export function bossFinishPatternFor(mapId: StageMapId): BossFinishPattern {
    if (mapId === 'bamboo-ambush') {
        return {
            kind: 'bamboo-release',
            title: '魇兽伏诛',
            detail: '竹心复明',
            tone: '#B7E4C7',
            duration: 1.58,
            burstAt: 0.28,
            titleAt: 0.34,
        };
    }
    if (mapId === 'frozen-ruins') {
        return {
            kind: 'frost-shatter',
            title: '寒魈伏诛',
            detail: '潮声俱寂',
            tone: '#BCEFF5',
            duration: 1.64,
            burstAt: 0.26,
            titleAt: 0.36,
        };
    }
    return {
        kind: 'qingshi-seal',
        title: '山魈伏诛',
        detail: '地脉归寂',
        tone: '#F6D58C',
        duration: 1.52,
        burstAt: 0.3,
        titleAt: 0.34,
    };
}

export function bossFinishFrameFor(elapsed: number): BossFinishFrame {
    // 现有动作表末行前两帧是真实受击、踉跄姿态；终结链只复用这两帧，不伪造不存在的死亡格。
    return {
        row: 3,
        column: elapsed < 0.16 ? 0 : 1,
    };
}

export function shouldDeferUpgradeForKill(
    behavior: 'chaser' | 'weaver' | 'lunger' | 'guardian' | 'boss',
    finalWave: boolean,
): boolean {
    // 只有关底最后一击禁止弹出破境；普通怪和非关底首领仍沿用原成长节奏。
    return behavior === 'boss' && finalWave;
}
