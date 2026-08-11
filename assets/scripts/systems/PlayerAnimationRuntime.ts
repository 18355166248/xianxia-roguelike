import type { PlayerAction } from './PlayerActionRuntime';

export type PlayerAnimationClip = 'idle' | 'move' | 'slash' | 'hit';

export interface PlayerAnimationFrame {
    clip: PlayerAnimationClip;
    row: number;
    column: number;
}

interface PlayerAnimationSpec {
    clip: PlayerAnimationClip;
    row: number;
    fps: number;
    playback: 'loop' | 'action' | 'hold';
    holdColumn?: number;
}

export const PLAYER_ANIMATION_COLUMNS = 4;
export const PLAYER_ANIMATION_ROWS = 4;

/**
 * 战斗状态比美术动作更细：主动技能共享挥剑施法序列，踏云共享奔跑序列。
 * 这层映射隔离状态机与图集排布，后续新增专属动作时无需改战斗流程。
 */
const ACTION_ANIMATIONS: Record<PlayerAction, PlayerAnimationSpec> = {
    idle: { clip: 'idle', row: 0, fps: 5, playback: 'loop' },
    move: { clip: 'move', row: 1, fps: 10, playback: 'loop' },
    autoAttack: { clip: 'slash', row: 2, fps: 12, playback: 'action' },
    aimedVolley: { clip: 'slash', row: 2, fps: 10, playback: 'action' },
    dash: { clip: 'move', row: 1, fps: 13, playback: 'action' },
    formation: { clip: 'slash', row: 2, fps: 8, playback: 'action' },
    tribulation: { clip: 'slash', row: 2, fps: 6, playback: 'action' },
    hit: { clip: 'hit', row: 3, fps: 14, playback: 'action' },
    // 战败停在最深受创姿势，不播放恢复帧，避免角色倒下后重新站直。
    defeat: { clip: 'hit', row: 3, fps: 0, playback: 'hold', holdColumn: 1 },
};

export function resolvePlayerAnimationFrame(
    action: PlayerAction,
    elapsed: number,
    actionProgress: number,
): PlayerAnimationFrame {
    const spec = ACTION_ANIMATIONS[action];
    let column: number;
    if (spec.playback === 'hold') {
        column = spec.holdColumn ?? PLAYER_ANIMATION_COLUMNS - 1;
    } else if (spec.playback === 'action') {
        const progress = Math.max(0, Math.min(0.999999, actionProgress));
        column = Math.floor(progress * PLAYER_ANIMATION_COLUMNS);
    } else {
        column = Math.floor(Math.max(0, elapsed) * spec.fps) % PLAYER_ANIMATION_COLUMNS;
    }
    return { clip: spec.clip, row: spec.row, column };
}
