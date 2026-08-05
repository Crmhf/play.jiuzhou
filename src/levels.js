const chapters = [
  {
    name:'涿郡·桃园烽烟', objective:'黄巾乱起，守住涿郡百姓并击败程远志', quote:'乱世既起，愿以此身护一方黎庶。',
    palette:['#f0a95c','#522e52','#ffe2a0'], hazard:'rockfall', length:150, minutes:'4–6', difficulty:'入门',
    feature:'桃园村道与黄巾乱军；宽阔地形用于熟悉连击、二段跳和闪避', terrain:'village', cadence:8.2,
    hp:1, attack:1, speed:1, ratios:[.08,.31,.55,.77], counts:[4,5,6,6], pool:[0,1,2,3,4],
    beats:['村口救援','桃园护民','粮仓反击','黄巾主阵']
  },
  {
    name:'虎牢关·雪夜雄关', objective:'突破拒马与箭塔，在关前斩将夺旗', quote:'雄关虽险，也挡不住同心之士。',
    palette:['#6fc5d8','#172137','#f0645a'], hazard:'battle-fog', length:180, minutes:'5–7', difficulty:'普通',
    feature:'暴雪、战雾与高低箭台；远程兵首次成为主要威胁', terrain:'fortress', cadence:7.3,
    hp:1.1, attack:1.05, speed:1.02, ratios:[.07,.25,.44,.63,.81], counts:[4,5,5,6,7], pool:[0,1,2,4,7,9],
    beats:['雪原拒马','前哨箭塔','瓮城伏击','关墙争夺','华雄军门']
  },
  {
    name:'虎牢关·无双战场', objective:'三军合击，压制赤兔冲锋与方天画戟', quote:'人中吕布，亦要问过我等手中兵刃！',
    palette:['#d4a642','#5b2b27','#ffd879'], hazard:'gale', length:215, minutes:'6–8', difficulty:'进阶',
    feature:'强风推位与骑兵冲阵；吕布战前连续精锐波次检验走位', terrain:'cavalry', cadence:6.5,
    hp:1.2, attack:1.12, speed:1.04, ratios:[.07,.24,.42,.61,.80], counts:[5,5,6,7,7], pool:[6,7,10,16,21,22],
    beats:['诸侯联阵','西凉突骑','飞熊压阵','赤兔踏营','无双辕门']
  },
  {
    name:'长坂坡·当阳乱军', objective:'穿过曹军追阵，护送百姓撤离断桥', quote:'子龙一身是胆，今日七进七出。',
    palette:['#6db6d8','#182741','#b7ecff'], hazard:'pursuit', length:250, minutes:'7–9', difficulty:'进阶',
    feature:'追兵夹击、断桥高台与乱军冲阵；强调高速突破和空中转向', terrain:'broken-bridge', cadence:6,
    hp:1.32, attack:1.2, speed:1.06, ratios:[.06,.23,.40,.58,.77], counts:[5,6,7,7,8], pool:[7,10,11,12,20,24],
    beats:['百姓撤离','曹军追阵','乱军救援','断桥血战','长坂残阳']
  },
  {
    name:'赤壁·连环火船', objective:'点燃连船，摧毁曹军水寨中枢', quote:'东风已至，江火将照亮天下大势。',
    palette:['#b25ee0','#321942','#ff984c'], hazard:'fire-arrows', length:290, minutes:'8–10', difficulty:'困难',
    feature:'多段船甲板、东风推力和火箭雨；战斗空间周期性改变', terrain:'fleet', cadence:5.5,
    hp:1.44, attack:1.28, speed:1.08, ratios:[.06,.20,.35,.50,.66,.82], counts:[5,6,7,7,8,8], pool:[8,10,12,13,17,18],
    beats:['潜入水寨','夺取火种','连船突围','东风骤起','火烧中军','赤壁烈焰']
  },
  {
    name:'华容道·风雨旧义', objective:'穿越浓雾峡谷，击退许褚与虎卫追兵', quote:'军令如山，旧义亦重；这一刀如何落下？',
    palette:['#ef5537','#40151b','#ffc050'], hazard:'rolling-logs', length:335, minutes:'9–11', difficulty:'困难',
    feature:'狭长峡谷、滚木落石与虎卫重甲；需要保留闪避应对重击', terrain:'canyon', cadence:5.1,
    hp:1.58, attack:1.36, speed:1.1, ratios:[.05,.19,.34,.50,.67,.83], counts:[6,6,7,8,8,9], pool:[9,10,16,19,24,29],
    beats:['雨夜入谷','泥泞伏兵','滚木险道','虎卫合围','旧义难决','华容隘口']
  },
  {
    name:'濡须口·单刀赴会', objective:'识破吴营伏兵，冲出锁链刀斧阵', quote:'关某只带一刀，便足以赴这场江东之会。',
    palette:['#4fbaca','#111f35','#e6c36a'], hazard:'chain-trap', length:380, minutes:'10–12', difficulty:'险峻',
    feature:'水寨高台、锁链减速与两侧伏兵；远近敌军形成交叉火力', terrain:'water-fort', cadence:4.7,
    hp:1.72, attack:1.45, speed:1.11, ratios:[.05,.18,.32,.47,.63,.80], counts:[6,7,8,8,9,9], pool:[13,14,15,18,19,23],
    beats:['江东赴会','水寨刀门','锦帆伏击','锁链阵眼','高台箭雨','单刀出营']
  },
  {
    name:'定军山·落日绝岭', objective:'抢占山巅高地，摧毁粮道并击败夏侯渊', quote:'老将尚能开强弓，定军山今日扬名。',
    palette:['#7dbd5d','#1d2d1c','#e6bd57'], hazard:'cavalry-charge', length:430, minutes:'11–14', difficulty:'险峻',
    feature:'连续上坡平台、弩阵和骑兵横冲；黄忠远程玩法获得优势', terrain:'mountain', cadence:4.35,
    hp:1.88, attack:1.54, speed:1.12, ratios:[.05,.17,.29,.42,.56,.70,.84], counts:[6,7,7,8,9,9,10], pool:[12,16,20,21,25,29],
    beats:['山脚夺道','半山弩阵','粮道奇袭','绝壁攀攻','魏军反扑','落日高地','定军山巅']
  },
  {
    name:'夷陵·连营烈焰', objective:'穿过失控火阵，挽救被围的残军', quote:'火可破营，也可吞尽胜负与人心。',
    palette:['#ffbf50','#2d1829','#fff0bf'], hazard:'wildfire', length:485, minutes:'12–15', difficulty:'炼狱',
    feature:'长距离火场、战意灼烧与密集伏击；必须主动清场恢复节奏', terrain:'burning-camp', cadence:4,
    hp:2.05, attack:1.64, speed:1.14, ratios:[.045,.16,.28,.41,.55,.70,.85], counts:[7,7,8,9,9,10,10], pool:[8,14,18,19,23,27,28],
    beats:['连营惊火','救援残军','烈焰辎重','吴军夹攻','火墙突围','战意灼心','夷陵余烬']
  },
  {
    name:'五丈原·星落八阵', objective:'破除八阵图幻境，迎战司马懿三阶段军阵', quote:'星虽将落，北伐之志仍照后人。',
    palette:['#a955df','#0a0818','#ffd66e'], hazard:'formation-barrage', length:550, minutes:'15–18', difficulty:'终局',
    feature:'八阵长廊、全兵种轮战与司马懿终局军阵；八段精锐战后决战', terrain:'formation', cadence:3.65,
    hp:2.24, attack:1.76, speed:1.16, ratios:[.04,.14,.25,.37,.49,.62,.75,.87], counts:[7,8,8,9,10,10,11,12], pool:[16,19,22,24,26,27,28,29],
    beats:['星夜列阵','地门疑兵','风门飞矢','云门重甲','龙门冲锋','虎门杀阵','天门幻军','八阵中枢']
  }
];

