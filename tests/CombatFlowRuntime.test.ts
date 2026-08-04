import { CombatFlowRuntime } from '../assets/scripts/systems/CombatFlowRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

const flow = new CombatFlowRuntime();
for (let index = 0; index < 5; index += 1) flow.recordKill();
assert(flow.snapshot().tier === 1, 'five uninterrupted kills should start combat flow');
assert(flow.snapshot().damageMultiplier > 1, 'combat flow should create a visible damage payoff');

for (let index = 0; index < 15; index += 1) flow.recordKill();
assert(flow.snapshot().tier === 3, 'twenty kills should reach peerless flow');
assert(flow.snapshot().bestCombo === 20, 'best combo should retain the run peak');

flow.tick(3);
assert(flow.snapshot().combo === 0, 'flow should expire outside the kill window');
assert(flow.snapshot().bestCombo === 20, 'expiry must not erase the run record');

for (let index = 0; index < 5; index += 1) flow.recordKill();
assert(flow.breakFlow(), 'taking a hit should report a broken active flow');
assert(flow.snapshot().peakTier === 3, 'breaking flow must preserve the peak tier');

console.log('CombatFlowRuntime tests passed');
