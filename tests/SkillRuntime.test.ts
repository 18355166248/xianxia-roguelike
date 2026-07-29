import {
    getDashCooldown,
    getDashDistance,
    getFormationSpec,
    getTribulationRequiredHold,
    SkillRuntime,
} from '../assets/scripts/systems/SkillRuntime';

function assertEqual<T>(actual: T, expected: T, message: string): void {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
    }
}

function assertClose(actual: number, expected: number, message: string): void {
    if (Math.abs(actual - expected) > 1e-9) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

const skills = new SkillRuntime();
skills.reset();
assertEqual(skills.getLevel('sword'), 1, 'reset should unlock sword');
assertEqual(skills.getLevel('dash'), 0, 'reset should keep dash locked');

assertEqual(skills.upgrade('dash'), 1, 'dash first tier');
assertEqual(skills.upgrade('dash'), 2, 'dash second tier');
assertEqual(skills.upgrade('dash'), 3, 'dash third tier');
assertEqual(skills.upgrade('dash'), 3, 'dash should stay capped');
assertEqual(getDashDistance(3), 230, 'dash tier-three distance');
skills.markDashUsed(3);
assertEqual(skills.dashCooldown, getDashCooldown(3), 'dash cooldown starts from tier rule');
skills.tick(0.5);
assertClose(skills.dashCooldown, 3, 'dash cooldown ticks down');

assertEqual(skills.upgrade('formation'), 1, 'formation unlock');
const formation = getFormationSpec(1);
skills.markFormationUsed(1);
assertEqual(skills.formationCooldown, formation.cooldown, 'formation cooldown starts from tier rule');

assertEqual(skills.upgrade('tribulation'), 1, 'tribulation unlock');
assertEqual(skills.tribulationCharge, 1, 'tribulation unlock grants a ready cast');
assertEqual(skills.beginTribulationHold(), true, 'full charge starts channeling');
assertEqual(
    skills.tick(getTribulationRequiredHold(1) - 0.01),
    false,
    'tribulation should not cast before hold threshold',
);
assertEqual(skills.tick(0.02), true, 'tribulation casts after hold threshold');
skills.markTribulationCast();
assertEqual(skills.tribulationCharge, 0, 'cast consumes charge');
assertEqual(skills.tribulationHolding, false, 'cast stops channeling');
skills.addTribulationCharge(0.4);
assertEqual(skills.tribulationCharge, 0.4, 'combat events recharge tribulation');

console.log('SkillRuntime tests passed');
