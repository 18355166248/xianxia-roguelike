import {
    PlayerActionRuntime,
    resolveSwordGesture,
    shouldTriggerFlickDash,
} from '../assets/scripts/systems/PlayerActionRuntime';
import { resolvePlayerAnimationFrame } from '../assets/scripts/systems/PlayerAnimationRuntime';

function assertEqual<T>(actual: T, expected: T, message: string): void {
    if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}

assertEqual(resolveSwordGesture(1, 1, 100), 'tap', 'tier one stays simple');
assertEqual(resolveSwordGesture(2, 0.2, 40), 'aimed', 'tier two unlocks directional release');
assertEqual(resolveSwordGesture(3, 0.6, 5), 'charged', 'tier three unlocks hold attack');
assertEqual(shouldTriggerFlickDash(0.2, 80), true, 'fast long joystick flick triggers dash');
assertEqual(shouldTriggerFlickDash(0.4, 80), false, 'slow movement does not trigger dash');

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
