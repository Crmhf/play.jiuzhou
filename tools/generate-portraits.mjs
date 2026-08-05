#!/usr/bin/env node
// Generate new UI assets:
// - 4 hero portraits (半身立绘, 国风工笔, 朝右)
// - UI decorative assets: portrait-frame, war-scroll-edge, accent-corner
// Outputs to public/assets/{portraits,ui}/, summarizes to .gen/

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const argv = process.argv.slice(2);
const has = f => argv.includes(f);
const value = (f, fb='') => { const i = argv.indexOf(f); return i>=0 && argv[i+1] ? argv[i+1] : fb; };
const force = has('--force');
const targets = value('--only').split(',').filter(Boolean);

const heroes = {
  guanyu: '禾灵，九州灵迹的节气守护者。设计为半身立绘，朝右，绿袍金甲、胸前护心镜、系赤红战袍腰带、左手抚长髯、右手扶青龙偃月刀刀柄、双眼微眯、勇毅庄严。国风工笔重彩人物立绘风格，浅金暖光背景（纯色 #00FF00 抠图绿幕背景），半透明薄雾衬托，无文字无边框无UI，1024x1024 高清，适合 2D 横版游戏人物卡。',
  zhangfei: '春雷木魈的守护图腾。设计为半身立绘，朝右，人类武将，黑铁甲胄、赤红战袍、怒目圆睁、虬髯飞扬、左手持丈八蛇矛蛇头矛尖、右手怒指向前方、表情刚烈凶悍。请画成 100% 中国古代写实武将，不要画成兽人、猿猴、卡通或西方奇幻风格。浓墨重彩国风工笔人物立绘，浅金暖光背景（纯色 #00FF00 抠图绿幕背景），半透明薄雾衬托，无文字无边框无UI，1024x1024 高清，适合 2D 横版游戏人物卡。',
  zhaoyun: '雷竹林中的竹灵守望者。设计为半身立绘，朝右，银甲蓝披风、龙胆亮银枪斜背身后、单手抬枪势、眼神清朗英武、风度翩翩。国风工笔重彩人物立绘风格，浅金暖光背景（纯色 #00FF00 抠图绿幕背景），半透明薄雾衬托，无文字无边框无UI，1024x1024 高清，适合 2D 横版游戏人物卡。',
  huangzhong: '水乡古道的水灵长者。设计为半身立绘，朝右，白须金甲黄披风、手挽万石强弓、腰悬箭壶、表情沉稳老当益壮。国风工笔重彩人物立绘风格，浅金暖光背景（纯色 #00FF00 抠图绿幕背景），半透明薄雾衬托，无文字无边框无UI，1024x1024 高清，适合 2D 横版游戏人物卡。',
};

const ui = {
  'portrait-frame': '中国节气守护者卡牌的装饰边框。深色厚实木质雕花边框，嵌赤金云雷纹与虎符牌饰，上下雕着如意云头，左右挂着青铜战旗穗子。边缘有微微做旧的烫金描边。无背景（纯色 #00FF00 抠图绿幕），1024x1024 居中对称纯装饰元素，可叠加在人物立绘外圈。',
  'select-banner': '九州灵迹游戏选将屏横幅装饰。横向长条 1536x256，中央留空用于标题，两侧是金色云雷纹与战旗剪影，底部有赤铜战鼓装饰，顶部为青铜瓦当。正面平视，纯色 #00FF00 抠图绿幕背景，无文字无UI，可叠加在深色背景上。',
  'story-frame': '九州灵迹游戏剧情对话框装饰。古朴汉代竹简卷轴展开形态，上下有红木轴头与鎏金扣环，左右竹简边缘有战旗穗子，中央留空用于文字内容。1536x1024，纯色 #00FF00 抠图绿幕背景，无文字，精致游戏UI装饰元素。',
};

