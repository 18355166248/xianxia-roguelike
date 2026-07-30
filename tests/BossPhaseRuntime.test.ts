import {
    BOSS_PHASE_TWO_THRESHOLD,
    bossEntranceRiskFor,
    bossPhasePresentationFor,
} from '../assets/scripts/systems/BossPhaseRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

assert(BOSS_PHASE_TWO_THRESHOLD === 0.55, 'boss phase threshold should match combat transition logic');
assert(
    bossEntranceRiskFor('qingshi-road').includes('三叠地脉'),
    'qingshi boss entrance should preview the seal chain',
);
assert(
    bossEntranceRiskFor('bamboo-ambush').includes('竹影合围'),
    'bamboo boss entrance should preview the pincer',
);
assert(
    bossEntranceRiskFor('frozen-ruins').includes('唤潮落印'),
    'frozen boss entrance should preview its environment-linked phase risk',
);
const bambooPhaseOne = bossPhasePresentationFor('bamboo-ambush', 1);
assert(bambooPhaseOne.bossName === '竹心山魈', 'bamboo boss should keep its chapter-specific name');
assert(bambooPhaseOne.hudDetail.includes('55% 入狂相'), 'phase one HUD should expose the next threshold');
const bambooPhaseTwo = bossPhasePresentationFor('bamboo-ambush', 2);
assert(bambooPhaseTwo.phaseIndex === 2, 'phase two presentation should expose the active stage');
assert(bambooPhaseTwo.hudDetail.includes('合围收隙'), 'phase two HUD should expose the tighter gap');
const frostPhaseTwo = bossPhasePresentationFor('frozen-ruins', 2);
assert(frostPhaseTwo.phaseName === '寒狱相', 'frozen phase two should use its own readable name');
assert(frostPhaseTwo.transitionDetail.includes('冻尸增援'), 'frozen transition should name its reinforcement');

console.log('BossPhaseRuntime tests passed');
