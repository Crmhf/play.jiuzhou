/**
 * 九州灵迹 · 角色与敌人图鉴
 *
 * 第一版只让玩家操作一名主角“禾灵”，但敌人图鉴保留十种山海异兽，
 * 这样后续扩展关卡时无需重做战斗数据层。
 */
export const HEROES = {
  heling: {
    name: '禾灵', title: '节气行者', color: '#83d58c', accent: '#efc46d',
    atlas: 'assets/characters/heling/atlas.webp',
    fallbackAtlas: 'assets/characters/guanyu/atlas.webp',
    hp: 150, speed: 7.4, accel: 42, brake: 58, jump: 12.2, attack: 23, skillCd: 4.8,
    ultimate: '春木·万物生', skill: '水灵·润泽', passive: '铜钱与竹简会为灵珠蓄力；空中可再次起跳',
    weapon: '稷镰', atlasCols: 4, atlasRows: 3, artFacing: 1,
    frames: { idle: 6, walk: [1, 3], run: [0, 3], jump: 0, attack: [3, 4], attack1: [3, 4, 3], attack2: [4, 3, 4], attack3: [3, 4, 5, 4, 3], skill: [5, 4, 5], ultimate: [5, 4, 5, 3, 5], hurt: 8 },
    motion: { attack: [.18, .22, .34], skill: .78, ultimate: 1.25 }
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
