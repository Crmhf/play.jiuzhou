/**
 * 九州灵迹 · 角色与敌人图鉴
 *
 * 四位节气行者对应春夏秋冬与木火金水：禾灵（女·春木）、炎朔（男·夏火）、
 * 疏桐（女·秋金）、玄泓（男·冬水）。敌人图鉴保留十种山海异兽。
 */
export const HEROES = {
  heling: {
    name: '禾灵', title: '节气行者', gender: '女', element: '木', color: '#83d58c', accent: '#efc46d',
    atlas: 'assets/characters/heling/atlas.webp',
    fallbackAtlas: 'assets/characters/guanyu/atlas.webp',
    hp: 150, speed: 7.4, accel: 42, brake: 58, jump: 12.2, attack: 23, skillCd: 4.8,
    ultimate: '春木·万物生', skill: '水灵·润泽', passive: '铜钱与竹简会为灵珠蓄力；空中可再次起跳',
    weapon: '稷镰', atlasCols: 4, atlasRows: 3, artFacing: 1,
    frames: { idle: 0, walk: [1, 1], run: [2, 2], jump: 3, attack: [4, 4], attack1: [4, 4], attack2: [5, 5], attack3: [6, 6], skill: [7, 7], ultimate: [8, 8], hurt: 9, dash: 10, victory: 11 },
    motion: { attack: [.18, .22, .34], skill: .78, ultimate: 1.25 }
  },
  yanshuo: {
    name: '炎朔', title: '炎夏行者', gender: '男', element: '火', color: '#e8784a', accent: '#ffd27d',
    atlas: 'assets/characters/yanshuo/atlas.webp',
    fallbackAtlas: 'assets/characters/guanyu/atlas.webp',
    hp: 135, speed: 7.8, accel: 48, brake: 60, jump: 12.8, attack: 26, skillCd: 5.2,
    ultimate: '大暑·熔岩焚野', skill: '小暑·炎息燎原', passive: '连击燃火：第三段普攻附带灼烧，技能三段火浪爆发更高',
    weapon: '熔焰钺', atlasCols: 4, atlasRows: 3, artFacing: 1,
    frames: { idle: 0, walk: [1, 1], run: [2, 2], jump: 3, attack: [4, 4], attack1: [4, 4], attack2: [5, 5], attack3: [6, 6], skill: [7, 7], ultimate: [8, 8], hurt: 9, dash: 10, victory: 11 },
    motion: { attack: [.16, .2, .3], skill: .82, ultimate: 1.3 }
  },
  shutong: {
    name: '疏桐', title: '金秋行者', gender: '女', element: '金', color: '#d9b866', accent: '#f4e2b0',
    atlas: 'assets/characters/shutong/atlas.webp',
    fallbackAtlas: 'assets/characters/huangzhong/atlas.webp',
    hp: 120, speed: 7.9, accel: 46, brake: 62, jump: 12.6, attack: 24, skillCd: 4.4,
    ultimate: '秋分·万叶归宗', skill: '白露·金风叶刃', passive: '金叶飞刃：技能远程扇形命中，命中会回复少量灵气',
    weapon: '金叶轮', atlasCols: 4, atlasRows: 3, artFacing: 1,
    frames: { idle: 0, walk: [1, 1], run: [2, 2], jump: 3, attack: [4, 4], attack1: [4, 4], attack2: [5, 5], attack3: [6, 6], skill: [7, 7], ultimate: [8, 8], hurt: 9, dash: 10, victory: 11 },
    motion: { attack: [.15, .19, .28], skill: .72, ultimate: 1.2 }
  },
  xuanhong: {
    name: '玄泓', title: '玄冬行者', gender: '男', element: '水', color: '#7fb8d9', accent: '#c9edf5',
    atlas: 'assets/characters/xuanhong/atlas.webp',
    fallbackAtlas: 'assets/characters/zhaoyun/atlas.webp',
    hp: 165, speed: 7.0, accel: 38, brake: 54, jump: 11.8, attack: 22, skillCd: 6.0,
    ultimate: '冬至·寒泉归海', skill: '大雪·玄冰护体', passive: '玄冰护体：技能生成护盾，命中会冻结近身敌人',
    weapon: '玄冰戟', atlasCols: 4, atlasRows: 3, artFacing: 1,
    frames: { idle: 0, walk: [1, 1], run: [2, 2], jump: 3, attack: [4, 4], attack1: [4, 4], attack2: [5, 5], attack3: [6, 6], skill: [7, 7], ultimate: [8, 8], hurt: 9, dash: 10, victory: 11 },
    motion: { attack: [.2, .24, .36], skill: .9, ultimate: 1.35 }
  }
};

const enemySpecs = [
  ['山猪精', 'beast', false, true, 56, 8, 3.2, '#b9784c'],
  ['蜂妖', 'insect', true, false, 38, 7, 3.8, '#e3bd4e'],
  ['食人藤', 'vine', false, false, 44, 9, 1.7, '#63a268'],
  ['雷泽蜥', 'thunder', true, false, 52, 10, 3.1, '#8f9fe8'],
  ['石敢当', 'stone', false, true, 90, 14, 2.0, '#8d786e'],
  ['水魈', 'water', false, false, 62, 12, 2.8, '#4d9fb3'],
  ['火鼠', 'fire', true, false, 48, 11, 3.6, '#d66c47'],
  ['木魅', 'wood', false, false, 68, 13, 2.5, '#638b5c'],
  ['九尾狐灵', 'fox', true, false, 72, 15, 3.4, '#c686bc'],
  ['雷鼓傀儡', 'golem', false, true, 118, 18, 1.8, '#9f7ebd']
];

export const MONSTERS = enemySpecs.map(([name, type, ranged, heavy, hp, attack, speed, color], id) => ({
  id, name, type, group: 1, cell: id % 10, atlas: 'assets/monsters/group-1/atlas.webp',
  fallbackAtlas: 'assets/monsters/group-2/atlas.webp', ranged, heavy, hp, attack, speed,
  scale: heavy ? 2.15 : 1.75, color
}));

export const BOSSES = [{
  id: 0,
  name: '春雷木魈',
  key: 'chunlei-muxiao',
  pattern: 'thunderwood',
  color: '#b6dd74',
  atlas: 'assets/bosses/muxiao/atlas.webp',
  fallbackAtlas: 'assets/bosses/group-2/atlas.webp',
  atlasCols: 4,
  atlasRows: 3,
  artFacing: 1,
  fps: 8,
  frames: { idle: [0], move: [1, 2, 3], intro: [0, 4], windup: [4], attack0: [5, 6], attack1: [4, 6, 7], attack2: [8, 9], recover: [6, 0], hurt: [9], phase: [4, 8], death: [10, 11] },
  hp: 920,
  attack: 18,
  speed: 2.7,
  scale: 2.6
}];