const platformTypes = {
  village:['stone','stone','stone'], fortress:['stone','tower','stone','tower'], cavalry:['stone','stone'],
  'broken-bridge':['bridge','stone','bridge'], fleet:['deck','deck','mast'], canyon:['stone','ledge','stone'],
  'water-fort':['deck','tower','deck','tower'], mountain:['ridge','ridge','ledge'],
  'burning-camp':['deck','stone','deck'], formation:['stone','altar','stone','altar']
};

function platformProfile(mode, index, j) {
  const wave = Math.sin(index * 1.7 + j * 1.35);
  if (mode === 'village') return { y:.45 + wave * .42, w:5.2 + (j % 3) * .7 };
  if (mode === 'fortress') return { y:j % 4 === 1 ? 2.5 : j % 4 === 3 ? 1.45 : .65, w:j % 2 ? 4.2 : 5.7 };
  if (mode === 'cavalry') return { y:.45 + (j % 5 === 2 ? 1.25 : 0), w:6.8 + (j % 2) * 1.3 };
  if (mode === 'broken-bridge') return { y:.45 + (j % 5 === 1 ? 1.6 : j % 5 === 2 ? 2.25 : wave * .35), w:3.8 + (j % 3) * .9 };
  if (mode === 'fleet') return { y:.65 + (j % 4 === 1 ? 1.35 : j % 4 === 2 ? .65 : 0), w:6.5 + (j % 3) * .8 };
  if (mode === 'canyon') return { y:.4 + Math.abs(wave) * 1.35, w:3.8 + (j % 2) * 1.2 };
  if (mode === 'water-fort') return { y:j % 5 === 2 ? 3.15 : .65 + (j % 2) * 1.05, w:j % 5 === 2 ? 3.2 : 5.4 };
  if (mode === 'mountain') return { y:.45 + Math.min(4.2, j * .105) + wave * .4, w:4.5 + (j % 3) * .7 };
  if (mode === 'burning-camp') return { y:.45 + (j % 6 === 2 ? 2.1 : j % 6 === 4 ? 1.25 : wave * .25), w:4.2 + (j % 4) * .8 };
  if (mode === 'formation') return { y:.55 + [0,1.1,2.15,1.1][j % 4], w:4.1 + (j % 2) * 1.25 };
  return { y:.55 + wave * .7, w:4.8 };
}

