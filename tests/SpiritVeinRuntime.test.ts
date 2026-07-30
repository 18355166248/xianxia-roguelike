import { SpiritVeinRuntime } from '../assets/scripts/systems/SpiritVeinRuntime';

function assertEqual<T>(actual: T, expected: T, message: string): void {
    if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}

function assertClose(actual: number, expected: number, message: string): void {
    if (Math.abs(actual - expected) > 1e-9) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

const vein = new SpiritVeinRuntime();
vein.begin('sword');
assertEqual(vein.tick(0.6, true).claimed, false, 'capture requires a full channel');
vein.tick(0.2, false);
assertEqual(vein.captureProgress < 0.5, true, 'leaving the zone decays capture');
assertEqual(vein.tick(1, true).claimed, true, 'remaining in range claims the vein');
assertEqual(vein.damageMultiplier(), 1.25, 'sword vein boosts damage');
vein.tick(10, true);
assertEqual(vein.damageMultiplier(), 1, 'sword boost expires');

vein.begin('vitality');
vein.tick(1.25, true);
assertClose(vein.vitalityRegenPerSecond(100), 1.8, 'vitality vein regenerates percentage health');

console.log('SpiritVeinRuntime tests passed');
