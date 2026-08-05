#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_CHARACTER_ROOT = '/Users/diyuan/Downloads/三国类 三国志 Spine动画源文件 带特效 武侠古风 2d角色动画设计/D002-三国志人物SPINE动画参考';
const DEFAULT_EFFECT_ROOT = '/Users/diyuan/Downloads/1.Play/A872  800+套Spine特效技能合集/spine特效';
const argv = process.argv.slice(2);
const arg = (flag, fallback) => { const i = argv.indexOf(flag); return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback; };
const characterRoot = arg('--characters', DEFAULT_CHARACTER_ROOT);
const effectRoot = arg('--effects', DEFAULT_EFFECT_ROOT);
const outDir = path.resolve(arg('--out', 'reference/spine'));

function walk(root) {
  const files = []; const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries; try { entries = fs.readdirSync(dir, { withFileTypes:true }); } catch { continue; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full); else files.push(full);
    }
  }
  return files;
}
function extCounts(files) {
  const counts = {};
  for (const file of files) { const ext = path.extname(file).toLowerCase() || '(none)'; counts[ext] = (counts[ext] || 0) + 1; }
  return Object.fromEntries(Object.entries(counts).sort((a,b)=>b[1]-a[1]));
}
function packages(files, root) {
  const packageDirs = new Map();
  for (const file of files) {
    if (!/\.(skel|json|spine)$/i.test(file)) continue;
    const dir = path.dirname(file); const rel = path.relative(root, dir);
    const list = packageDirs.get(rel) || []; list.push(path.basename(file)); packageDirs.set(rel, list);
  }
  return [...packageDirs].map(([dir, files]) => ({ dir, files })).sort((a,b)=>a.dir.localeCompare(b.dir,'zh-CN'));
}
const keywords = ['guanyu','zhangfei','zhaoyun','huangzhong','lvbu','xiahouchun','xiahoudun','caoren','xuchu','ganning','xiahoyuan','xiahousyuan','luxun','simayi','程远志','华雄','吕布','夏侯惇','曹仁','许褚','甘宁','夏侯渊','陆逊','司马懿','attack_daoguang','base_fly_arrow','base_fly_fire','base_fly_thunder'];
function matches(files, root) {
  const out = {};
  for (const key of keywords) out[key] = files.filter(f => path.relative(root,f).toLowerCase().includes(key.toLowerCase())).slice(0,80).map(f=>path.relative(root,f));
  return Object.fromEntries(Object.entries(out).filter(([,v])=>v.length));
}

const started = Date.now();
const characterFiles = walk(characterRoot); const effectFiles = walk(effectRoot);
const inventory = {
  generatedAt:new Date().toISOString(),
  roots:{ characters:characterRoot, effects:effectRoot },
  characters:{ files:characterFiles.length, bytes:characterFiles.reduce((n,f)=>n+fs.statSync(f).size,0), extensions:extCounts(characterFiles), packages:packages(characterFiles,characterRoot).length, matches:matches(characterFiles,characterRoot) },
  effects:{ files:effectFiles.length, bytes:effectFiles.reduce((n,f)=>n+fs.statSync(f).size,0), extensions:extCounts(effectFiles), packages:packages(effectFiles,effectRoot).length, matches:matches(effectFiles,effectRoot) },
  elapsedMs:Date.now()-started
};
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'inventory.generated.json'),JSON.stringify(inventory,null,2));
const mib=n=>(n/1024/1024).toFixed(1);
let md=`# Spine 与技能特效自动库存\n\n生成时间：${inventory.generatedAt}\n\n> 此文件记录扫描统计与关键词命中；正式选材映射见 \`SPINE_INVENTORY.md\`。源素材许可证需单独确认，仓库默认不复制整库。\n\n`;
md+=`| 素材库 | 文件数 | 容量 | 可识别包 | 主要格式 |\n|---|---:|---:|---:|---|\n`;
md+=`| 三国角色 Spine | ${inventory.characters.files.toLocaleString()} | ${mib(inventory.characters.bytes)} MiB | ${inventory.characters.packages} | ${Object.entries(inventory.characters.extensions).slice(0,5).map(([k,v])=>`${k} ${v}`).join('、')} |\n`;
md+=`| A872 技能特效 | ${inventory.effects.files.toLocaleString()} | ${mib(inventory.effects.bytes)} MiB | ${inventory.effects.packages} | ${Object.entries(inventory.effects.extensions).slice(0,5).map(([k,v])=>`${k} ${v}`).join('、')} |\n\n`;
for (const [group,data] of [['角色/Boss关键词',inventory.characters.matches],['技能关键词',inventory.effects.matches]]) {
  md+=`## ${group}\n\n`;
  for (const [key, paths] of Object.entries(data)) {
    md+=`### ${key}\n\n${paths.slice(0,12).map(p=>`- \`${p}\``).join('\n')}\n\n`;
  }
}
fs.writeFileSync(path.join(outDir,'INVENTORY_GENERATED.md'),md);
console.log(`Scanned ${characterFiles.length + effectFiles.length} files in ${inventory.elapsedMs} ms; wrote ${outDir}.`);
