#!/usr/bin/env node

const { existsSync, readdirSync, readFileSync, statSync } = require('fs');
const { join, resolve } = require('path');
const { spawnSync } = require('child_process');

const projectRoot = resolve(__dirname, '..');
const defaultCreator = '/Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator';
const creator = process.env.COCOS_CREATOR_BIN || defaultCreator;

if (!existsSync(creator)) {
  console.error(`[build:web] 未找到 Cocos Creator：${creator}`);
  console.error('[build:web] 可通过 COCOS_CREATOR_BIN 指向 3.8.8 可执行文件。');
  process.exit(1);
}

const startedAt = Date.now();
const result = spawnSync(creator, [
  '--project',
  projectRoot,
  '--build',
  'platform=web-mobile;debug=false',
], {
  cwd: projectRoot,
  stdio: 'inherit',
});

if (result.error) {
  console.error(`[build:web] Creator 启动失败：${result.error.message}`);
  process.exit(1);
}

const logDir = join(projectRoot, 'temp', 'builder', 'log');
const latestLog = existsSync(logDir)
  ? readdirSync(logDir)
    .filter((name) => name.startsWith('web-mobile') && name.endsWith('.log'))
    .map((name) => ({ path: join(logDir, name), mtime: statSync(join(logDir, name)).mtimeMs }))
    .filter((entry) => entry.mtime >= startedAt - 2000)
    .sort((a, b) => b.mtime - a.mtime)[0]
  : undefined;

const logText = latestLog ? readFileSync(latestLog.path, 'utf8') : '';
const finished = logText.includes('build Task (web-mobile) Finished');

// Creator 3.8.8 在当前 macOS 环境中成功后固定返回 36；必须同时看到本次新日志的完成标记，
// 不能仅吞掉退出码或误用上一次构建日志。
if (!finished) {
  console.error(`[build:web] 构建未完成（Creator exit ${result.status ?? 'unknown'}）。`);
  if (latestLog) console.error(`[build:web] 日志：${latestLog.path}`);
  process.exit(result.status && result.status !== 36 ? result.status : 1);
}

console.log(`[build:web] 正式 Web Mobile 构建通过：${latestLog.path}`);
if (result.status !== 0 && result.status !== 36) {
  console.error(`[build:web] 完成日志存在，但 Creator 返回异常退出码 ${result.status}。`);
  process.exit(result.status || 1);
}
