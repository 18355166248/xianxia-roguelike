#!/usr/bin/env node

const { basename, resolve } = require('node:path');
const { readFileSync } = require('node:fs');

const REQUIRED_STEPS = [
  'cold-start',
  'first-run-safe-area',
  'combat-inputs',
  'pause-freeze',
  'background-pause',
  'orientation-guard',
  'settings-persistence',
  'full-clear',
  'three-chapter-clear',
  'three-run-stability',
];
const PLATFORMS = ['ios', 'android'];
const STATUSES = ['pass', 'fail', 'unverified'];

function fail(message) {
  throw new Error(message);
}

function validateRecord(record, source) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) fail(`${source} 必须是对象`);
  if (record.schemaVersion !== 1) fail(`${source} schemaVersion 必须为 1`);
  for (const field of ['tester', 'capturedAt']) {
    if (typeof record[field] !== 'string' || record[field].trim() === '') fail(`${source} 缺少 ${field}`);
  }
  if (!record.device || typeof record.device !== 'object') fail(`${source} 缺少 device`);
  if (!PLATFORMS.includes(record.device.platform)) fail(`${source} device.platform 必须为 ios 或 android`);
  for (const field of ['model', 'osVersion', 'browser', 'browserVersion', 'screen']) {
    if (typeof record.device[field] !== 'string' || record.device[field].trim() === '') {
      fail(`${source} device.${field} 不能为空`);
    }
  }
  if (typeof record.device.highRefreshRate !== 'boolean') {
    fail(`${source} device.highRefreshRate 必须为布尔值`);
  }
  if (!record.results || typeof record.results !== 'object' || Array.isArray(record.results)) {
    fail(`${source} 缺少 results`);
  }
  for (const step of REQUIRED_STEPS) {
    const result = record.results[step];
    if (!result || typeof result !== 'object') fail(`${source} 缺少步骤 ${step}`);
    if (!STATUSES.includes(result.status)) fail(`${source} ${step}.status 非法`);
    if (typeof result.notes !== 'string') fail(`${source} ${step}.notes 必须为字符串`);
    if (result.evidence !== undefined && typeof result.evidence !== 'string') {
      fail(`${source} ${step}.evidence 必须为字符串`);
    }
  }
  return record;
}

function summarize(records) {
    const platformCounts = Object.fromEntries(PLATFORMS.map((platform) => [platform, 0]));
    const failures = [];
  for (const { record, source } of records) {
    platformCounts[record.device.platform] += 1;
    for (const step of REQUIRED_STEPS) {
      const status = record.results[step].status;
      if (status !== 'pass') failures.push(`${source}: ${step}=${status}`);
    }
  }
  // 发布证据必须同时来自两类物理设备；桌面响应式截图不能冒充缺失平台。
  const missingPlatforms = PLATFORMS.filter((platform) => platformCounts[platform] === 0);
  return {
    passed: missingPlatforms.length === 0 && failures.length === 0,
    platformCounts,
    missingPlatforms,
    failures,
  };
}

function formatReport(records, summary) {
  const lines = [
    '# P3 真机矩阵汇总',
    '',
    `设备记录：${records.length}；iOS：${summary.platformCounts.ios}；Android：${summary.platformCounts.android}。`,
  ];
  if (summary.missingPlatforms.length > 0) {
    lines.push('', `缺少平台：${summary.missingPlatforms.join('、')}`);
  }
  if (summary.failures.length > 0) {
    lines.push('', '未通过步骤：', ...summary.failures.map((item) => `- ${item}`));
  }
  lines.push('', summary.passed ? '结论：passed' : '结论：blocked');
  return lines.join('\n');
}

function main(paths) {
  if (paths.length === 0) {
    console.error('用法：npm run device:report -- qa/device/<真机记录>.json [更多记录.json]');
    return 2;
  }
  try {
    // 保持“未验证即失败”：只有结构完整且十步全部通过的真机记录才能打开发布门禁。
    const records = paths.map((path) => {
      const source = basename(path);
      return { source, record: validateRecord(JSON.parse(readFileSync(resolve(path), 'utf8')), source) };
    });
    const summary = summarize(records);
    console.log(formatReport(records, summary));
    return summary.passed ? 0 : 2;
  } catch (error) {
    console.error(`[device:report] ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { REQUIRED_STEPS, formatReport, main, summarize, validateRecord };
