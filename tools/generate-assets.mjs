#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const argv = process.argv.slice(2);
const has = flag => argv.includes(flag);
const value = (flag, fallback = '') => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const force = has('--force');

const help = `\n三国大乱斗素材生成器（密钥只从环境变量读取）\n\n` +
`环境变量:\n  DOUZIMI_API_KEY   gpt-image-2 / Qwen-image / DeepSeek-OCR\n  MINIMAX_API_KEY   image-01 / music-2.6\n\n` +
`命令:\n  node tools/generate-assets.mjs gpt-backgrounds [--ids 1,3,4] [--force]\n` +
`  node tools/generate-assets.mjs minimax-atlases [--ids zhangfei,monsters-1] [--force]\n` +
`  node tools/generate-assets.mjs minimax-boss-animation [--ids chengyuanzhi,huaxiong] [--force]\n` +
`  node tools/generate-assets.mjs minimax-music [--force]\n` +
`  node tools/generate-assets.mjs qwen-ui [--force]\n\n` +
`生成结果会写入 public/assets；响应摘要写入 .gen/，不会保存密钥。\n`;
if (!argv.length || has('--help') || has('-h')) { console.log(help); process.exit(0); }

const bgPrompts = {
  1: '涿郡桃园烽烟，东汉末年三国题材横版动作游戏复杂背景。清晨金色天光，远处桃园、古村、黄巾军火光与汉代城门，近景必须是一条清晰平坦的石土战斗通道，左右可无缝延展。电影级国风厚涂，真实空间层次，史诗战场，大气透视，16:9，无文字，无人物特写，无UI。',
  2: '虎牢关雪夜雄关，东汉末年三国题材横版动作游戏复杂背景。落日被暴雪与乌云吞没，雄关城楼、曹孙刘联军旗阵、拒马、火盆和远山军阵，近景留出宽阔平坦战斗通道。电影级国风厚涂，强烈冷暖对比，大气透视，16:9，无文字，无UI。',
  3: '虎牢关无双战场，三英战吕布前夕。赤色暮天、赤兔马蹄扬尘、折断战旗、方天画戟留下的金色气浪，雄关在远景，近景清晰平坦的战斗通道。三国史诗、电影概念艺术、层次丰富、16:9，无文字，无人物特写，无UI。',
  4: '长坂坡当阳乱军，赵云七进七出主题横版战斗背景。暴雨后的蓝灰天空，远处当阳桥、撤离百姓剪影、曹军骑兵与旌旗，水洼倒映闪电，近景留平坦泥石战斗通道。电影级国风厚涂，三国历史感，16:9，无文字，无UI。',
  5: '赤壁连环火船，三国水战横版动作游戏复杂背景。长江夜色、东风卷云、连环战船燃烧、火箭雨、吴军水寨与巨浪，前景为稳定木栈桥和甲板战斗通道。史诗电影概念艺术，橙火与靛蓝强对比，16:9，无文字，无UI。',
  6: '华容道风雨旧义，三国横版动作游戏复杂背景。暴雨峡谷、泥泞古道、关羽军旗、败军火把、滚木与陡峭山壁，薄雾中若隐若现的曹军，近景留平整山道战斗通道。电影级国风厚涂，沉郁英雄气，16:9，无文字，无UI。',
  7: '濡须口单刀赴会，三国江东水寨横版动作游戏复杂背景。月下大江、吴军高台水寨、铁链刀斧阵、青铜灯火和战船，关羽意象用青龙旗与长刀剪影表达，近景留宽阔木台战斗通道。电影级国风厚涂，青金色调，16:9，无文字，无UI。',
  8: '定军山落日绝岭，黄忠斩夏侯渊主题横版动作游戏复杂背景。金红落日、险峻山脊、曹军粮道、木寨箭楼、飞矢轨迹和风中旗帜，近景留平坦岩石战斗平台。三国史诗电影概念艺术，辽阔层次，16:9，无文字，无UI。',
  9: '夷陵连营烈焰，三国横版动作游戏复杂背景。蜀军连营被夜火吞噬，山林火墙、断桥、燃烧战旗、浓烟与远处陆逊军阵，近景留清晰安全的土石战斗通道。电影级国风厚涂，火焰体积光，16:9，无文字，无UI。',
  10: '五丈原星落八阵，三国终局横版动作游戏复杂背景。深蓝星夜、诸葛亮将星、八阵图巨型军阵、木牛流马、祈禳灯阵、远处司马懿魏军营垒，近景留宽阔平坦战斗通道。庄严悲壮、电影级国风厚涂、金蓝对比、16:9，无文字，无UI。',
};

