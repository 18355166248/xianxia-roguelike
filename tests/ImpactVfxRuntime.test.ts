import {
    easeInQuad,
    easeOutCubic,
    easeOutQuint,
    glowStrokeLayers,
    impactExpansion,
    impactFade,
    impactShardLayout,
    shardTravel,
    trailSegmentWidths,
} from '../assets/scripts/systems/ImpactVfxRuntime';

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
}

for (const ease of [easeOutCubic, easeOutQuint, easeInQuad]) {
    assert(ease(0) === 0 && ease(1) === 1, 'easing curves must stay anchored at both ends');
    assert(ease(-3) === 0 && ease(9) === 1, 'easing curves must clamp out-of-range input');
}
assert(easeOutQuint(0.3) > easeOutCubic(0.3), 'quint should front-load more of the motion than cubic');
assert(easeInQuad(0.3) < 0.3, 'ease-in should start slower than linear');

assert(impactExpansion(0.15) > 0.4, 'impacts must reach most of their size almost immediately');
assert(impactFade(0.2) === 1, 'an impact should stay fully opaque long enough to be read');
assert(impactFade(1) === 0, 'an impact must fully fade by the end of its life');
assert(impactFade(0.6) > impactFade(0.9), 'fade must be monotonic once it starts');

const layers = glowStrokeLayers(4, 240, 2);
assert(layers.length === 3, 'two halos plus a core should produce three stroke passes');
assert(
    layers[0].width > layers[1].width && layers[1].width > layers[2].width,
    'halo passes must be drawn widest first so the bright core lands on top',
);
assert(
    layers[0].alpha < layers[2].alpha && layers[2].alpha === 240,
    'the core keeps the requested alpha while halos stay faint',
);
assert(glowStrokeLayers(3, 200, 0).length === 1, 'a zero-halo glow degrades to a single stroke');
assert(glowStrokeLayers(3, 4, 3).every((layer) => layer.alpha >= 1), 'halo alpha must never round to invisible');

const ringShards = impactShardLayout(8, 42, { reach: 60 });
assert(ringShards.length === 8, 'shard layout should honour the requested count');
assert(
    ringShards.every((shard) => shard.distance >= 60 * 0.62 && shard.distance <= 60),
    'shards must stay inside the requested reach',
);
assert(
    new Set(ringShards.map((shard) => shard.delay)).size > 1,
    'shards need staggered departures or the burst reads as one scaling sprite',
);
const repeat = impactShardLayout(8, 42, { reach: 60 });
assert(
    repeat.every((shard, index) => shard.angle === ringShards[index].angle),
    'the same seed must always produce the same burst',
);
assert(
    impactShardLayout(8, 43, { reach: 60 })[0].angle !== ringShards[0].angle,
    'different seeds must produce different bursts',
);

const cone = impactShardLayout(12, 7, { reach: 80, direction: 0, spread: Math.PI * 0.5 });
assert(
    cone.every((shard) => Math.abs(shard.angle) <= Math.PI * 0.25 + 1e-6),
    'directional bursts must stay inside the requested cone',
);
assert(impactShardLayout(0, 1, { reach: 10 }).length === 0, 'a zero-count burst produces no shards');

assert(shardTravel(0.1, 0.2) === 0, 'a shard must not move before its delay elapses');
assert(shardTravel(1, 0.2) === 1, 'every shard still completes its travel by the end of the effect');
assert(shardTravel(0.6, 0) > shardTravel(0.6, 0.3), 'later shards trail behind earlier ones');

const widths = trailSegmentWidths(8, 5);
assert(widths.length === 5, 'trail should produce the requested segment count');
assert(widths[0] === 8, 'the trail head keeps the full width');
assert(
    widths.every((width, index) => index === 0 || width < widths[index - 1]),
    'a trail must taper, otherwise it reads as a stick rather than a sword arc',
);
assert(widths[widths.length - 1] > 0, 'trail segments must stay drawable');

console.log('ImpactVfxRuntime tests passed');
