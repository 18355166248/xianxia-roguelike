import {
    AudioCueGate,
    audioCueSpecFor,
    soundscapeFor,
} from '../assets/scripts/systems/AudioCueRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

const hit = audioCueSpecFor('enemy-hit');
const victory = audioCueSpecFor('victory');
assert(hit.notes.length > 0 && hit.notes.every((item) => item.duration > 0), 'hit cue should contain playable notes');
assert(victory.notes.length >= 4, 'victory cue should have a distinct resolving phrase');
assert(audioCueSpecFor('boss-phase').vibration !== undefined, 'boss phase should include tactile feedback');
assert(audioCueSpecFor('sword-cast', 0).notes[0].frequency !== audioCueSpecFor('sword-cast', 1).notes[0].frequency, 'variants should avoid identical repeated pitch');

const gate = new AudioCueGate();
assert(gate.allow('enemy-hit', 1000), 'first hit should play');
assert(!gate.allow('enemy-hit', 1030), 'same high-frequency cue should be throttled');
assert(gate.allow('enemy-defeat', 1030), 'different cue should not share the hit cooldown');
assert(gate.allow('enemy-hit', 1100), 'hit should play again after cooldown');
gate.reset();
assert(gate.allow('enemy-hit', 1101), 'reset should clear cue history');

const scenes = ['menu', 'qingshi-road', 'bamboo-ambush', 'frozen-ruins'] as const;
const roots = scenes.map((scene) => soundscapeFor(scene).frequencies[0]);
assert(new Set(roots).size === scenes.length, 'each chapter should have a distinct ambient root');
assert(scenes.every((scene) => soundscapeFor(scene).gain <= 0.01), 'ambient bed should remain below combat cues');

console.log('AudioCueRuntime tests passed');
