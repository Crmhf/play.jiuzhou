import fs from 'node:fs';

const required = [
  'index.html', 'src/game.js', 'src/actors.js', 'src/levels.js', 'src/audio.js',
  'public/assets/audio/jiuzhou-theme.mp3', 'public/assets/audio/jiuzhou-boss.mp3',
  'public/assets/audio/combat/blade-swing-01.mp3', 'public/assets/audio/combat/blade-swing-02.mp3',
  'public/assets/audio/combat/polearm-swing-01.mp3', 'public/assets/audio/combat/polearm-swing-02.mp3',
  'public/assets/audio/combat/hit-body-01.mp3', 'public/assets/audio/combat/hit-body-02.mp3',
  'public/assets/audio/combat/hit-armor-01.mp3', 'public/assets/audio/combat/hit-armor-02.mp3',
  'public/assets/audio/combat/hit-heavy-01.mp3', 'public/assets/audio/combat/hit-heavy-02.mp3',
  'public/assets/audio/combat/skill-wind-01.mp3', 'public/assets/audio/combat/skill-impact-01.mp3',
  'public/assets/audio/combat/ultimate-blade-01.mp3',
  'public/assets/characters/heling/atlas.webp', 'public/assets/characters/heling/manifest.json',
  'public/assets/characters/yanshuo/atlas.webp', 'public/assets/characters/yanshuo/manifest.json',
  'public/assets/characters/shutong/atlas.webp', 'public/assets/characters/shutong/manifest.json',
  'public/assets/characters/xuanhong/atlas.webp', 'public/assets/characters/xuanhong/manifest.json',
  'public/assets/characters/guanyu/atlas.webp', 'public/assets/bosses/group-2/atlas.webp',
  'public/assets/portraits/heling.webp', 'public/assets/portraits/yanshuo.webp', 'public/assets/portraits/shutong.webp', 'public/assets/portraits/xuanhong.webp', 'public/assets/ui/portrait-frame.webp',
  'public/assets/ui/select-banner.webp', 'public/assets/ui/story-frame.webp',
  'public/assets/backgrounds/jiuzhou-spring-village.webp', 'public/assets/backgrounds/jiuzhou-thunder-bamboo.webp', 'public/assets/backgrounds/jiuzhou-water-town.webp',
  'tools/repack-character-atlas.py',
];
let bad = 0;
for (const file of required) {
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) { console.error('missing or empty:', file); bad++; }
}
const { HEROES, MONSTERS, BOSSES } = await import('../src/actors.js');
const { LEVELS, TRAP_TYPES } = await import('../src/levels.js');
const { COMBAT_AUDIO } = await import('../src/audio.js');
const heroIds = ['heling', 'yanshuo', 'shutong', 'xuanhong'];
if (JSON.stringify(Object.keys(HEROES)) !== JSON.stringify(heroIds)) throw new Error('hero roster mismatch');
const genders = Object.values(HEROES).map(hero => hero.gender);
if (genders.filter(gender => gender === '男').length !== 2 || genders.filter(gender => gender === '女').length !== 2) throw new Error('hero gender balance mismatch');
for (const hero of Object.values(HEROES)) {
  for (const action of ['attack1','attack2','attack3','skill','ultimate']) {
    const frames = hero.frames?.[action];
    if (!Array.isArray(frames) || frames.length < 2 || frames.some(frame => !Number.isInteger(frame) || frame < 0 || frame >= hero.atlasCols * hero.atlasRows)) throw new Error(`${hero.name} ${action} action frames incomplete`);
  }
}
if (MONSTERS.length !== 10 || new Set(MONSTERS.map(x => x.name)).size !== 10) throw new Error('enemy roster mismatch');
if (BOSSES.length !== 1 || BOSSES[0].name !== '春雷木魈') throw new Error('boss roster mismatch');
if (LEVELS.length !== 3 || LEVELS.map(x => x.id).join(',') !== '1,2,3') throw new Error('level roster mismatch');
if (Object.keys(TRAP_TYPES).length !== 3) throw new Error('trap roster mismatch');
for (const [index, level] of LEVELS.entries()) {
  const combatWaves = level.waves.filter(wave => Array.isArray(wave.enemies));
  const bossWave = level.waves.at(-1);
  if (level.id !== index + 1 || combatWaves.length < 3 || !level.story?.every(Boolean)) throw new Error(`level ${level.id} progression mismatch`);
  if (index === 2 && bossWave.boss !== 0) throw new Error('third level boss wave missing');
  if (index < 2 && bossWave.boss !== undefined) throw new Error(`level ${level.id} should not have a boss`);
  if (!level.monument || !level.checkpoints?.length || !level.coins || !level.bambooSlips) throw new Error(`level ${level.id} world objects incomplete`);
}
const combatAudioFiles = Object.values(COMBAT_AUDIO).flat();
if (combatAudioFiles.length !== 15 || new Set(combatAudioFiles).size !== 15) throw new Error('combat audio manifest mismatch');
const html = fs.readFileSync('index.html', 'utf8');
for (const key of ['WASD', 'SPACE', 'J 普攻', 'mobile-controls', 'combat-callout', '九州灵迹', '禾灵', '二十四节气']) if (!html.includes(key)) throw new Error(`control/UI marker missing: ${key}`);
const legacy = ['三国大乱斗', '点将出征', '十战定乾坤', 'play-sanguo'];
for (const file of ['index.html', 'src/game.js', 'src/actors.js', 'src/levels.js']) {
  const text = fs.readFileSync(file, 'utf8');
  for (const marker of legacy) if (text.includes(marker)) throw new Error(`legacy marker ${marker} remains in ${file}`);
}
if (bad) process.exit(1);
const assetBytes = required.filter(x => x.startsWith('public/')).reduce((sum, file) => sum + fs.statSync(file).size, 0);
console.log(`Smoke checks passed: 4 heroes (2男2女), 10 enemies, 1 boss, 3 levels, 3 traps, 15 combat samples; required assets ${(assetBytes / 1024 / 1024).toFixed(2)} MiB.`);
