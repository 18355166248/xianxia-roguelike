const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const rasterExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const runtimeImageRoot = path.join(projectRoot, 'assets', 'resources', 'art');
const docsRoot = path.join(projectRoot, 'docs');
const remoteCatalogPath = path.join(projectRoot, 'assets', 'scripts', 'config', 'RemoteAssetCatalog.ts');
const maxRuntimeImageBytes = 700 * 1024;
const maxRuntimeTotalBytes = 1.25 * 1024 * 1024;

function collectRasterImages(directory) {
    if (!fs.existsSync(directory)) return [];
    const files = [];
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...collectRasterImages(fullPath));
        else if (entry.isFile() && rasterExtensions.has(path.extname(entry.name).toLowerCase())) files.push(fullPath);
    }
    return files;
}

function relative(filePath) {
    return path.relative(projectRoot, filePath);
}

const docImages = collectRasterImages(docsRoot);
const runtimeImages = collectRasterImages(runtimeImageRoot);
const remoteCatalog = fs.readFileSync(remoteCatalogPath, 'utf8');
const runtimeImagesWithoutCdn = runtimeImages.filter((filePath) => {
    const resourcePath = `${path.relative(path.join(projectRoot, 'assets', 'resources'), filePath).replace(/\\/g, '/').replace(/\.[^.]+$/, '')}/spriteFrame`;
    return !remoteCatalog.includes(`'${resourcePath}': 'https://`);
});
const oversizedRuntimeImages = runtimeImages.filter(
    (filePath) => fs.statSync(filePath).size > maxRuntimeImageBytes,
);
const runtimeTotalBytes = runtimeImages.reduce(
    (total, filePath) => total + fs.statSync(filePath).size,
    0,
);

const errors = [];
// 文档截图必须先上传 CDN 再写入 REMOTE_IMAGE_MANIFEST，避免评审历史持续推高仓库体积。
if (docImages.length > 0) {
    errors.push(`docs 中禁止提交本地位图，请压缩上传 CDN 后删除：\n${docImages.map(relative).join('\n')}`);
}
if (runtimeImagesWithoutCdn.length > 0) {
    errors.push(`运行时图片必须先上传 CDN 并登记 RemoteAssetCatalog：\n${runtimeImagesWithoutCdn.map(relative).join('\n')}`);
}
if (oversizedRuntimeImages.length > 0) {
    errors.push(`运行时单图不得超过 700 KiB：\n${oversizedRuntimeImages.map(relative).join('\n')}`);
}
if (runtimeTotalBytes > maxRuntimeTotalBytes) {
    errors.push(`运行时图片总量 ${(runtimeTotalBytes / 1024 / 1024).toFixed(2)} MiB，超过 1.25 MiB 预算`);
}

if (errors.length > 0) {
    console.error(`Image budget check failed:\n${errors.join('\n\n')}`);
    process.exit(1);
}

console.log(
    `Image budget passed: docs=CDN-only, runtime=${runtimeImages.length} files/${(runtimeTotalBytes / 1024 / 1024).toFixed(2)} MiB`,
);
