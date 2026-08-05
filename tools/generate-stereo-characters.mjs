#!/usr/bin/env node
/**
 * 重新生成一套 Q版2.5D 立体厚涂的四季行者与小怪素材。
 * 视觉参考：本地「24 欧式Q版角色SPINE」与「Q版8方向人物动画序列帧」的
 * Q版比例、厚涂体积、地面投影与战斗动作表现。
 * 生成通道：gpt-image-2（Qwen/Qwen-image 当前通道不可用时自动跳过）。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const force = process.argv.includes('--force');
const key = process.env.DOUZIMI_API_KEY;
if (!key) throw new Error('DOUZIMI_API_KEY is required');

const STYLE = 'Q版2.5D立体厚涂国风手游角色，Q版大头小身比例，3D手办质感，柔和体积光、环境光遮蔽与高光，深色描边，脚下自带柔和圆形地面投影，正面3/4视角，角色居中，动作清晰';

const heroes = {
  heling: '禾灵，年轻的中国农耕节气行者，青绿色短袍、米白护腕、金色稷穗纹，手持弧形稷镰，发带随风，春木主题',
  yanshuo: '炎朔，年轻的中国夏日火焰行者，赤红劲装与暗金火纹护甲，手持熔焰钺，火穗发带，夏火主题',
  shutong: '疏桐，年轻的中国秋日金叶行者，浅金长裙与米白披帛，发间簪枫叶，手持金叶轮，秋金主题',
  xuanhong: '玄泓，沉稳的中国冬日水灵行者，深蓝长袍与霜白披风，手持玄冰戟，眉目清冷，冬水主题'
};
const monsters = [
  ['山猪精', '野猪精，棕色鬃毛，獠牙外露，肌肉感厚重'],
  ['蜂妖', '人形蜂妖，黄黑条纹，透明翅膀，毒针尾'],
  ['食人藤', '藤蔓妖，花苞大嘴，绿叶与荆棘缠绕'],
  ['雷泽蜥', '雷泽蜥蜴，青紫鳞甲，背部雷纹，吐电舌'],
  ['石敢当', '石傀儡，青石甲胄，苔藓与符文，沉重结实'],
  ['水魈', '水鬼精怪，半透明蓝水身体，水浪纹'],
  ['火鼠', '火焰鼠妖，橙红皮毛，身燃小火，尾尖火光'],
  ['木魅', '木魅，树皮身躯，枝芽新叶，眼含翠光'],
  ['九尾狐灵', '九尾狐灵，粉紫皮毛，九条灵尾，仙气环绕'],
  ['雷鼓傀儡', '雷鼓傀儡，青铜鼓身，雷纹鼓面，双臂持槌']
];

const atlasOrder = '待机、走路、奔跑、跳跃、普攻一、普攻二、普攻三、技能、绝技、受击、闪避、胜利';

async function fetchJson(url, options, timeout = 300000) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      const text = await response.text();
      let json;
      try { json = JSON.parse(text); } catch { throw new Error(`non-json ${response.status}: ${text.slice(0, 300)}`); }
      if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(json).slice(0, 600)}`);
      return json;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
    } finally { clearTimeout(timer); }
  }
  throw lastError;
}
async function ensureDir(rel) { const out = path.join(ROOT, rel); await fs.mkdir(out, { recursive: true }); return out; }
async function exists(rel) { try { await fs.access(path.join(ROOT, rel)); return true; } catch { return false; } }
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
function cwebp(input, output, q = 86) {
  const result = spawnSync('cwebp', ['-quiet', '-q', String(q), input, '-o', output], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`cwebp failed: ${result.stderr || result.stdout}`);
}
async function generate(rel, prompt, size, q = 86) {
  console.log('gpt-image-2 →', rel);
  const json = await fetchJson('http://cf.douzimi.com:58728/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'gpt-image-2', prompt, size, n: 1, response_format: 'b64_json' })
  });
  const tmp = path.join(os.tmpdir(), `jiuzhou-stereo-${Date.now()}-${Math.random().toString(36).slice(2)}.img`);
  await fromImageResponse(json, tmp);
  const out = path.join(ROOT, rel);
  await fs.mkdir(path.dirname(out), { recursive: true });
  cwebp(tmp, out, q);
  await fs.rm(tmp, { force: true });
  return json;
}

for (const [id, desc] of Object.entries(heroes)) {
  const atlasRel = `.gen/stereo-hero/${id}/atlas.webp`;
  if (!force && await exists(atlasRel)) { console.log('skip existing', atlasRel); continue; }
  const atlasPrompt = `${desc}。${STYLE}。2D横版动作游戏角色精灵图集，严格4列3行十二格，每格完整全身、同一服装同一武器、脚底基线一致、全部朝右、格子互不重叠，顺序从左到右再换行：${atlasOrder}。纯均匀亮绿色 #00FF00 背景，没有文字、边框、格线、水印。`;
  const atlasJson = await generate(atlasRel, atlasPrompt, '1536x1024');
  await summary(`stereo-hero-${id}`, { provider: 'douzimi', model: 'gpt-image-2', output: atlasRel, requestId: atlasJson.id });

  const portraitRel = `.gen/stereo-portrait/${id}.webp`;
  if (!force && await exists(portraitRel)) { console.log('skip existing', portraitRel); continue; }
  const portraitPrompt = `${desc}。${STYLE}。半身立绘，纯均匀亮绿色 #00FF00 背景，无文字无边框无UI，1024x1024。`;
  const portraitJson = await generate(portraitRel, portraitPrompt, '1024x1024', 84);
  await summary(`stereo-portrait-${id}`, { provider: 'douzimi', model: 'gpt-image-2', output: portraitRel, requestId: portraitJson.id });
}

for (const [index, [name, desc]] of monsters.entries()) {
  const rel = `.gen/stereo-monster/${index}.webp`;
  if (!force && await exists(rel)) { console.log('skip existing', rel); continue; }
  const prompt = `${name}，${desc}。${STYLE}。单只完整全身小怪，朝右，纯均匀亮绿色 #00FF00 背景，没有文字、边框、水印，1024x1024。`;
  const json = await generate(rel, prompt, '1024x1024', 85);
  await summary(`stereo-monster-${index}`, { provider: 'douzimi', model: 'gpt-image-2', output: rel, requestId: json.id });
}

console.log('done. 下一步：repack 英雄图集并合成小怪图集。');
