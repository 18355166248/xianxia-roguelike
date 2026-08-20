import { createVfxStressSamples } from '../assets/scripts/systems/VfxStressRuntime';

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

const samples = createVfxStressSamples();
assert(samples.length === 50, 'the default stress burst should contain fifty samples');
assert(samples.some((sample) => sample.tier === 'finisher'), 'stress coverage should include finishers');
assert(samples.some((sample) => sample.tier === 'heavy'), 'stress coverage should include heavy hits');
assert(samples.filter((sample) => sample.defeated).length >= 16, 'stress coverage should include a dense death burst');
assert(JSON.stringify(samples) === JSON.stringify(createVfxStressSamples()), 'stress layout must be deterministic');

console.log('VfxStressRuntime tests passed');