const atlasPrompts = {
  guanyu: ['characters/guanyu/atlas.webp', '关羽，青龙偃月刀，绿袍金甲，长髯，三国横版动作游戏角色精灵图集。严格3x3九宫格，九个完整全身动作：待机、奔跑1、奔跑2、跳跃、普攻1、普攻2、青龙刀气技能、受击、绝技。每格人物大小一致、脚底基线一致、朝右、格子互不重叠。纯均匀亮绿色背景 #00FF00，无阴影落到背景，无文字，无边框，精致国风2D游戏原画。'],
  zhangfei: ['characters/zhangfei/atlas.webp', '张飞，丈八蛇矛，黑甲红袍，豹头环眼，三国横版动作游戏角色精灵图集。严格3x3九宫格，九个完整全身动作：待机、奔跑1、奔跑2、跳跃、普攻1、普攻2、怒吼震地技能、受击、绝技。每格人物大小一致、脚底基线一致、朝右、格子互不重叠。纯均匀亮绿色背景 #00FF00，无文字，无边框，精致国风2D游戏原画。'],
  zhaoyun: ['characters/zhaoyun/atlas.webp', '赵云，龙胆亮银枪，银甲蓝披风，英武青年，三国横版动作游戏角色精灵图集。严格3x3九宫格，九个完整全身动作：待机、奔跑1、奔跑2、跳跃、普攻1、普攻2、七探盘蛇技能、受击、绝技。每格人物大小一致、脚底基线一致、朝右、格子互不重叠。纯均匀亮绿色背景 #00FF00，无文字，无边框，精致国风2D游戏原画。'],
  huangzhong: ['characters/huangzhong/atlas.webp', '黄忠，万石强弓，白须金甲黄披风，老当益壮，三国横版动作游戏角色精灵图集。严格3x3九宫格，九个完整全身动作：待机、奔跑1、奔跑2、跳跃、射箭1、射箭2、散射技能、受击、落日箭阵绝技。每格人物大小一致、脚底基线一致、朝右、格子互不重叠。纯均匀亮绿色背景 #00FF00，无文字，无边框，精致国风2D游戏原画。'],
  'monsters-1': ['monsters/group-1/atlas.webp', '三国横版动作游戏敌军精灵图集，严格4列x3行共12格，其中前10格分别是黄巾刀兵、黄巾枪兵、黄巾弓手、黄巾术士、山贼、山贼头目、西凉刀兵、西凉铁骑、董卓亲卫、并州狼骑，后2格放不同攻击姿态。每格一个完整全身角色，朝左，尺寸一致，互不重叠。纯均匀亮绿色背景 #00FF00，无文字无边框，精致国风2D原画。'],
  'monsters-2': ['monsters/group-2/atlas.webp', '三国横版动作游戏敌军精灵图集，严格4列x3行共12格，其中前10格分别是曹军刀盾兵、曹军长枪兵、虎豹骑、青州兵、魏军弩手、吴军刀兵、吴军弓手、解烦军、丹阳兵、锦帆贼，后2格放不同攻击姿态。每格一个完整全身角色，朝左，尺寸一致，互不重叠。纯均匀亮绿色背景 #00FF00，无文字无边框，精致国风2D原画。'],
  'monsters-3': ['monsters/group-3/atlas.webp', '三国横版动作游戏敌军精灵图集，严格4列x3行共12格，其中前10格分别是南蛮藤甲兵、南蛮投矛手、火兽兵、连弩兵、霹雳车军士、八阵旗兵、魏武卒、白毦兵、无当飞军、五丈原死士，后2格放不同攻击姿态。每格一个完整全身角色，朝左，尺寸一致，互不重叠。纯均匀亮绿色背景 #00FF00，无文字无边框，精致国风2D原画。'],
  'bosses-1': ['bosses/group-1/atlas.webp', '三国横版动作游戏Boss精灵图集，严格5列x1行，依次是程远志、华雄、吕布、夏侯惇、曹仁。每格一个完整全身武将，独特武器与甲胄，朝左，大小一致，互不重叠。纯均匀亮绿色背景 #00FF00，无文字无边框，华丽国风2D Boss原画。'],
  'bosses-2': ['bosses/group-2/atlas.webp', '三国横版动作游戏Boss精灵图集，严格5列x1行，依次是许褚、甘宁、夏侯渊、陆逊、司马懿。每格一个完整全身武将，独特武器与甲胄，朝左，大小一致，互不重叠。纯均匀亮绿色背景 #00FF00，无文字无边框，华丽国风2D Boss原画。'],
  ui: ['ui/war-scroll.webp', '三国横版动作游戏UI横幅素材，摊开的汉代军令竹简与赤金卷轴，中央留空用于关卡标题，边缘有云雷纹、虎符、战旗与青铜纹饰，正面平视，透明感纯色绿色背景 #00FF00，无任何文字，精致游戏UI资产。'],
};

