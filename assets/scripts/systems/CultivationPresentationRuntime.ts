export const BREAKTHROUGH_WARNING_RATIO = 0.78;

export interface BreakthroughPulseState {
    imminent: boolean;
    pulse: number;
    enteredWarning: boolean;
}

export function advanceBreakthroughPulse(
    xp: number,
    xpNeed: number,
    dt: number,
    previousImminent: boolean,
    previousPulse: number,
): BreakthroughPulseState {
    const ratio = Math.max(0, Math.min(1, xp / Math.max(xpNeed, 1)));
    const imminent = ratio >= BREAKTHROUGH_WARNING_RATIO;
    if (!imminent) return { imminent: false, pulse: 0, enteredWarning: false };
    const urgency = (ratio - BREAKTHROUGH_WARNING_RATIO)
        / Math.max(1 - BREAKTHROUGH_WARNING_RATIO, 0.01);
    return {
        imminent: true,
        pulse: (previousImminent ? previousPulse : 0) + Math.max(0, dt) * (5.2 + urgency * 6.4),
        enteredWarning: !previousImminent,
    };
}

export function breakthroughBreathing(imminent: boolean, pulse: number, reducedMotion: boolean): number {
    return imminent && !reducedMotion ? (Math.sin(pulse) + 1) / 2 : 0;
}
