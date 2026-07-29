# Upgradeable Skill Controls — Design QA

## Evidence

- Visual source of truth: `docs/design/upgradeable-skill-controls.png`
- Implementation screenshot: `docs/qa/upgradeable-skill-controls-live.png`
- Combined comparison: `docs/qa/upgradeable-skill-controls-comparison.png`
- Viewport: Cocos Web Mobile canvas, 523 × 685 CSS pixels at 1× density
- Source image: 853 × 1844 pixels
- State: stage 3/4, all four active abilities unlocked; sword auto-attacking, dash/formation available, tribulation fully charged

## Full-view comparison

The implementation preserves the reference hierarchy: status bar at the top, combat field as the dominant surface, right-side curved active-skill cluster, large auto-sword anchor, joystick at lower left, and the horizontal tribulation charge control above the bottom combat stats.

The reference depicts a fully upgraded cinematic cast state while the captured implementation is a live progression state. Different tier-pip counts, cooldown numbers, enemy positions, and missing peak-cast VFX in the still frame are expected state differences rather than layout drift.

## Focused review

- Skill controls remain inside the portrait safe area and do not overlap the joystick.
- Locked skills become usable controls immediately after choosing their first tier.
- Three tier markers, cooldown feedback, charge state, and auto-cast labeling remain legible at the target mobile scale.
- The dark jade, cyan, and antique-gold visual language remains consistent with the source.
- The bottom charge bar and combat-stat line no longer compete for the same vertical space.

## Interaction verification

- Auto sword attack and tier growth: passed.
- Dash unlock, activation, cooldown, and invulnerability window: passed.
- Formation unlock, radial sword cast, and cooldown: passed.
- Tribulation unlock and full-charge state: passed.
- Level-up choices prioritize missing active abilities before passive upgrades: passed.
- Restart/result flow: passed.
- TypeScript check, Cocos Web Mobile build, and browser smoke test: passed.
- Browser smoke test produced no blocking runtime errors.

## Comparison history

1. Initial implementation placed the tribulation bar too low and the combat-stat line above it, weakening the intended hierarchy.
2. Moved the charge bar from design Y −626 to −594 and the stat line from −522 to −638.
3. Rebuilt and rechecked the live canvas; the controls are now separated and readable.

No P0, P1, or P2 visual or interaction issues remain.

final result: passed

# Progressive Gesture Controls — Design QA

## Evidence

- Control explorations: `docs/design/control-concepts/control-concept-a-one-hand.png`,
  `control-concept-b-dual-zone.png`, and `control-concept-c-gesture-combo.png`
- Live implementation: `docs/qa/progressive-controls-directional-live.png`
- Combined comparison: `docs/qa/progressive-controls-comparison.png`
- State: sword tier 2, directional drag attack available; dash and formation unlocked

## Product decision

The three concepts are treated as progressive depth rather than randomized layouts. The fixed one-hand
layout from concept A remains the spatial anchor. Sword tier 2 adopts concept B's directional intent, and
tier 3 adopts concept C's hold gesture. This preserves muscle memory while letting action depth grow with
the build.

## Interaction verification

- Tier 1 automatic targeting and tap strike: passed.
- Tier 2 drag direction resolution and aimed volley: passed.
- Tier 3 hold threshold and charged-slash routing: passed by runtime regression test.
- Fast joystick flick only routes to dash after the skill is unlocked: passed by runtime regression test.
- Action priority prevents hit, dash, formation, tribulation, and attack poses from overwriting each other:
  passed.
- Upgrade modal blocks combat touches: passed.
- TypeScript check, gesture/action tests, Cocos Web Mobile build, and browser smoke test: passed.
- Browser smoke test produced no warnings or errors.

The live game intentionally keeps the existing compact jade-and-gold HUD rather than copying the concept
art's oversized callouts. Skill anchors, thumb reach, dark cyan palette, and the right-side combat hierarchy
remain consistent with the selected direction.

No P0, P1, or P2 visual or interaction issues remain.

final result: passed
