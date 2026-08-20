import {
    advanceBreakthroughPulse,
    breakthroughBreathing,
} from '../assets/scripts/systems/CultivationPresentationRuntime';

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

const idle = advanceBreakthroughPulse(40, 100, 0.1, false, 3);
assert(!idle.imminent && idle.pulse === 0, 'non-imminent cultivation should reset its presentation pulse');
const entered = advanceBreakthroughPulse(80, 100, 0.1, false, 9);
assert(entered.imminent && entered.enteredWarning, 'crossing the threshold should emit one warning edge');
const continuing = advanceBreakthroughPulse(95, 100, 0.1, true, entered.pulse);
assert(!continuing.enteredWarning && continuing.pulse > entered.pulse, 'imminent pulse should accelerate without replaying its cue');
assert(breakthroughBreathing(true, continuing.pulse, true) === 0, 'reduced motion should suppress breathing animation');

console.log('CultivationPresentationRuntime tests passed');
