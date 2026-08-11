#!/usr/bin/env node

const { existsSync } = require('fs');
const { join, resolve } = require('path');
const { spawnSync } = require('child_process');

const projectRoot = resolve(__dirname, '..');
const tscCandidates = [
  join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc'),
  process.env.TSC_PATH,
];

const testFiles = [
  'temp/skill-tests/tests/PlayerActionRuntime.test.js',
  'temp/skill-tests/tests/SpiritVeinRuntime.test.js',
  'temp/skill-tests/tests/MapObstacleRuntime.test.js',
  'temp/skill-tests/tests/QingshiRouteRuntime.test.js',
  'temp/skill-tests/tests/BambooRouteRuntime.test.js',
  'temp/skill-tests/tests/EnemyAnimationRuntime.test.js',
  'temp/skill-tests/tests/BossAbilityRuntime.test.js',
  'temp/skill-tests/tests/BossFinishRuntime.test.js',
  'temp/skill-tests/tests/BossPhaseRuntime.test.js',
  'temp/skill-tests/tests/FrostTideRuntime.test.js',
  'temp/skill-tests/tests/FrostRouteRuntime.test.js',
  'temp/skill-tests/tests/UpgradeChoiceRuntime.test.js',
  'temp/skill-tests/tests/CultivationBuildRuntime.test.js',
  'temp/skill-tests/tests/CombatFlowRuntime.test.js',
  'temp/skill-tests/tests/HitStopRuntime.test.js',
  'temp/skill-tests/tests/ImpactVfxRuntime.test.js',
  'temp/skill-tests/tests/MapEventRuntime.test.js',
  'temp/skill-tests/tests/RunStatsRuntime.test.js',
  'temp/skill-tests/tests/StageProgressRuntime.test.js',
  'temp/skill-tests/tests/StageEntryPresentationRuntime.test.js',
  'temp/skill-tests/tests/OpeningObjectiveRuntime.test.js',
  'temp/skill-tests/tests/EliteEncounterRuntime.test.js',
  'temp/skill-tests/tests/ResultPresentationRuntime.test.js',
  'temp/skill-tests/tests/GameSettingsRuntime.test.js',
  'temp/skill-tests/tests/AudioCueRuntime.test.js',
  'temp/skill-tests/tests/BalanceTelemetryRuntime.test.js',
  'temp/skill-tests/tests/DevicePresentationRuntime.test.js',
  'temp/skill-tests/tests/SkillRuntime.test.js',
];

const resolveTscCommand = () => {
  for (const candidate of tscCandidates) {
    if (!candidate) continue;
    if (existsSync(candidate)) return candidate;
  }
  return null;
};

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: projectRoot,
    shell: options.shell ?? false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status);
  }
}

const tscCommand = resolveTscCommand();
if (!tscCommand) {
  console.error('[test:skills] 未检测到本地 TypeScript。请先在仓库内安装 TypeScript 依赖：npm install --save-dev typescript');
  process.exit(1);
}

runCommand(process.execPath, [tscCommand, '-p', 'tsconfig.skill-tests.json']);

for (const testFile of testFiles) {
  runCommand(process.execPath, [testFile]);
}

runCommand(process.execPath, ['scripts/analyze-balance-samples.test.cjs']);