async function ensureOut(rel) {
  const out = path.join(ROOT, 'public/assets', rel);
  await fs.mkdir(path.dirname(out), { recursive: true });
  return out;
}
async function exists(rel) { try { await fs.access(path.join(ROOT, 'public/assets', rel)); return true; } catch { return false; } }
async function writeSummary(name, data) {
  const dir = path.join(ROOT, '.gen'); await fs.mkdir(dir, { recursive: true });
  const clean = { ...data, generatedAt: new Date().toISOString() };
  await fs.writeFile(path.join(dir, `${name}.json`), JSON.stringify(clean, null, 2));
}
async function fetchJson(url, options, timeoutMs = 180000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { throw new Error(`${res.status} non-JSON response: ${text.slice(0, 300)}`); }
    if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(json).slice(0, 500)}`);
    return json;
  } finally { clearTimeout(timer); }
}
async function downloadTo(url, out) {
  const res = await fetch(url); if (!res.ok) throw new Error(`download ${res.status}`);
  await fs.writeFile(out, Buffer.from(await res.arrayBuffer()));
}
function convertWebp(input, output, quality = 88) {
  const result = spawnSync('cwebp', ['-quiet', '-q', String(quality), input, '-o', output], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('cwebp failed');
}
function selected(all) {
  const raw = value('--ids'); if (!raw) return all;
  const wanted = new Set(raw.split(',').map(x => x.trim())); return all.filter(x => wanted.has(String(x)));
}

async function gptBackgrounds() {
  const key = process.env.DOUZIMI_API_KEY; if (!key) throw new Error('DOUZIMI_API_KEY is required');
  for (const id of selected(Object.keys(bgPrompts))) {
    const rel = `backgrounds/level-${String(id).padStart(2, '0')}.webp`;
    if (!force && await exists(rel)) { console.log('skip existing', rel); continue; }
    console.log('generating', rel);
    const json = await fetchJson('http://cf.douzimi.com:58728/v1/images/generations', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'gpt-image-2', prompt: bgPrompts[id], size: '1536x1024', n: 1, response_format: 'b64_json' }),
    }, 720000);
    const item = json.data?.[0]; if (!item) throw new Error(`no image for ${id}`);
    const tmp = path.join(os.tmpdir(), `sanguo-bg-${id}-${Date.now()}.png`);
    if (item.b64_json) await fs.writeFile(tmp, Buffer.from(item.b64_json, 'base64'));
    else if (item.url) await downloadTo(item.url, tmp); else throw new Error('unsupported image response');
    const out = await ensureOut(rel); convertWebp(tmp, out, 88); await fs.rm(tmp, { force: true });
    await writeSummary(`background-${id}`, { provider: 'douzimi', model: 'gpt-image-2', output: rel, generationTimeMs: json.generation_time_ms });
  }
}


const bossAnimationPrompts = {
  chengyuanzhi: ['01-chengyuanzhi', '程远志，黄巾军魁梧首领，黄巾、赤铜札甲、双手狼牙大刀，凶悍粗犷'],
  huaxiong: ['02-huaxiong', '华雄，西凉猛将，黑红重甲、兽面肩甲、巨大斩马刀，压迫感强'],
  lvbu: ['03-lvbu', '吕布，凤翅紫金冠、赤黑银甲、猩红披风、方天画戟，天下无双'],
  xiahoudun: ['04-xiahoudun', '夏侯惇，独眼魏将，蓝黑甲胄、红色眼罩、长柄战刀，冷峻狂烈'],
  caoren: ['05-caoren', '曹仁，魏国守城大将，玄铁塔盾、厚重青黑甲、长枪，坚不可摧'],
  xuchu: ['06-xuchu', '许褚，虎痴巨汉，裸臂重甲、虎纹腰甲、巨型战锤，力量惊人'],
  ganning: ['07-ganning', '甘宁，锦帆游侠，蓝青轻甲、羽饰头巾、双短刀与锁链，迅捷桀骜'],
  xiahouyuan: ['08-xiahouyuan', '夏侯渊，魏国神速弓将，深蓝轻甲、长弓、腰间短刀，凌厉精悍'],
  luxun: ['09-luxun', '陆逊，年轻儒将，赤白锦甲、长剑、火羽披风，沉着俊逸'],
  simayi: ['10-simayi', '司马懿，魏国黑羽军师，黑紫法袍与轻甲、羽扇、幽蓝法焰，阴鸷威严']
};

function bossAnimationPrompt(description) {
  return `${description}，三国横版动作清关游戏 Boss 多帧精灵图集。严格 4x3 十二宫格，十二格从左到右、从上到下依次为：待机呼吸、向右迈左腿、向右迈右腿、向右奔跑；抬手蓄力、挥击前半段、挥击命中姿势、专属招式一；专属大招爆发、向后受击、跪倒、倒地死亡。每一格必须是同一个角色、同一服装、同一武器、同一画风；完整全身，角色大小一致，脚底基线一致，默认面向右侧；动作幅度明显，武器和四肢姿势必须真正变化，不能只改变特效。格子互不重叠，四周留安全边距。纯均匀亮绿色背景 #00FF00，无地面阴影，无文字，无边框，无格线，无 UI。精致国风 2D 游戏原画，清晰轮廓，适合 WebGL 色键抠图。`;
}

