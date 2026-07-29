import {
    PlayerActionRuntime,
    resolveSwordGesture,
    shouldTriggerFlickDash,
} from '../assets/scripts/systems/PlayerActionRuntime';

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

console.log('PlayerActionRuntime tests passed');
