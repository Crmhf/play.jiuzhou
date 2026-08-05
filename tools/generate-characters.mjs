#!/usr/bin/env node
/**
 * 生成三位新增节气行者（炎朔/疏桐/玄泓）的动作图集与立绘。
 * 只读取 DOUZIMI_API_KEY；原始图集进入 .gen，正式图集由
 * tools/repack-character-atlas.py 重排为严格 4×3。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const force = process.argv.includes('--force');
const key = process.env.DOUZIMI_API_KEY;
if (!key) throw new Error('DOUZIMI_API_KEY is required');

const heroes = {
  yanshuo: {
    desc: '炎朔，年轻的中国夏日火焰行者，赤红劲装与暗金火纹护甲，手持熔焰钺，发带与火穗随动作翻飞。',
    color: '朱砂红与熔金暖色，火纹、雷纹、回纹装饰'
  },
  shutong: {
    desc: '疏桐，年轻的中国秋日金叶行者，浅金长裙与米白披帛，发间簪枫叶，手持金叶轮与环刃。',
    color: '秋金、月白与枫叶红，云纹与稻穗装饰'
  },
  xuanhong: {
    desc: '玄泓，沉稳的中国冬日水灵行者，深蓝长袍与霜白披风，佩玉带，手持玄冰戟，眉目清冷。',
    color: '玄青、冰蓝与月白银纹，水波与冰晶装饰'
  }
};

const atlasOrder = '待机、走路、奔跑、跳跃、普攻一、普攻二、普攻三、技能、绝技、受击、闪避、胜利';

async function fetchJson(url, options, timeout = 240000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let json;
    try { json = JSON.parse(text); } catch { throw new Error(`non-json ${response.status}: ${text.slice(0, 300)}`); }
    if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(json).slice(0, 600)}`);
    return json;
  } finally { clearTimeout(timer); }
}

async function exists(rel) { try { await fs.access(path.join(ROOT, rel)); return true; } catch { return false; } }
async function ensureDir(rel) { const out = path.join(ROOT, rel); await fs.mkdir(out, { recursive: true }); return out; }
async function summary(name, value) { await ensureDir('.gen'); await fs.writeFile(path.join(ROOT, '.gen', `${name}.json`), JSON.stringify({ generatedAt: new Date().toISOString(), ...value }, null, 2)); }
async function fromImageResponse(json, tmp) {
  const item = json.data?.[0] ?? json.data ?? json.output?.[0] ?? json;
  if (item?.b64_json) { await fs.writeFile(tmp, Buffer.from(item.b64_json, 'base64')); return; }
  const url = item?.url || item?.image_url || json.url;
  if (typeof url === 'string' && /^https?:/.test(url)) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`download ${response.status}: ${url}`);
    await fs.writeFile(tmp, Buffer.from(await response.arrayBuffer()));
    return;
  }
  throw new Error(`image response has no usable image: ${JSON.stringify(json).slice(0, 800)}`);
}
function cwebp(input, output, q = 90) {
  const result = spawnSync('cwebp', ['-quiet', '-q', String(q), input, '-o', output], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`cwebp failed: ${result.stderr || result.stdout}`);
}

for (const [id, spec] of Object.entries(heroes)) {
  const rawRel = `.gen/raw-character-atlas/${id}/atlas.webp`;
  const portraitRel = `public/assets/portraits/${id}.webp`;
  if (!force && await exists(rawRel) && await exists(portraitRel)) { console.log('skip existing', id); continue; }

  const atlasPrompt = `${spec.desc}2D横版像素动作游戏角色精灵图集，严格4列3行十二格，每格完整全身、同一服装同一武器、脚底基线一致、全部朝右、格子互不重叠，顺序从左到右再换行：${atlasOrder}。${spec.color}，纯均匀亮绿色 #00FF00 背景，没有文字、边框、格线、阴影、水印。`;
  console.log('gpt-image-2 atlas →', id);
  const atlasJson = await fetchJson('http://cf.douzimi.com:58728/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'gpt-image-2', prompt: atlasPrompt, size: '1536x1024', n: 1, response_format: 'b64_json' })
  }, 300000);
  const tmpAtlas = path.join(os.tmpdir(), `jiuzhou-${id}-atlas-${Date.now()}.img`);
  await fromImageResponse(atlasJson, tmpAtlas);
  const rawOut = path.join(ROOT, rawRel);
  await fs.mkdir(path.dirname(rawOut), { recursive: true });
  await fs.writeFile(rawOut, await fs.readFile(tmpAtlas));
  await fs.rm(tmpAtlas, { force: true });
  await summary(`character-atlas-${id}`, { provider: 'douzimi', model: 'gpt-image-2', output: rawRel, requestId: atlasJson.id });

  const portraitPrompt = `${spec.desc}半身立绘，朝右，国风工笔重彩人物立绘，浅金暖光背景（纯色 #00FF00 抠图绿幕背景），半透明薄雾衬托，${spec.color}，无文字无边框无UI，1024x1024 高清，适合2D横版游戏人物卡。`;
  console.log('gpt-image-2 portrait →', id);
  const portraitJson = await fetchJson('http://cf.douzimi.com:58728/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'gpt-image-2', prompt: portraitPrompt, size: '1024x1024', n: 1, response_format: 'b64_json' })
  }, 300000);
  const tmpPortrait = path.join(os.tmpdir(), `jiuzhou-${id}-portrait-${Date.now()}.img`);
  await fromImageResponse(portraitJson, tmpPortrait);
  const portraitTmp = path.join(os.tmpdir(), `jiuzhou-${id}-portrait-${Date.now()}.png`);
  await fs.writeFile(portraitTmp, await fs.readFile(tmpPortrait));
  await fs.rm(tmpPortrait, { force: true });
  const portraitOut = path.join(ROOT, portraitRel);
  await fs.mkdir(path.dirname(portraitOut), { recursive: true });
  cwebp(portraitTmp, portraitOut, 88);
  await fs.rm(portraitTmp, { force: true });
  await summary(`character-portrait-${id}`, { provider: 'douzimi', model: 'gpt-image-2', output: portraitRel, requestId: portraitJson.id });
}

console.log('done. 下一步执行 repack: npm run assets:character:repack -- .gen/raw-character-atlas/<id>/atlas.webp <id>');
