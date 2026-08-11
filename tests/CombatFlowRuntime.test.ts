import {
    CombatFlowRuntime,
    combatImpactPresentationFor,
} from '../assets/scripts/systems/CombatFlowRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

const flow = new CombatFlowRuntime();
for (let index = 0; index < 5; index += 1) flow.recordKill();
assert(flow.snapshot().tier === 1, 'five uninterrupted kills should start combat flow');
assert(flow.snapshot().damageMultiplier > 1, 'combat flow should create a visible damage payoff');

for (let index = 0; index < 11; index += 1) flow.recordKill();
assert(flow.snapshot().tier === 3, 'sixteen kills should reach peerless flow');
assert(flow.snapshot().bestCombo === 16, 'best combo should retain the run peak');
assert(
    flow.snapshot().damageMultiplier >= 1.2,
    'the top flow tier must pay out a damage bonus the player can actually feel',
);

flow.tick(10, true);
assert(flow.snapshot().combo === 16, 'a sustained gap between waves must not expire the flow');

flow.tick(3);
assert(flow.snapshot().combo === 0, 'flow should expire outside the kill window');
assert(flow.snapshot().bestCombo === 16, 'expiry must not erase the run record');

for (let index = 0; index < 5; index += 1) flow.recordKill();
assert(flow.breakFlow(), 'taking a hit should report a broken active flow');
assert(flow.snapshot().peakTier === 3, 'breaking flow must preserve the peak tier');

const normalImpact = combatImpactPresentationFor('sword', false, false, 0.08);
const skillImpact = combatImpactPresentationFor('skill', false, false, 0.12);
const finisherImpact = combatImpactPresentationFor('sword', true, true, 0.4);
assert(normalImpact.tier === 'normal', 'regular sword hits should keep the quiet feedback tier');
assert(skillImpact.tier === 'heavy', 'skill hits should visibly outrank regular sword hits');
assert(
    finisherImpact.tier === 'finisher'
    && finisherImpact.shakeStrength > skillImpact.shakeStrength,
    'important kills should receive the strongest feedback tier',
);

console.log('CombatFlowRuntime tests passed');
