#!/usr/bin/env node

const { readFileSync } = require('fs');
const { basename, resolve } = require('path');

const STAGES = [
  { id: 'qingshi-road', name: '第一章·青石山道' },
  { id: 'bamboo-ambush', name: '第二章·竹林伏击' },
  { id: 'frozen-ruins', name: '第三章·寒霜遗迹' },
];
const BUILD_PATHS = ['edge', 'mystic', 'vitality'];

function fail(message) {
  throw new Error(message);
}

function validateSample(sample, source, index) {
  const at = `${source} 第 ${index + 1} 条`;
  if (!sample || typeof sample !== 'object' || Array.isArray(sample)) fail(`${at}不是对象`);
  if (!STAGES.some((stage) => stage.id === sample.stage)) fail(`${at}包含未知章节 ${String(sample.stage)}`);
  if (typeof sample.victory !== 'boolean') fail(`${at}的 victory 必须是布尔值`);
  for (const field of ['durationSeconds', 'damageTaken', 'maxHp', 'buildTier']) {
    if (typeof sample[field] !== 'number' || !Number.isFinite(sample[field])) fail(`${at}的 ${field} 必须是有限数字`);
  }
  if (sample.durationSeconds < 0 || sample.damageTaken < 0 || sample.maxHp <= 0 || sample.buildTier < 0) {
    fail(`${at}包含越界数值`);
  }
  if (sample.routeChoiceId !== undefined && typeof sample.routeChoiceId !== 'string') {
    fail(`${at}的 routeChoiceId 必须是字符串`);
  }
  if (sample.buildPath !== undefined && !BUILD_PATHS.includes(sample.buildPath)) {
    fail(`${at}包含未知主修 ${String(sample.buildPath)}`);
  }
  if (sample.sampleId !== undefined && (typeof sample.sampleId !== 'string' || sample.sampleId.trim() === '')) {
    fail(`${at}的 sampleId 必须是非空字符串`);
  }
  return { ...sample, buildTier: Math.floor(sample.buildTier) };
}

function samplesFromPayload(payload, source) {
  if (!Array.isArray(payload) && payload?.schemaVersion !== 1) {
    fail(`${source}包含不支持的样本包版本 ${String(payload?.schemaVersion)}`);
  }
  const samples = Array.isArray(payload) ? payload : payload.samples;
  if (!Array.isArray(samples)) fail(`${source}必须是样本数组，或包含 samples 数组的对象`);
  return samples.map((sample, index) => validateSample(sample, source, index));
}

function deduplicateSamples(samples) {
  const seenIds = new Set();
  const unique = [];
  let duplicateCount = 0;
  for (const sample of samples) {
    // 旧版裸数组没有 ID，只能原样保留；新版样本包则可跨文件可靠去重。
    if (sample.sampleId && seenIds.has(sample.sampleId)) {
      duplicateCount += 1;
      continue;
    }
    if (sample.sampleId) seenIds.add(sample.sampleId);
    unique.push(sample);
  }
  return { samples: unique, duplicateCount };
}

function median(values) {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function countBy(samples, field) {
  return samples.reduce((counts, sample) => {
    const key = sample[field];
    if (key) counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function verdictFor(summary, minimumSamples = 10) {
  if (summary.sampleCount < minimumSamples) return 'collecting';
  if (summary.winRate > 0.8) return 'too-easy';
  if (summary.winRate < 0.3) return 'too-hard';
  if (summary.medianVictorySeconds < 150 || summary.medianVictorySeconds > 300) return 'pace-outlier';
  if (Object.keys(summary.routeCounts).length < 2 || Object.keys(summary.buildCounts).length < BUILD_PATHS.length) {
    return 'coverage-gap';
  }
  return 'healthy';
}

function analyzeSamples(samples, minimumSamples = 10) {
  return STAGES.map((stage) => {
    const stageSamples = samples.filter((sample) => sample.stage === stage.id);
    const victories = stageSamples.filter((sample) => sample.victory);
    const summary = {
      stage,
      sampleCount: stageSamples.length,
      victories: victories.length,
      winRate: stageSamples.length === 0 ? 0 : victories.length / stageSamples.length,
      medianVictorySeconds: median(victories.map((sample) => sample.durationSeconds)),
      averageDamageRatio: stageSamples.length === 0
        ? 0
        : stageSamples.reduce((sum, sample) => sum + sample.damageTaken / sample.maxHp, 0) / stageSamples.length,
      routeCounts: countBy(stageSamples, 'routeChoiceId'),
      // 与游戏内报告保持一致：构筑覆盖必须由通关局证明。
      buildCounts: countBy(victories, 'buildPath'),
    };
    return { ...summary, verdict: verdictFor(summary, minimumSamples) };
  });
}

function formatDuration(seconds) {
  if (seconds === undefined) return '--:--';
  return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;
}

function formatKeys(counts, expected) {
  return `${Object.keys(counts).length}/${expected}`;
}

function formatMarkdown(reports, sourceNames, sampleCount, duplicateCount = 0) {
  const lines = [
    '# P3 数值样本汇总',
    '',
    `来源：${sourceNames.join('、')}；有效对局：${sampleCount}；按唯一标识去重：${duplicateCount}。`,
    '',
    '| 章节 | 样本 | 胜率 | 胜利中位局长 | 平均承伤 | 路线 | 通关构筑 | 结论 |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
  ];
  for (const report of reports) {
    lines.push(`| ${report.stage.name} | ${report.sampleCount} | ${Math.round(report.winRate * 100)}% | ${formatDuration(report.medianVictorySeconds)} | ${Math.round(report.averageDamageRatio * 100)}% | ${formatKeys(report.routeCounts, 2)} | ${formatKeys(report.buildCounts, 3)} | ${report.verdict} |`);
  }
  lines.push('', '结论为 `healthy` 才通过本章首轮验收；其他状态按 `docs/P3_DEVICE_QA.md` 调整或补样。');
  return lines.join('\n');
}

function main(args) {
  const strict = args.includes('--strict');
  const paths = args.filter((arg) => arg !== '--strict');
  if (paths.length === 0) {
    console.error('用法：npm run balance:report -- [--strict] <样本.json> [更多样本.json]');
    return 1;
  }
  try {
    const samples = [];
    for (const path of paths) {
      const source = basename(path);
      const payload = JSON.parse(readFileSync(resolve(path), 'utf8'));
      samples.push(...samplesFromPayload(payload, source));
    }
    const deduplicated = deduplicateSamples(samples);
    const reports = analyzeSamples(deduplicated.samples);
    console.log(formatMarkdown(reports, paths.map((path) => basename(path)), deduplicated.samples.length, deduplicated.duplicateCount));
    return strict && reports.some((report) => report.verdict !== 'healthy') ? 2 : 0;
  } catch (error) {
    console.error(`[balance:report] ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = {
  analyzeSamples,
  deduplicateSamples,
  formatMarkdown,
  main,
  samplesFromPayload,
};
