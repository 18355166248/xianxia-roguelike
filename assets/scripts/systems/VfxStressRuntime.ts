export interface VfxStressSample {
    x: number;
    y: number;
    damage: number;
    tier: 'normal' | 'heavy' | 'finisher';
    defeated: boolean;
}

/** Deterministic layout keeps screenshots and pool-pressure comparisons reproducible. */
export function createVfxStressSamples(count = 50): VfxStressSample[] {
    const total = Math.max(0, Math.floor(count));
    const columns = 8;
    return Array.from({ length: total }, (_, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const tier = index % 17 === 0 ? 'finisher' : index % 5 === 0 ? 'heavy' : 'normal';
        return {
            x: -280 + column * 80 + (row % 2) * 16,
            y: -250 + row * 105,
            damage: 18 + index % 9 * 4,
            tier,
            defeated: index % 3 === 0,
        };
    });
}