async function minimaxBossAnimation() {
  const key = process.env.MINIMAX_API_KEY; if (!key) throw new Error('MINIMAX_API_KEY is required');
  for (const id of selected(Object.keys(bossAnimationPrompts))) {
    const [folder, description] = bossAnimationPrompts[id];
    const rel = `bosses/animated/${folder}/atlas.webp`;
    if (!force && await exists(rel)) { console.log('skip existing', rel); continue; }
    console.log('generating', rel);
    const json = await fetchJson('https://api.minimaxi.com/v1/image_generation', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'image-01', prompt: bossAnimationPrompt(description), aspect_ratio: '1:1', response_format: 'url', n: 1, prompt_optimizer: false }),
    }, 300000);
    const url = json.data?.image_urls?.[0]; if (!url) throw new Error(`no image URL: ${JSON.stringify(json).slice(0, 500)}`);
    const tmp = path.join(os.tmpdir(), `sanguo-boss-${id}-${Date.now()}.img`); await downloadTo(url, tmp);
    const out = await ensureOut(rel); convertWebp(tmp, out, 92); await fs.rm(tmp, { force: true });
    await fs.writeFile(path.join(path.dirname(out), 'manifest.json'), JSON.stringify({
      version: 1, id, cols: 4, rows: 3, artFacing: 1, fps: 8,
      frames: { idle: [0], move: [1, 2, 3], intro: [0, 4], windup: [4], attack0: [5, 6], attack1: [4, 6, 7], attack2: [8, 9], recover: [6, 0], hurt: [9], phase: [4, 8], death: [10, 11] }
    }, null, 2));
    await writeSummary(`boss-animation-${id}`, { provider: 'minimax', model: 'image-01', output: rel, requestId: json.id, successCount: json.metadata?.success_count });
  }
}