async function outPath(rel) {
  const p = path.join(ROOT, 'public/assets', rel);
  await fs.mkdir(path.dirname(p), { recursive: true });
  return p;
}
async function exists(rel) { try { await fs.access(path.join(ROOT, 'public/assets', rel)); return true; } catch { return false; } }
async function summary(name, data) {
  const dir = path.join(ROOT, '.gen'); await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${name}.json`), JSON.stringify({ ...data, generatedAt: new Date().toISOString() }, null, 2));
}
async function fetchJson(url, options, timeoutMs = 240000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...options, signal: ctl.signal });
    const txt = await r.text();
    let j; try { j = JSON.parse(txt); } catch { throw new Error(`${r.status} non-JSON: ${txt.slice(0,300)}`); }
    if (!r.ok) throw new Error(`${r.status}: ${JSON.stringify(j).slice(0,500)}`);
    return j;
  } finally { clearTimeout(t); }
}
async function downloadTo(url, out) {
  const r = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!r.ok) throw new Error(`download ${r.status}`);
  await fs.writeFile(out, Buffer.from(await r.arrayBuffer()));
}
function cwebp(input, output, q=85) {
  const r = spawnSync('cwebp', ['-quiet', '-q', String(q), input, '-o', output], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('cwebp failed');
}

async function genGptImage(rel, prompt, size='1024x1024', q=88) {
  if (!force && await exists(rel)) { console.log('skip existing', rel); return; }
  console.log('gpt-image-2 →', rel);
  const key = process.env.DOUZIMI_API_KEY;
  if (!key) throw new Error('DOUZIMI_API_KEY not set');
  const json = await fetchJson('http://cf.douzimi.com:58728/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'gpt-image-2', prompt, size, n: 1, response_format: 'b64_json' }),
  }, 600000);
  const item = json.data?.[0]; if (!item) throw new Error(`no image: ${rel}`);
  const tmp = path.join(os.tmpdir(), `jiuzhou-ui-${Date.now()}.png`);
  if (item.b64_json) await fs.writeFile(tmp, Buffer.from(item.b64_json, 'base64'));
  else if (item.url) await downloadTo(item.url, tmp);
  else throw new Error('unsupported image response');
  const out = await outPath(rel); cwebp(tmp, out, q); await fs.rm(tmp, { force: true });
  await summary(`ui-${path.basename(path.dirname(rel))}-${path.basename(rel, '.webp')}`, {
    provider: 'douzimi', model: 'gpt-image-2', output: rel, generationTimeMs: json.generation_time_ms,
  });
}

async function genMinimaxImage(rel, prompt, aspect='1:1', q=88) {
  if (!force && await exists(rel)) { console.log('skip existing', rel); return; }
  console.log('minimax →', rel);
  const key = process.env.MINIMAX_API_KEY;
  if (!key) throw new Error('MINIMAX_API_KEY not set');
  const json = await fetchJson('https://api.minimaxi.com/v1/image_generation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'image-01', prompt, aspect_ratio: aspect, response_format: 'url', n: 1, prompt_optimizer: true }),
  }, 300000);
  const url = json.data?.image_urls?.[0]; if (!url) throw new Error(`no url: ${JSON.stringify(json).slice(0,300)}`);
  const tmp = path.join(os.tmpdir(), `jiuzhou-ui-${Date.now()}.img`);
  await downloadTo(url, tmp);
  const out = await outPath(rel); cwebp(tmp, out, q); await fs.rm(tmp, { force: true });
  await summary(`ui-${path.basename(path.dirname(rel))}-${path.basename(rel, '.webp')}`, {
    provider: 'minimax', model: 'image-01', output: rel, requestId: json.id,
  });
}

const wantHeroes = Object.keys(heroes).filter(k => !targets.length || targets.includes(k));
const wantUi = Object.keys(ui).filter(k => !targets.length || targets.includes(k));

for (const id of wantHeroes) {
  await genGptImage(`portraits/${id}.webp`, heroes[id], '1024x1024', 86);
}
for (const id of wantUi) {
  const w = id === 'select-banner' || id === 'story-frame' ? '1536x1024' : '1024x1024';
  await genGptImage(`ui/${id}.webp`, ui[id], w, 86);
}
console.log('done.');