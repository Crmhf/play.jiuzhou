export const HEROES = {
  guanyu: {
    name: '关羽', title: '武圣云长', color: '#69c56b', accent: '#f2b64c', atlas: 'assets/characters/guanyu/atlas.webp',
    hp: 155, speed: 6.8, accel:36, brake:52, jump: 11.7, attack: 21, skillCd: 5.2, ultimate: '武圣·青龙降世', skill: '拖刀偃月',
    passive: '高连击提升破甲，重击可斩杀残血敌军', weapon: '青龙偃月刀', atlasCols:4, atlasRows:3, artFacing:1, frameFacing:[-1,-1,-1,-1,-1,1,-1,-1,-1], frames: { idle:6, walk:[1,3], run:[0,3], jump:0, attack:[3,4], skill:5, hurt:8 }
  },
  zhangfei: {
    name: '张飞', title: '燕人翼德', color: '#ef7062', accent: '#f0cf55', atlas: 'assets/characters/zhangfei/atlas.webp',
    hp: 185, speed: 6.2, accel:30, brake:45, jump: 11.0, attack: 20, skillCd: 5.8, ultimate: '燕人·雷霆万军', skill: '当阳怒吼',
    passive: '受击积攒怒气，低生命时获得短暂霸体', weapon: '丈八蛇矛', atlasCols:4, atlasRows:3, artFacing:1, frames: { idle:6, walk:[1,0], run:[0,2], jump:2, attack:[3,5], skill:7, hurt:4 }
  },
  zhaoyun: {
    name: '赵云', title: '常胜子龙', color: '#9ad9ff', accent: '#4d7fff', atlas: 'assets/characters/zhaoyun/atlas.webp',
    hp: 120, speed: 9.2, accel:50, brake:64, jump: 13.6, attack: 15, skillCd: 3.7, ultimate: '常胜·龙魂千影', skill: '七探盘蛇',
    passive: '空中攻击、冲刺和背击伤害提高', weapon: '龙胆亮银枪', atlasCols:4, atlasRows:3, artFacing:1, frames: { idle:0, walk:[1,4], run:[3,6], jump:2, attack:[0,3], skill:5, hurt:7 }
  },
  huangzhong: {
    name: '黄忠', title: '定军老将', color: '#f0c35c', accent: '#e6603d', atlas: 'assets/characters/huangzhong/atlas.webp',
    hp: 110, speed: 7.2, accel:38, brake:54, jump: 12.1, attack: 17, skillCd: 4.2, ultimate: '定军·落日箭阵', skill: '百步穿杨',
    passive: '距离越远伤害越高，暴击返还能量', weapon: '万石弓', atlasCols:4, atlasRows:3, artFacing:-1, frames: { idle:6, walk:[1,0], run:[0,1], jump:3, attack:[4,7], skill:5, hurt:3 }
  }
};

const monsterNames = [
  '黄巾刀兵','黄巾弓手','黄巾力士','符水术士','山贼斥候','藤甲兵','狼骑兵','长枪兵','火油兵','巨盾兵',
  '虎豹骑','青州兵','连弩手','锦帆贼','解烦卫','丹阳兵','铁甲校尉','霹雳车手','毒箭女兵','陷阵死士',
  '白马义从','西凉铁骑','飞熊军','无当飞军','虎卫','先登营','八阵傀儡','雷鼓术士','黑山影卫','玄甲战兽'
];
export const MONSTERS = monsterNames.map((name, i) => {
  const group = Math.floor(i / 10) + 1;
  const cell = i % 10;
  const ranged = [1,3,8,12,17,18,20,27,28].includes(i);
  const heavy = [2,5,6,9,10,16,19,21,22,24,26,29].includes(i);
  return {
    id: i, name, group, cell, atlas: `assets/monsters/group-${group}/atlas.webp`, ranged, heavy,
    hp: 30 + group * 14 + (heavy ? 30 : 0), attack: 5 + group * 2 + (heavy ? 4 : 0),
    speed: ranged ? 3.1 : (heavy ? 2.65 : 4.2), scale: heavy ? 2.2 : 1.68,
    color: ['#e2b348','#6aaee8','#ba78df'][group-1]
  };
});

const bossKeys = ['chengyuanzhi','huaxiong','lvbu','xiahoudun','caoren','xuchu','ganning','xiahouyuan','luxun','simayi'];
const bossFolders = ['01-chengyuanzhi','02-huaxiong','03-lvbu','04-xiahoudun','05-caoren','06-xuchu','07-ganning','08-xiahouyuan','09-luxun','10-simayi'];
const bossSpriteFrames = {
  idle:[0], move:[1,2,3], intro:[0,4], windup:[4],
  attack0:[5,6], attack1:[4,6,7], attack2:[8,9],
  recover:[6,0], hurt:[9], phase:[4,8], death:[10,11]
};

export const BOSSES = [
  {name:'程远志', pattern:'slam', color:'#e2b348'},
  {name:'华雄', pattern:'charge', color:'#d05243'},
  {name:'吕布', pattern:'wind', color:'#e84b55'},
  {name:'夏侯惇', pattern:'poison', color:'#6ca7d9'},
  {name:'曹仁', pattern:'gourd', color:'#7e98b8'},
  {name:'许褚', pattern:'fire', color:'#db8448'},
  {name:'甘宁', pattern:'web', color:'#47a8c8'},
  {name:'夏侯渊', pattern:'roar', color:'#a2b84e'},
  {name:'陆逊', pattern:'bell', color:'#ef6d42'},
  {name:'司马懿', pattern:'lotus', color:'#a450d5'}
].map((b,i)=>({
  ...b, id:i, key:bossKeys[i], cell:0,
  atlas:`assets/bosses/animated/${bossFolders[i]}/atlas.webp`,
  fallbackAtlas:`assets/bosses/group-${i<5?1:2}/atlas.webp`, fallbackCell:i%5,
  atlasCols:4, atlasRows:3, artFacing:1, fps:8,
  frames:(i===5||i===7)?{...bossSpriteFrames,hurt:[10]}:bossSpriteFrames,
  hp:380+i*78, attack:13+i*1.9, speed:3.0+i*.065,
  scale:3.35+(i===2?.25:0)+(i===9?.55:0)
}));
