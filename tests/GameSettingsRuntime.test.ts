import { GameSettingsRuntime } from '../assets/scripts/systems/GameSettingsRuntime';

function assertEqual<T>(actual: T, expected: T, message: string): void {
    if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
}

const settings = new GameSettingsRuntime(true);
assertEqual(settings.snapshot().reducedMotion, true, 'system preference should seed reduced motion');
assertEqual(settings.snapshot().audioEnabled, true, 'audio should be enabled by default');
assertEqual(settings.snapshot().tutorialCompleted, false, 'first player should see tutorial');
assertEqual(settings.snapshot().effectDensity, 'balanced', 'effect density should default to balanced');

settings.update({ audioEnabled: false, vibrationEnabled: false, effectDensity: 'low' });
settings.completeTutorial();
const restored = new GameSettingsRuntime(false);
assertEqual(restored.restore(settings.serialize()), true, 'serialized settings should restore');
assertEqual(restored.snapshot().audioEnabled, false, 'audio preference should persist');
assertEqual(restored.snapshot().vibrationEnabled, false, 'vibration preference should persist');
assertEqual(restored.snapshot().reducedMotion, true, 'motion preference should persist');
assertEqual(restored.snapshot().tutorialCompleted, true, 'tutorial completion should persist');
assertEqual(restored.snapshot().effectDensity, 'low', 'effect density should persist');

const backwardsCompatible = new GameSettingsRuntime(true);
assertEqual(backwardsCompatible.restore('{"audioEnabled":false}'), true, 'older partial settings should restore');
assertEqual(backwardsCompatible.snapshot().audioEnabled, false, 'provided older field should apply');
assertEqual(backwardsCompatible.snapshot().reducedMotion, true, 'missing field should keep platform default');
assertEqual(backwardsCompatible.snapshot().effectDensity, 'balanced', 'older settings should inherit balanced density');
assertEqual(backwardsCompatible.restore('{"audioEnabled":"yes"}'), false, 'invalid fields should be rejected');

console.log('GameSettingsRuntime tests passed');
