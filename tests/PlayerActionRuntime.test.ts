import {
    PlayerActionRuntime,
    resolveTapMovePoint,
    resolveTapMoveStep,
    resolveSwordGesture,
    shouldConfirmTapMove,
} from '../assets/scripts/systems/PlayerActionRuntime';
import { resolvePlayerAnimationFrame } from '../assets/scripts/systems/PlayerAnimationRuntime';

function assertEqual<T>(actual: T, expected: T, message: string): void {
    if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}

assertEqual(resolveSwordGesture(1, 1, 100), 'tap', 'tier one stays simple');
assertEqual(resolveSwordGesture(2, 0.2, 40), 'aimed', 'tier two unlocks directional release');
assertEqual(resolveSwordGesture(3, 0.6, 5), 'charged', 'tier three unlocks hold attack');
assertEqual(shouldConfirmTapMove(0.18, 8), true, 'short steady touch confirms a move target');
assertEqual(shouldConfirmTapMove(0.18, 40), false, 'dragging across the battlefield does not move');
assertEqual(resolveTapMovePoint({ x: 386, y: 667 }, 772, 1334).x, 0, 'portrait viewport center maps to battlefield center');
assertEqual(resolveTapMovePoint({ x: 1186, y: 667 }, 2372, 1334).x, 0, 'wide viewport center does not inherit the 750 design-width offset');
assertEqual(resolveTapMovePoint({ x: 1286, y: 767 }, 2372, 1334).y, 100, 'tap offset is preserved in battlefield coordinates');
assertEqual(resolveTapMoveStep({ x: 0, y: 0 }, { x: 30, y: 40 }).distance, 50, 'tap move measures target distance');
assertEqual(resolveTapMoveStep({ x: 0, y: 0 }, { x: 3, y: 4 }, 8).arrived, true, 'tap move stops inside arrival radius');
assertEqual(resolveTapMoveStep({ x: 0, y: 0 }, { x: 30, y: 40 }).x, 0.6, 'tap move resolves normalized x');

const actions = new PlayerActionRuntime();
actions.enter('chargedSlash', 0.7);
assertEqual(actions.enter('autoAttack', 0.2), false, 'auto attack cannot interrupt charged slash');
assertEqual(actions.enter('hit', 0.24), true, 'hit can interrupt charged slash');
actions.tick(0.25, true);
assertEqual(actions.current, 'move', 'state returns to locomotion after action');

assertEqual(resolvePlayerAnimationFrame('idle', 0.21, 0).column, 1, 'idle loops by clip fps');
assertEqual(resolvePlayerAnimationFrame('move', 0.31, 0).column, 3, 'movement loops through run frames');
assertEqual(resolvePlayerAnimationFrame('chargedSlash', 0.35, 0.5).column, 2, 'actions follow state progress');
assertEqual(resolvePlayerAnimationFrame('hit', 0.2, 0.75).row, 3, 'hit uses reaction row');
assertEqual(resolvePlayerAnimationFrame('defeat', 3, 1).column, 1, 'defeat holds the deep recoil frame');

console.log('PlayerActionRuntime tests passed');
