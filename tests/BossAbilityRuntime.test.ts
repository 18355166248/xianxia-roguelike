import {
    bambooPincerGapFor,
    bossAbilityPatternFor,
    isInsideBambooPincerDanger,
    qingshiSealPlacementsFor,
} from '../assets/scripts/systems/BossAbilityRuntime';

const assert = {
    equal(actual: unknown, expected: unknown, message: string): void {
        if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
    },
    ok(value: unknown, message: string): void {
        if (!value) throw new Error(message);
    },
};

assert.equal(
    bossAbilityPatternFor('qingshi-road', 2).kind,
    'qingshi-seal-chain',
    'qingshi boss should own the three-seal pattern',
);
assert.equal(
    bossAbilityPatternFor('bamboo-ambush', 2).kind,
    'bamboo-pincer',
    'bamboo boss should own the pincer pattern',
);
assert.equal(
    bossAbilityPatternFor('frozen-ruins', 2).kind,
    'frost-tide-slam',
    'frost boss should own the tide-linked pattern',
);

const qingshiFirst = qingshiSealPlacementsFor({ x: 0, y: 100 }, 0, 2);
const qingshiSecond = qingshiSealPlacementsFor({ x: 0, y: 100 }, 1, 2);
assert.equal(qingshiFirst.length, 3, 'qingshi chain should always place three seals');
assert.ok(qingshiFirst[0].x < qingshiFirst[2].x, 'even casts should rise from left to right');
assert.ok(qingshiSecond[0].x > qingshiSecond[2].x, 'odd casts should mirror the diagonal');

const bambooGap = bambooPincerGapFor(0, 2);
assert.equal(
    isInsideBambooPincerDanger({ x: bambooGap.centerX, y: 200 }, bambooGap, -120, 470),
    false,
    'the visible gap should remain safe',
);
assert.equal(
    isInsideBambooPincerDanger({ x: -240, y: 200 }, bambooGap, -120, 470),
    true,
    'the closed bamboo flank should deal damage',
);
assert.equal(
    isInsideBambooPincerDanger({ x: -240, y: -300 }, bambooGap, -120, 470),
    false,
    'areas outside the pincer lane should not deal damage',
);

console.log('BossAbilityRuntime tests passed');