function buildPlatforms(level, index) {
  const platforms = [{ x:(level.length - 2) / 2, y:-1.25, w:level.length + 22, h:1.5, type:'ground' }];
  const step = level.terrain === 'cavalry' ? 14.2 : level.terrain === 'mountain' ? 9.1 : index >= 7 ? 9.8 : index >= 4 ? 10.8 : 12.2;
  const types = platformTypes[level.terrain] || ['stone'];
  let j = 0;
  for (let x = 8; x < level.length - 9; x += step, j++) {
    const profile = platformProfile(level.terrain, index, j);
    platforms.push({ x, y:profile.y, w:profile.w, h:.42, type:types[j % types.length] });
  }
  return platforms;
}

function enemyWave(pool, waveNo, count) {
  const start = (waveNo * 2 + Math.floor(waveNo / 2)) % pool.length;
  return Array.from({ length:count }, (_, n) => pool[(start + n * (waveNo % 2 ? 2 : 1)) % pool.length]);
}

export const LEVELS = chapters.map((chapter, i) => ({
  id:i + 1,
  name:chapter.name,
  objective:chapter.objective,
  background:`assets/backgrounds/level-${String(i + 1).padStart(2, '0')}.webp`,
  palette:chapter.palette,
  hazard:chapter.hazard,
  hazardInterval:chapter.cadence,
  length:chapter.length,
  expectedMinutes:chapter.minutes,
  difficulty:chapter.difficulty,
  feature:chapter.feature,
  terrain:chapter.terrain,
  enemyScale:{ hp:chapter.hp, attack:chapter.attack, speed:chapter.speed },
  platforms:buildPlatforms(chapter, i),
  waves:[
    ...chapter.ratios.map((ratio, waveNo) => ({
      at:Math.round(chapter.length * ratio),
      title:chapter.beats[waveNo],
      enemies:enemyWave(chapter.pool, waveNo, chapter.counts[waveNo])
    })),
    { at:Math.round(chapter.length * .93), boss:i, title:`决战 · ${chapter.name}` }
  ],
  story:[
    `第${i + 1}战 · ${chapter.name}`,
    `${chapter.objective}（建议 ${chapter.minutes} 分钟，战场长度 ${chapter.length}）`,
    `${chapter.quote}\n关卡特色：${chapter.feature}`
  ]
}));
