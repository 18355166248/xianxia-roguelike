/**
 * 大体积美术使用内容寻址 CDN；URL 为每次上传生成的不可变地址，可交给浏览器和 Cocos 缓存。
 * 逻辑仍使用 resources 路径作为稳定 key，避免 CDN 迁移波及业务配置。
 */
export const REMOTE_SPRITE_URLS: Readonly<Record<string, string>> = {
    'art/obstacles/bamboo-barricade/spriteFrame': 'https://audiopaytest.cos.tx.xmcdn.com/storages/69ad-audiotest/7C/E6/GAqSpGcORdXgAAVQ5QACEFeE.png',
    'art/ui/qinglan-hud-portrait-transparent-v2/spriteFrame': 'https://audiopaytest.cos.tx.xmcdn.com/storages/7a55-audiotest/4F/A3/GAqSoUUORdXgAAH3VgACEFeF.png',
    'art/backgrounds/frozen-ruins/spriteFrame': 'https://audiopaytest.cos.tx.xmcdn.com/storages/a4e8-audiotest/DB/D0/GAqSpGcORdXhAAs5kQACEFeG.png',
    'art/backgrounds/qingshi-road/spriteFrame': 'https://audiopaytest.cos.tx.xmcdn.com/storages/b8b1-audiotest/E4/16/GAqSoUUORdXiAAgg0wACEFeH.png',
    'art/backgrounds/bamboo-ambush/spriteFrame': 'https://audiopaytest.cos.tx.xmcdn.com/storages/11d9-audiotest/4E/F3/GAqSpGcORdXiABAAAAACEFeI.png',
    'art/bosses/shanxiao-actions/spriteFrame': 'https://audiopaytest.cos.tx.xmcdn.com/storages/bc27-audiotest/E0/7C/GAqSpGcORdXjAAeU1wACEFeK.png',
    'art/bosses/hanyuan-shanxiao-actions/spriteFrame': 'https://audiopaytest.cos.tx.xmcdn.com/storages/bf04-audiotest/A6/11/GAqSoUUORdXkAAgeWwACEFeL.png',
    'art/characters/qinglan-actions/spriteFrame': 'https://audiopaytest.cos.tx.xmcdn.com/storages/8fa8-audiotest/AC/3F/GAqSpGcORdXkAAbpNwACEFeM.png',
    'art/effects/qingshi-stele-commit/spriteFrame': 'https://audiopaytest.cos.tx.xmcdn.com/storages/4383-audiotest/B3/EB/GAqSoUUORdXlAAnFvgACEFeN.png',
    'art/effects/frost-seal-commit/spriteFrame': 'https://audiopaytest.cos.tx.xmcdn.com/storages/5ed0-audiotest/79/58/GAqSpGcORdXmAAQYugACEFeO.png',
    'art/effects/bamboo-burn-commit/spriteFrame': 'https://audiopaytest.cos.tx.xmcdn.com/storages/4c4f-audiotest/8F/3C/GAqSoUUORdXmAAbVbwACEFeP.png',
    'art/effects/bamboo-shadow-commit/spriteFrame': 'https://audiopaytest.cos.tx.xmcdn.com/storages/c21e-audiotest/4F/39/GAqSpGcORdXnAAHN6QACEFeQ.png',
    'art/effects/hanyuan-frost-impact/spriteFrame': 'https://audiopaytest.cos.tx.xmcdn.com/storages/fd45-audiotest/B0/3F/GAqSoUUORdXnAAk30AACEFeR.png',
    'art/effects/qingshi-spring-commit/spriteFrame': 'https://audiopaytest.cos.tx.xmcdn.com/storages/04cb-audiotest/6B/A1/GAqSpGcORdXoAANEFAACEFeS.png',
    'art/effects/frost-tide-commit/spriteFrame': 'https://audiopaytest.cos.tx.xmcdn.com/storages/636e-audiotest/19/6B/GAqSoUUORdXpAAS_1QACEFeT.png',
    'art/enemies/bamboo-warden/spriteFrame': 'https://audiopaytest.cos.tx.xmcdn.com/storages/d990-audiotest/0D/ED/GAqSpGcORdXqAAYAbQACEFeU.png',
};
