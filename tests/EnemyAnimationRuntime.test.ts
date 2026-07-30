import {
    ENEMY_ANIMATION_COLUMNS,
    ENEMY_ANIMATION_ROWS,
    resolveBossAnimationFrame,
} from '../assets/scripts/systems/EnemyAnimationRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

assert(ENEMY_ANIMATION_COLUMNS === 4 && ENEMY_ANIMATION_ROWS === 4, 'boss sheet must stay 4x4');
assert(
    resolveBossAnimationFrame({ age: 0, moving: false, castTimer: 0, hitTimer: 0, enrageTimer: 0 }).row === 0,
    'idle boss should use idle row',
);
assert(
    resolveBossAnimationFrame({ age: 0.5, moving: true, castTimer: 0, hitTimer: 0, enrageTimer: 0 }).row === 1,
    'moving boss should use chase row',
);
assert(
    resolveBossAnimationFrame({ age: 1, moving: true, castTimer: 0.4, hitTimer: 0, enrageTimer: 0 }).row === 2,
    'cast should override movement',
);
assert(
    resolveBossAnimationFrame({ age: 1, moving: true, castTimer: 0.4, hitTimer: 0.1, enrageTimer: 0 }).row === 3,
    'hit should override cast',
);
assert(
    resolveBossAnimationFrame({ age: 1, moving: true, castTimer: 0.4, hitTimer: 0.1, enrageTimer: 0.8 }).column === 2,
    'enrage roar should have highest priority',
);

console.log('EnemyAnimationRuntime tests passed');
