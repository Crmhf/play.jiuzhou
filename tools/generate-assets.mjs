#!/usr/bin/env node
/**
 * 九州灵迹素材生成器。
 * 密钥只从环境变量读取：DOUZIMI_API_KEY / MINIMAX_API_KEY。
 * 生成结果进入 public/assets，摘要只记录 provider/model/output，不保存密钥。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const argv = process.argv.slice(2);
const has = flag => argv.includes(flag);
const value = (flag, fallback = '') => { const i = argv.indexOf(flag); return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback; };
const force = has('--force');
const ids = value('--ids', '').split(',').map(x => x.trim()).filter(Boolean);
const help = `\n九州灵迹素材生成器\n\n环境变量:\n  DOUZIMI_API_KEY   gpt-image-2 / Qwen/Qwen-image\n  MINIMAX_API_KEY   image-01 / music-2.6\n\n命令:\n  node tools/generate-assets.mjs gpt-backgrounds --ids 1,2,3 [--force]\n  node tools/generate-assets.mjs minimax-atlases --ids heling,muxiao [--force]\n  node tools/generate-assets.mjs minimax-music [--force]\n  node tools/generate-assets.mjs qwen-ui [--force]\n  node tools/generate-assets.mjs minimax-ui [--force]\n`;
if (!argv.length || has('--help') || has('-h')) { console.log(help); process.exit(0); }

const bgPrompts = {
  1: '中国传统青绿山水与像素动作游戏背景概念图，立春桃源村，晨雾、桃花、稻田田埂、木水车、古井、夯土民居、牌楼和远处青山，暖金日光从云间洒下。横版卷轴构图，前景必须留出连续平坦的土路作为角色战斗通道，中景有竹篱和农具，远景有水墨山峦，层次丰富，细节繁多，东方幻想，青绿山水，16:9，无人物特写，无文字，无UI。',
  2: '中国传统青绿山水与像素动作游戏背景概念图，惊蛰雷竹林，巨大的青竹、竹简、雷纹石台、藤蔓悬台、落石、湿润苔痕与远处云海，紫青色春雷从天空劈落，萤火和薄雾形成纵深。横版卷轴构图，前景保留连续平台和跳跃空间，中景竹林拱门，远景水墨山峰，细节丰富，东方幻想，16:9，无人物，无文字，无UI。',
  3: '中国传统青绿山水与像素动作游戏背景概念图，春分水乡古道，江南水巷、乌篷船、木桥、水车、石拱桥、古建筑檐角、芦苇、水面倒影和远处青山，火焰机关在桥边燃烧，水汽与春雷交织。横版卷轴构图，前景为清晰连续木桥与石路，适合动作平台游戏，青绿山水与水墨晕染，层次丰富，16:9，无人物，无文字，无UI。'
};
const atlasPrompts = {
  heling: ['characters/heling/atlas.webp', '禾灵，年轻的中国农耕节气行者，青绿色短袍、米白护腕、金色稷穗纹、手持弧形稷镰，发带随风。2D横版像素动作游戏角色精灵图集，严格4列3行十二格：待机、走路、奔跑、跳跃、普攻一、普攻二、普攻三、水灵技能、春木绝技、受击、闪避、胜利。每格完整全身，同一服装同一武器，脚底基线一致，朝右，格子互不重叠。背景为纯均匀亮绿色 #00FF00，没有文字、边框、格线、阴影。精致中国风青绿配色游戏美术。'],
  muxiao: ['bosses/muxiao/atlas.webp', '春雷木魈，山海经木灵Boss，巨大树木角、藤甲、雷纹枝杈、青绿色木魄和金色雷光，威严而危险。2D横版动作游戏Boss精灵图集，严格4列3行十二格：待机、移动、登场蓄力、挥枝、雷震、藤蔓天坠、受击、二阶段、二阶段攻击、虚弱、倒地、消散。每格完整全身，角色大小一致，脚底基线一致，朝左，格子互不重叠。纯均匀亮绿色 #00FF00，无文字、边框、格线、地面阴影。东方神怪与像素游戏美术。']
};

async function fetchJson(url, options, timeout = 120000) {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeout);
  try { const response = await fetch(url, { ...options, signal: controller.signal }); const text = await response.text(); let json; try { json = JSON.parse(text); } catch { throw new Error(`non-json ${response.status}: ${text.slice(0, 300)}`); } if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(json).slice(0, 600)}`); return json; }
  finally { clearTimeout(timer); }
}
async function exists(rel) { try { await fs.access(path.join(ROOT, 'public/assets', rel)); return true; } catch { return false; } }
async function ensureOut(rel) { const out = path.join(ROOT, 'public/assets', rel); await fs.mkdir(path.dirname(out), { recursive: true }); return out; }
async function writeSummary(name, value) { await fs.mkdir(path.join(ROOT, '.gen'), { recursive: true }); await fs.writeFile(path.join(ROOT, '.gen', `${name}.json`), JSON.stringify({ generatedAt: new Date().toISOString(), ...value }, null, 2)); }
async function downloadTo(url, out) { const response = await fetch(url); if (!response.ok) throw new Error(`download ${response.status}: ${url}`); await fs.writeFile(out, Buffer.from(await response.arrayBuffer())); }
function convertWebp(input, output, quality = 90) { const result = spawnSync('cwebp', ['-quiet', '-q', String(quality), input, '-o', output], { encoding: 'utf8' }); if (result.status !== 0) throw new Error(`cwebp failed: ${result.stderr || result.stdout}`); }
async function fromImageResponse(json, tmp) {
  const item = json.data?.[0] ?? json.data ?? json.output?.[0] ?? json;
  if (item?.b64_json) { await fs.writeFile(tmp, Buffer.from(item.b64_json, 'base64')); return; }
  const url = item?.url || item?.image_url || item?.image_urls?.[0] || json.url;
  if (typeof url === 'string' && /^https?:/.test(url)) { await downloadTo(url, tmp); return; }
  throw new Error(`image response has no usable image: ${JSON.stringify(json).slice(0, 800)}`);
}
async function saveImage(rel, tmp, quality = 90) { const out = await ensureOut(rel); convertWebp(tmp, out, quality); await fs.rm(tmp, { force: true }); return out; }
function selected(keys) { return ids.length ? ids.filter(id => keys.includes(id)) : keys; }

async function gptBackgrounds() {
  const key = process.env.DOUZIMI_API_KEY; if (!key) throw new Error('DOUZIMI_API_KEY is required');
  for (const id of selected(['1', '2', '3'])) {
    const rel = `backgrounds/jiuzhou-${id === '1' ? 'spring-village' : id === '2' ? 'thunder-bamboo' : 'water-town'}.webp`;
    if (!force && await exists(rel)) { console.log('skip existing', rel); continue; }
    console.log('generating', rel);
    const json = await fetchJson('http://cf.douzimi.com:58728/v1/images/generations', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: 'gpt-image-2', prompt: bgPrompts[id], size: '1536x1024', n: 1, response_format: 'b64_json' }) }, 240000);
    const tmp = path.join(os.tmpdir(), `jiuzhou-bg-${id}-${Date.now()}.png`); await fromImageResponse(json, tmp); await saveImage(rel, tmp, 88); await writeSummary(`background-${id}`, { provider: 'douzimi', model: 'gpt-image-2', output: `assets/${rel}`, requestId: json.id });
  }
}

async function minimaxAtlases() {
  const key = process.env.MINIMAX_API_KEY; if (!key) throw new Error('MINIMAX_API_KEY is required');
  for (const id of selected(Object.keys(atlasPrompts))) {
    const [rel, prompt] = atlasPrompts[id];
    if (!force && await exists(rel)) { console.log('skip existing', rel); continue; }
    console.log('generating', rel);
    const json = await fetchJson('https://api.minimaxi.com/v1/image_generation', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: 'image-01', prompt, aspect_ratio: '1:1', response_format: 'url', n: 1, prompt_optimizer: true }) }, 240000);
    const tmp = path.join(os.tmpdir(), `jiuzhou-atlas-${id}-${Date.now()}.img`); await fromImageResponse(json, tmp); await saveImage(rel, tmp, 92); await fs.writeFile(path.join(ROOT, 'public/assets', path.dirname(rel), 'manifest.json'), JSON.stringify({ version: 1, id, cols: 4, rows: 3, artFacing: id === 'heling' ? 1 : -1, fps: 10 }, null, 2)); await writeSummary(`atlas-${id}`, { provider: 'minimax', model: 'image-01', output: `assets/${rel}`, requestId: json.id });
  }
}

async function qwenUi() {
  const key = process.env.DOUZIMI_API_KEY; if (!key) throw new Error('DOUZIMI_API_KEY is required');
  const rel = 'ui/jiuzhou-scroll.webp'; if (!force && await exists(rel)) { console.log('skip existing', rel); return; }
  const prompt = '中国风游戏UI装饰素材，横向古代竹简与青铜卷轴组合，青绿色山水、云雷纹、篆刻印章、稻穗、竹叶，中央留出干净空白用于叠加文字，材质细腻，古朴高级，正面平视，无文字，无人物，无按钮，透明或纯色背景。';
  const json = await fetchJson('http://cf.douzimi.com:58728/v1/images/generations', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: 'Qwen/Qwen-image', prompt, size: '1024x1024', n: 1, response_format: 'b64_json' }) });
  const tmp = path.join(os.tmpdir(), `jiuzhou-qwen-ui-${Date.now()}.png`); await fromImageResponse(json, tmp); await saveImage(rel, tmp, 90); await writeSummary('qwen-ui', { provider: 'douzimi', model: 'Qwen/Qwen-image', output: `assets/${rel}`, requestId: json.id });
}

async function minimaxUi() {
  const key = process.env.MINIMAX_API_KEY; if (!key) throw new Error('MINIMAX_API_KEY is required');
  const rel = 'ui/jiuzhou-seal.webp'; if (!force && await exists(rel)) { console.log('skip existing', rel); return; }
  const prompt = '中国传统篆刻印章风格的游戏UI徽章，圆形玉石印面，青绿色与朱砂红，抽象汉字“春”，稻穗、云纹、雷纹边饰，单独徽章，无文字说明，无人物，正面，适合网页游戏菜单图标。';
  const json = await fetchJson('https://api.minimaxi.com/v1/image_generation', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: 'image-01', prompt, aspect_ratio: '1:1', response_format: 'url', n: 1, prompt_optimizer: true }) });
  const tmp = path.join(os.tmpdir(), `jiuzhou-minimax-ui-${Date.now()}.img`); await fromImageResponse(json, tmp); await saveImage(rel, tmp, 90); await writeSummary('minimax-ui', { provider: 'minimax', model: 'image-01', output: `assets/${rel}`, requestId: json.id });
}

async function minimaxMusic() {
  const key = process.env.MINIMAX_API_KEY; if (!key) throw new Error('MINIMAX_API_KEY is required');
  const rel = 'audio/jiuzhou-theme.mp3'; if (!force && await exists(rel)) { console.log('skip existing', rel); return; }
  const prompt = 'Instrumental only. Chinese fantasy side-scrolling action adventure music for 九州灵迹: guqin, xiao flute, pipa, Chinese drums, temple bells, gentle spring pentatonic melody, rising heroic rhythm, layered wood and water atmosphere, loop-friendly ending, no vocals, no lyrics.';
  const json = await fetchJson('https://api.minimaxi.com/v1/music_generation', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: 'music-2.6', prompt, lyrics: '[Instrumental]', audio_setting: { sample_rate: 44100, bitrate: 192000, format: 'mp3' } }) }, 300000);
  const audio = json.data?.audio || json.audio || json.data?.audio_url || json.data?.url;
  const out = await ensureOut(rel);
  if (typeof audio === 'string' && /^https?:/.test(audio)) await downloadTo(audio, out);
  else if (typeof audio === 'string') await fs.writeFile(out, Buffer.from(audio, /^[0-9a-f]+$/i.test(audio) ? 'hex' : 'base64'));
  else throw new Error(`music response has no usable audio: ${JSON.stringify(json).slice(0, 800)}`);
  await writeSummary('theme-music', { provider: 'minimax', model: 'music-2.6', output: `assets/${rel}`, requestId: json.id, duration: json.extra_info?.music_duration });
}

const command = argv[0];
if (command === 'gpt-backgrounds') await gptBackgrounds();
else if (command === 'minimax-atlases') await minimaxAtlases();
else if (command === 'minimax-music') await minimaxMusic();
else if (command === 'qwen-ui') await qwenUi();
else if (command === 'minimax-ui') await minimaxUi();
else throw new Error(`unknown command: ${command}${help}`);