async function minimaxAtlases() {
  const key = process.env.MINIMAX_API_KEY; if (!key) throw new Error('MINIMAX_API_KEY is required');
  for (const id of selected(Object.keys(atlasPrompts))) {
    const [rel, prompt] = atlasPrompts[id];
    if (!force && await exists(rel)) { console.log('skip existing', rel); continue; }
    console.log('generating', rel);
    const json = await fetchJson('https://api.minimaxi.com/v1/image_generation', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'image-01', prompt, aspect_ratio: id.startsWith('bosses-') ? '16:9' : '1:1', response_format: 'url', n: 1, prompt_optimizer: true }),
    });
    const url = json.data?.image_urls?.[0]; if (!url) throw new Error(`no image URL: ${JSON.stringify(json).slice(0, 500)}`);
    const tmp = path.join(os.tmpdir(), `sanguo-${id}-${Date.now()}.img`); await downloadTo(url, tmp);
    const out = await ensureOut(rel); convertWebp(tmp, out, 90); await fs.rm(tmp, { force: true });
    await writeSummary(`atlas-${id}`, { provider: 'minimax', model: 'image-01', output: rel, requestId: json.id, successCount: json.metadata?.success_count });
  }
}

async function qwenUi() {
  const key = process.env.DOUZIMI_API_KEY; if (!key) throw new Error('DOUZIMI_API_KEY is required');
  const rel = 'ui/war-scroll.webp'; if (!force && await exists(rel)) { console.log('skip existing', rel); return; }
  const prompt = atlasPrompts.ui[1];
  const json = await fetchJson('http://cf.douzimi.com:58728/v1/images/generations', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'Qwen/Qwen-image', prompt, size: '1024x1024', n: 1, response_format: 'b64_json' }),
  });
  const item = json.data?.[0]; if (!item) throw new Error('Qwen image channel returned no data');
  const tmp = path.join(os.tmpdir(), `sanguo-qwen-ui-${Date.now()}.png`);
  if (item.b64_json) await fs.writeFile(tmp, Buffer.from(item.b64_json, 'base64')); else await downloadTo(item.url, tmp);
  const out = await ensureOut(rel); convertWebp(tmp, out, 90); await fs.rm(tmp, { force: true });
  await writeSummary('qwen-ui', { provider: 'douzimi', model: 'Qwen/Qwen-image', output: rel });
}

async function minimaxMusic() {
  const key = process.env.MINIMAX_API_KEY; if (!key) throw new Error('MINIMAX_API_KEY is required');
  const rel = 'audio/sanguo-battle-theme.mp3'; if (!force && await exists(rel)) { console.log('skip existing', rel); return; }
  const prompt = 'Instrumental only. Energetic Three Kingdoms battlefield action music for a side-scrolling brawler: war drums, tanggu, pipa, suona accents, low strings, bronze percussion, galloping rhythm, heroic Chinese pentatonic melody, escalating boss-fight intensity, clean loop-friendly ending, no vocals, no chanting, no lyrics.';
  const json = await fetchJson('https://api.minimaxi.com/v1/music_generation', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'music-2.6', prompt, lyrics: '[Instrumental]', audio_setting: { sample_rate: 44100, bitrate: 256000, format: 'mp3' } }),
  }, 300000);
  const audio = json.data?.audio || json.audio || json.data?.audio_url || json.data?.url;
  const out = await ensureOut(rel);
  if (typeof audio === 'string' && /^https?:/.test(audio)) await downloadTo(audio, out);
  else if (typeof audio === 'string') await fs.writeFile(out, Buffer.from(audio, 'hex'));
  else throw new Error(`unsupported music response: ${JSON.stringify(json).slice(0, 700)}`);
  await writeSummary('battle-music', { provider: 'minimax', model: 'music-2.6', output: rel, requestId: json.id, duration: json.extra_info?.music_duration });
}

const command = argv[0];
if (command === 'gpt-backgrounds') await gptBackgrounds();
else if (command === 'minimax-atlases') await minimaxAtlases();
else if (command === 'minimax-boss-animation') await minimaxBossAnimation();
else if (command === 'minimax-music') await minimaxMusic();
else if (command === 'qwen-ui') await qwenUi();
else throw new Error(`unknown command: ${command}\n${help}`);
