import fs from 'node:fs';
import path from 'node:path';

const required = [
  'index.html',
  'src/game.js',
  'src/actors.js',
  'src/levels.js',
  'src/audio.js',
  'public/assets/audio/sanguo-battle-theme.mp3',
  'public/assets/audio/sanguo-boss-pressure.mp3',
  'public/assets/audio/combat/blade-swing-01.mp3',
  'public/assets/audio/combat/blade-swing-02.mp3',
  'public/assets/audio/combat/polearm-swing-01.mp3',
  'public/assets/audio/combat/polearm-swing-02.mp3',
  'public/assets/audio/combat/bow-release-01.mp3',
  'public/assets/audio/combat/bow-release-02.mp3',
  'public/assets/audio/combat/hit-body-01.mp3',
  'public/assets/audio/combat/hit-body-02.mp3',
  'public/assets/audio/combat/hit-armor-01.mp3',
  'public/assets/audio/combat/hit-armor-02.mp3',
  'public/assets/audio/combat/hit-heavy-01.mp3',
  'public/assets/audio/combat/hit-heavy-02.mp3',
  'public/assets/audio/combat/skill-wind-01.mp3',
  'public/assets/audio/combat/skill-impact-01.mp3',
  'public/assets/audio/combat/ultimate-blade-01.mp3',
  ...Array.from({ length: 10 }, (_, i) => `public/assets/backgrounds/level-${String(i + 1).padStart(2, '0')}.webp`),
  ...['guanyu', 'zhangfei', 'zhaoyun', 'huangzhong'].map(id => `public/assets/characters/${id}/atlas.webp`),
  ...['01-chengyuanzhi','02-huaxiong','03-lvbu','04-xiahoudun','05-caoren','06-xuchu','07-ganning','08-xiahouyuan','09-luxun','10-simayi'].flatMap(id => [
    `public/assets/bosses/animated/${id}/atlas.webp`,
    `public/assets/bosses/animated/${id}/manifest.json`,
  ]),
];

let bad = 0;
for (const file of required) {
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
    console.error('missing or empty:', file);
    bad++;
  }
}

const { HEROES, MONSTERS, BOSSES } = await import('../src/actors.js');
const { LEVELS } = await import('../src/levels.js');
const { COMBAT_AUDIO } = await import('../src/audio.js');

const expectedCombatAudio = 15;
const combatAudioFiles = Object.values(COMBAT_AUDIO).flat();
if (combatAudioFiles.length !== expectedCombatAudio || new Set(combatAudioFiles).size !== expectedCombatAudio) {
  throw new Error('combat audio manifest mismatch');
}
for (const file of combatAudioFiles) {
  const asset = `public/assets/audio/combat/${file}`;
  if (!required.includes(asset)) throw new Error(`combat audio not smoke-tested: ${file}`);
  if (fs.statSync(asset).size > 100 * 1024) throw new Error(`combat audio too large: ${file}`);
}
if (fs.statSync('public/assets/audio/sanguo-boss-pressure.mp3').size > 1024 * 1024) {
  throw new Error('boss pressure loop exceeds 1 MiB budget');
}

const heroIds = ['guanyu', 'zhangfei', 'zhaoyun', 'huangzhong'];
if (JSON.stringify(Object.keys(HEROES)) !== JSON.stringify(heroIds)) throw new Error('hero roster mismatch');
if (MONSTERS.length !== 30) throw new Error('monsters != 30');
if (new Set(MONSTERS.map(x => x.name)).size !== 30) throw new Error('monster names are not unique');
if (BOSSES.length !== 10) throw new Error('bosses != 10');
if (new Set(BOSSES.map(x => x.name)).size !== 10) throw new Error('boss names are not unique');
for (const boss of BOSSES) {
  if (boss.atlasCols !== 4 || boss.atlasRows !== 3) throw new Error(`${boss.name} animated atlas grid mismatch`);
  for (const state of ['idle','move','intro','windup','attack0','attack1','attack2','recover','hurt','phase','death']) {
    if (!Array.isArray(boss.frames?.[state]) || boss.frames[state].length === 0) throw new Error(`${boss.name} missing ${state} frames`);
  }
  const manifestPath = `public/${boss.atlas.replace('atlas.webp','manifest.json')}`;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.cols !== 4 || manifest.rows !== 3 || manifest.id !== boss.key || manifest.repacked !== true) throw new Error(`${boss.name} manifest mismatch`);
}
if (LEVELS.length !== 10) throw new Error('levels != 10');
for (const [index, level] of LEVELS.entries()) {
  const combatWaves = level.waves.filter(wave => Array.isArray(wave.enemies));
  const bossWave = level.waves.at(-1);
  if (level.id !== index + 1 || combatWaves.length < 4 || combatWaves.length > 8 || bossWave.boss !== index) {
    throw new Error(`level ${index + 1} progression mismatch`);
  }
  if (index > 0 && level.length <= LEVELS[index - 1].length) throw new Error(`level ${index + 1} length curve is not increasing`);
  if (bossWave.at < level.length * .9 || bossWave.at > level.length) throw new Error(`level ${index + 1} boss position invalid`);
  if (!combatWaves.every(wave => wave.title && wave.enemies.length >= 4)) throw new Error(`level ${index + 1} wave design incomplete`);
  if (!level.story?.every(Boolean)) throw new Error(`level ${index + 1} story incomplete`);
}

const html = fs.readFileSync('index.html', 'utf8');
for (const key of ['WASD', 'SPACE', 'J / K / L', 'mobile-controls']) {
  if (!html.includes(key)) throw new Error(`control/UI marker missing: ${key}`);
}
const legacy = ['xiyou-battle-theme', '此劫未渡', '沙僧图集'];
const textFiles = ['index.html', 'src/game.js', 'ASSET_MANIFEST.md', 'ITERATIONS.md'];
for (const file of textFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const marker of legacy) if (text.includes(marker)) throw new Error(`legacy marker ${marker} remains in ${file}`);
}

if (bad) process.exit(1);
const assetBytes = required.filter(x => x.startsWith('public/')).reduce((sum, file) => sum + fs.statSync(file).size, 0);
console.log(`Smoke checks passed: 4 heroes, 30 monsters, 10 bosses, 10 levels, 15 combat samples; required assets ${(assetBytes / 1024 / 1024).toFixed(2)} MiB.`);
