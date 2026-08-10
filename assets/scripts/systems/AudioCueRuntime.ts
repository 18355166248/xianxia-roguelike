import type { StageMapId } from '../config/GameConfig';

export type GameAudioCue =
    | 'ui-confirm'
    | 'stage-entry'
    | 'sword-cast'
    | 'enemy-hit'
    | 'enemy-defeat'
    | 'player-hit'
    | 'boss-cast'
    | 'boss-phase'
    | 'victory'
    | 'defeat'
    | 'journey-complete';

export interface AudioNoteSpec {
    frequency: number;
    offset: number;
    duration: number;
    gain: number;
    wave: OscillatorType;
}

export interface AudioCueSpec {
    notes: readonly AudioNoteSpec[];
    vibration?: number | number[];
    cooldownMs: number;
}

export type SoundscapeScene = 'menu' | StageMapId;

export interface SoundscapeSpec {
    frequencies: readonly number[];
    gain: number;
    wave: OscillatorType;
}

const note = (
    frequency: number,
    offset: number,
    duration: number,
    gain: number,
    wave: OscillatorType = 'sine',
): AudioNoteSpec => ({ frequency, offset, duration, gain, wave });

const CUES: Readonly<Record<GameAudioCue, AudioCueSpec>> = {
    'ui-confirm': { notes: [note(392, 0, 0.12, 0.024), note(587, 0.065, 0.16, 0.028)], cooldownMs: 120 },
    'stage-entry': { notes: [note(196, 0, 0.45, 0.026), note(294, 0.13, 0.55, 0.022), note(440, 0.27, 0.7, 0.018)], cooldownMs: 900 },
    'sword-cast': { notes: [note(760, 0, 0.075, 0.012, 'triangle'), note(1120, 0.025, 0.08, 0.009, 'triangle')], cooldownMs: 95 },
    'enemy-hit': { notes: [note(164, 0, 0.065, 0.015, 'square')], cooldownMs: 65 },
    'enemy-defeat': { notes: [note(220, 0, 0.11, 0.018, 'triangle'), note(330, 0.04, 0.13, 0.014, 'triangle')], cooldownMs: 90 },
    'player-hit': { notes: [note(92, 0, 0.18, 0.035, 'sawtooth')], vibration: 24, cooldownMs: 260 },
    'boss-cast': { notes: [note(73, 0, 0.36, 0.04, 'sawtooth'), note(110, 0.12, 0.28, 0.025, 'triangle')], vibration: [14, 30, 20], cooldownMs: 650 },
    'boss-phase': { notes: [note(82, 0, 0.6, 0.045, 'sawtooth'), note(123, 0.12, 0.65, 0.035), note(246, 0.3, 0.7, 0.026)], vibration: [30, 35, 55], cooldownMs: 1200 },
    victory: { notes: [note(262, 0, 0.34, 0.03), note(330, 0.1, 0.38, 0.03), note(392, 0.2, 0.48, 0.034), note(523, 0.34, 0.65, 0.03)], vibration: [18, 26, 42], cooldownMs: 1600 },
    defeat: { notes: [note(196, 0, 0.4, 0.03, 'triangle'), note(147, 0.17, 0.5, 0.027), note(98, 0.34, 0.68, 0.025)], vibration: 35, cooldownMs: 1600 },
    'journey-complete': { notes: [note(196, 0, 0.45, 0.028), note(294, 0.12, 0.5, 0.03), note(392, 0.24, 0.58, 0.032), note(587, 0.4, 0.8, 0.035)], vibration: [22, 24, 22, 24, 58], cooldownMs: 2200 },
};

const SOUNDSCAPES: Readonly<Record<SoundscapeScene, SoundscapeSpec>> = {
    menu: { frequencies: [98, 147, 196], gain: 0.009, wave: 'sine' },
    'qingshi-road': { frequencies: [110, 165, 220], gain: 0.008, wave: 'sine' },
    'bamboo-ambush': { frequencies: [123, 185, 247], gain: 0.0075, wave: 'triangle' },
    'frozen-ruins': { frequencies: [82, 123, 185], gain: 0.0085, wave: 'sine' },
};

export function audioCueSpecFor(cue: GameAudioCue, variant = 0): AudioCueSpec {
    const source = CUES[cue];
    const semitoneOffset = ((Math.abs(Math.floor(variant)) % 3) - 1) * 0.5;
    const pitch = 2 ** (semitoneOffset / 12);
    return {
        ...source,
        notes: source.notes.map((item) => ({ ...item, frequency: item.frequency * pitch })),
        vibration: Array.isArray(source.vibration) ? [...source.vibration] : source.vibration,
    };
}

export function soundscapeFor(scene: SoundscapeScene): SoundscapeSpec {
    const spec = SOUNDSCAPES[scene];
    return { ...spec, frequencies: [...spec.frequencies] };
}

/** 高频命中共享冷却门，避免多把飞剑同帧命中时叠成刺耳爆音。 */
export class AudioCueGate {
    private readonly lastPlayedAt = new Map<GameAudioCue, number>();

    public allow(cue: GameAudioCue, nowMs: number): boolean {
        const previous = this.lastPlayedAt.get(cue);
        const cooldown = CUES[cue].cooldownMs;
        if (previous !== undefined && nowMs - previous < cooldown) return false;
        this.lastPlayedAt.set(cue, nowMs);
        return true;
    }

    public reset(): void {
        this.lastPlayedAt.clear();
    }
}
