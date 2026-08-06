/**
 * 九州灵迹 · 三关纵向切片
 * 关卡数据将“教学目标、场景语义、机关、收集物、敌人波次、Boss”放在同一个配置里，
 * 让后续扩充二十四节气时只需增加数据而不必重写渲染和物理。
 */
const terrainProfiles = {
  village: { step: 13, types: ['taoyuan', 'field', 'bridge'], fn: (j) => ({ y: 1.9 + Math.sin(j * 1.35) * .45 + (j % 3) * .35, w: 5.8 + (j % 3) * .6 }) },
  bamboo: { step: 10.6, types: ['bamboo', 'stone', 'vine-platform'], fn: (j) => ({ y: [1.6, 2.2, 2.9, 1.9][j % 4], w: 4.0 + (j % 3) * .55 }) },
  water: { step: 9.8, types: ['wood-bridge', 'water-platform', 'stone-bridge'], fn: (j) => ({ y: [1.5, 2.2, 1.75, 2.8, 2.0][j % 5], w: 4.2 + (j % 2) * 1.1 }) }
};

function buildPlatforms(length, terrain) {
  const profile = terrainProfiles[terrain];
  const platforms = [{ x: (length - 2) / 2, y: -1.25, w: length + 22, h: 1.5, type: 'ground' }];
  let j = 0;
  for (let x = 7; x < length - 9; x += profile.step, j++) {
    const item = profile.fn(j);
    platforms.push({ x, y: item.y, w: item.w, h: .42, type: profile.types[j % profile.types.length] });
  }
  return platforms;
}

const chapters = [
  {
    id: 1, season: '立春', name: '立春·桃源村', shortName: '桃源村', terrain: 'village', length: 188,
    objective: '学会移动与跳跃，收集铜钱，避开竹刺，击败山猪精并激活节气碑。',
    quote: '东风解冻，蛰虫始振。桃枝先醒，山河有信。',
    palette: ['#b8e4a5', '#274d3a', '#f4cf82'], background: 'assets/backgrounds/jiuzhou-spring-village.webp',
    hazard: 'bamboo-spike', hazardInterval: 7.2, difficulty: '启蒙', feature: '田埂、古井、牌楼、竹篱与第一座节气碑',
    waves: [
      { at: 30, title: '村口试炼', enemies: [0, 0, 1] },
      { at: 72, title: '田埂伏击', enemies: [0, 1, 2, 1] },
      { at: 118, title: '桃林守望', enemies: [0, 2, 3, 0] },
      { at: 164, title: '山猪精现身', enemies: [0, 0, 4] }
    ],
    coins: 18, bambooSlips: 2, checkpoints: [64, 128], monument: 172,
    story: ['第一关 · 立春·桃源村', '从春社古道出发，找回被山猪精掠走的节气印。', '完成教学：移动、跳跃、普攻、铜钱收集与节气碑激活。']
  },
  {
    id: 2, season: '惊蛰', name: '惊蛰·雷竹林', shortName: '雷竹林', terrain: 'bamboo', length: 224,
    objective: '掌握二段跳与藤蔓牵引，收集隐藏竹简，穿过雷电机关。',
    quote: '春雷响，万物长。竹节藏雷纹，简上记山海。',
    palette: ['#90c8b0', '#142f34', '#d9d27b'], background: 'assets/backgrounds/jiuzhou-thunder-bamboo.webp',
    hazard: 'falling-rock', hazardInterval: 5.4, difficulty: '进阶', feature: '雷纹机关、竹制悬台、藤蔓牵引与隐藏竹简',
    waves: [
      { at: 28, title: '蜂妖惊巢', enemies: [1, 1, 2] },
      { at: 76, title: '藤影迷踪', enemies: [2, 3, 1, 2] },
      { at: 132, title: '雷泽回响', enemies: [3, 4, 1, 3] },
      { at: 182, title: '竹林深处', enemies: [2, 5, 4, 1, 3] },
      { at: 205, title: '雷鼓守门', enemies: [9, 3, 4] }
    ],
    coins: 22, bambooSlips: 4, checkpoints: [82, 156], monument: 210,
    story: ['第二关 · 惊蛰·雷竹林', '雷纹从竹简中苏醒，只有穿越雷泽机关才能继续追踪灵迹。', '教学进阶：二段跳、藤蔓牵引、雷电机关与隐藏收集。']
  },
  {
    id: 3, season: '春分', name: '春分·水乡古道', shortName: '水乡古道', terrain: 'water', length: 242,
    objective: '利用水灵关闭火焰机关，挑战春雷木魈，获得第一枚五行灵珠。',
    quote: '日夜分，阴阳和。水行其道，木得其生。',
    palette: ['#7eb8c2', '#163340', '#edb56d'], background: 'assets/backgrounds/jiuzhou-water-town.webp',
    hazard: 'fire-jet', hazardInterval: 5.7, difficulty: '试炼', feature: '水流、木桥、升降台、乌篷船与五行灵珠祭坛',
    waves: [
      { at: 30, title: '古道水魈', enemies: [5, 1, 5] },
      { at: 82, title: '火盆封锁', enemies: [6, 3, 1, 5] },
      { at: 138, title: '水车回廊', enemies: [5, 7, 6, 3, 1] },
      { at: 190, title: '木桥尽头', enemies: [7, 8, 5, 6, 4] },
      { at: 223, title: '春雷木魈', boss: 0 }
    ],
    coins: 26, bambooSlips: 4, checkpoints: [90, 174], monument: 228,
    story: ['第三关 · 春分·水乡古道', '火焰机关吞噬古道，水灵是打开五行祭坛的唯一钥匙。', '终段试炼：水灵灭火、木桥节奏、春雷木魈与五行灵珠祭坛。']
  }
];

export const LEVELS = chapters.map((chapter) => ({
  ...chapter,
  platforms: buildPlatforms(chapter.length, chapter.terrain),
  enemyScale: { hp: chapter.id === 1 ? .82 : chapter.id === 2 ? .98 : 1.12, attack: chapter.id === 1 ? .86 : chapter.id === 2 ? 1 : 1.18, speed: chapter.id === 1 ? .95 : chapter.id === 2 ? 1 : 1.06 }
}));

export const TRAP_TYPES = {
  'bamboo-spike': { name: '竹刺', color: '#b7d783', damage: 22, width: 1.4, height: .55 },
  'falling-rock': { name: '落石', color: '#9d8f7c', damage: 30, width: 1.2, height: 1.2 },
  'fire-jet': { name: '火焰机关', color: '#ef7b4b', damage: 34, width: 1.25, height: 1.5 }
};
