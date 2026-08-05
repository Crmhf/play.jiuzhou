# 三国大乱斗 Spine 素材映射清单

> 汇总日期：2026-08-04  
> 探查方式：只读目录、文件格式、体积、Spine 版本头、索引预览图与 A872 文件夹命名分析。  
> **本清单已纳入项目文档；未把整套原始素材复制到公开仓库。**

## 1. 素材源概况

### 1.1 三国人物 Spine 源文件

根目录：

`/Users/diyuan/Downloads/三国类 三国志 Spine动画源文件 带特效 武侠古风 2d角色动画设计/D002-三国志人物SPINE动画参考/`

已盘点结果：

- 总体积约 **1.0 GB**。
- 文件约 **66,949** 个。
- `PNG`：62,473 个。
- `SKEL`：2,080 个。
- `ATLAS`：2,080 个。
- Spine 工程源文件 `.spine`：314 个。
- 角色目录以数字 ID 命名，人物名称没有随目录提供明确映射。
- `引索1/` 与 `引索2/` 是数字 ID 对应的静态角色预览图，可用于人工确认形象。
- 从 `.skel` 二进制头可识别的资源绝大多数为 **Spine 3.6.52**。二进制字符串中出现的 `3.6.52C`、`3.6.52B` 等尾字符多为版本字符串后紧邻的二进制字节，不应视为单独版本。
- 仍有约 121 个 `.skel` 未被简单字符串方式可靠识别版本，应在正式导入时逐包验证。

### 1.2 A872 800+ 套 Spine 技能特效

根目录：

`/Users/diyuan/Downloads/1.Play/A872  800+套Spine特效技能合集/spine特效/`

已盘点结果：

- 总体积约 **206 MB**。
- 文件约 **13,076** 个。
- `PNG`：10,649 个。
- `JSON`：809 个。
- `ATLAS`：809 个。
- Spine 工程源文件 `.spine`：809 个。
- JSON 导出版本分布：
  - **Spine 2.1.27：794 套**。
  - **Spine 3.6.53：14 套**。
  - **Spine 2.1.05：1 套**。
- 该目录以技能特效为主，不能默认当作带 `idle/run/jump/hurt/dead` 的完整人物骨骼包。
- 两个素材目录中没有发现音频格式文件；技能音效、受击音效、武器挥舞音效需要另行制作或引入。

---

## 2. 四名可选武将推荐

> 人物源目录只有数字 ID，没有作者提供的人名表。下列“人物本体”是根据 `引索1/引索2` 预览图、武器轮廓、配色和体型做的视觉适配推荐；不是对原素材人物身份的法律或作者级确认。正式接入前应运行 Spine 预览器确认动作完整性。

| 武将 | 推荐人物 Spine 包 | 推荐理由 | A872 专属特效包 | 推荐键位 |
|---|---|---|---|---|
| 关羽 | `/Users/diyuan/Downloads/三国类 三国志 Spine动画源文件 带特效 武侠古风 2d角色动画设计/D002-三国志人物SPINE动画参考/01三国志/20500/` | 预览图为绿色重甲、长髯、长柄大刀，关羽辨识度最高；目录约 7 MB，含 `skeleton.skel/.atlas` 及技能资源 | `.../spine特效/guanyu_phyattack/`、`guanyu_skill1/`、`guanyu_skill2/`、`guanyu_skill3/`、`guanyu_skill4/`；高清备选 `guanyu_2phyattack/`、`guanyu_2skill1/2/3/` | J=`guanyu_phyattack`；K=`guanyu_skill1`；L=`guanyu_2skill3` 或 `guanyu_skill4` |
| 张飞 | `/Users/diyuan/Downloads/三国类 三国志 Spine动画源文件 带特效 武侠古风 2d角色动画设计/D002-三国志人物SPINE动画参考/02三国志/101000/` | 重型红黑猛将轮廓，适合张飞的高力量、霸体、范围震地定位；该包已识别到 `move/run/hit/dead/skill0` 一类动作标记 | `.../spine特效/role/zhangfei_2/`、`zhangfei_skill1/`、`zhangfei_skill2/`、`zhangfei_skill4/`、`buff/zhangfei_skill05/` | J=`role/zhangfei_2/skill0`；K=`zhangfei_skill1`；L=`zhangfei_skill2` 或 `skill4` |
| 赵云 | `/Users/diyuan/Downloads/三国类 三国志 Spine动画源文件 带特效 武侠古风 2d角色动画设计/D002-三国志人物SPINE动画参考/01三国志/20200/` | 蓝银长兵器武将，体型轻快，适合冲刺、枪连击和空中追击；已识别 `move/gongji/shouji/dead/hit1-3/skill0-2/win` 等动作标记 | `.../spine特效/role/zhaoyun/`、`role/zhaoyun_2/`、`buff/zhaoyun_skill3_2/`、`buff/zhaoyun_2_skill3_2/` | J=`role/zhaoyun/skill0`；K=`role/zhaoyun/skill2`；L=`role/zhaoyun_2/skill2` 或 skill3 buff |
| 黄忠 | `/Users/diyuan/Downloads/三国类 三国志 Spine动画源文件 带特效 武侠古风 2d角色动画设计/D002-三国志人物SPINE动画参考/02三国志/1300200/` | 索引预览为白发弓手形象，适合远程蓄力、贯穿箭和箭雨；接入前重点确认是否有完整跑跳动作 | `.../spine特效/huangzhong_skill1/`、`huangzhong_skill2/`、`base_fly_arrow/` | J=`base_fly_arrow`；K=`huangzhong_skill1`；L=`huangzhong_skill2` |

### 四武将动作接入建议

- 人物本体优先使用第一个目录中的 `skeleton.skel + skeleton.atlas + PNG`。
- A872 用作独立的特效层，不要直接替换人物本体动画。
- J 普攻建议拆成：人物攻击动作轨道 + 武器刀光/箭矢轨道 + 命中特效轨道。
- K 技能建议使用中等范围、短冷却特效。
- L 技能建议使用大范围、镜头震动、慢动作、Bloom 和较长冷却。
- 角色缺少 `jump/fall/land` 时，不建议用骨骼动画硬凑；可先使用 `run/idle` 姿态配合整体骨骼位移，再补制跳跃动画。

---

## 3. 十关 Boss 推荐 Spine 包

| 关卡 Boss | 推荐人物本体路径 | A872 Boss 技能特效映射 | 备注与替代策略 |
|---|---|---|---|
| 1. 程远志 | `/Users/diyuan/Downloads/三国类 三国志 Spine动画源文件 带特效 武侠古风 2d角色动画设计/D002-三国志人物SPINE动画参考/02三国志/100400/` | `.../spine特效/huangjinyishi_skill1/`、`zhangjiao_skill1/`、`zhangjiao_skill2/` | A872 无 `chengyuanzhi` 命名包；使用黄巾力士和张角雷法组合，Boss 以冲撞、符雷、召唤黄巾兵为主 |
| 2. 华雄 | `.../D002-三国志人物SPINE动画参考/02三国志/101000/` | `.../spine特效/pangde_skill1/`、`pangde_skill2/`、`pangde_skill4/`，或 `xuhuang_skill1/2/` | A872 无 `huaxiong` 命名包；选择重刀、裂地、霸体型特效 |
| 3. 吕布 | `.../D002-三国志人物SPINE动画参考/02三国志/104003/` | `.../spine特效/lvbu_phyattack/`、`lvbu_skill1/`、`lvbu_skill2/`、`role/lvbu/` | 命名匹配度最高；`role/lvbu/lvbu_3_skill2_01/02` 可组合火花、斩击、受击闪光和大招多段效果 |
| 4. 夏侯惇 | `.../D002-三国志人物SPINE动画参考/02三国志/1100600/` | `.../spine特效/xiahouchun_skill1/`、`role/xiahouchun_2/skill1/2/3/5/` | 素材拼音使用 `xiahouchun`，实际应按夏侯惇管理；适合独眼狂暴、血怒和突进斩 |
| 5. 曹仁 | `.../D002-三国志人物SPINE动画参考/01三国志/20300/` | `.../spine特效/judunbing_phyattack/`、`judunbing_skill1/`、`daodunbing_skill1/`、`dunqibing_skill1/` | A872 无 `caoren` 命名包；人物预览为重盾大刀型，适合盾墙、反伤、格挡反击 |
| 6. 许褚 | `.../D002-三国志人物SPINE动画参考/02三国志/100800/` | `.../spine特效/xuchu_skill1/`、`xuchu_skill2/`、`xuchu_skill4/`、`role/xuchu_2/` | 命名匹配；适合抓投、震地、蓄力重击，Boss 霸体值应高于普通武将 |
| 7. 甘宁 | `.../D002-三国志人物SPINE动画参考/02三国志/800100/` | `.../spine特效/ganning_phyattack/`、`ganning_skill1/`、`ganning_skill2/`、`ganning_skill4/` | 命名匹配；适合高速双刀、残影、铃铛爆破和水浪冲刺 |
| 8. 夏侯渊 | `.../D002-三国志人物SPINE动画参考/02三国志/700500/` | `.../spine特效/xiahouyuan_skill1/`、`xiahouyuan_skill2/`、`base_fly_arrow/` | 人物包动作字符串出现 `gongjian`，适合弓箭 Boss；玩法使用后跳射击、箭雨、锁定贯穿箭 |
| 9. 陆逊 | `.../D002-三国志人物SPINE动画参考/02三国志/700100/` | `.../spine特效/luxun/`、`role/luxun_2/skill2/3/` | `luxun/` 内含 `luxun_phyattack` 和多个 skill 子包；适合火阵、连环燃烧、地面持续伤害 |
| 10. 司马懿 | `.../D002-三国志人物SPINE动画参考/02三国志/1100700/` | `.../spine特效/simayi_phyattack/`、`simayi_skill1/`、`simayi_skill2/`、`role/simayi_2/` | 命名匹配；作为终章 Boss，可组合黑紫法阵、分身、吸附、全屏落雷和阶段变身 |

### Boss 包选择原则

1. **人物轮廓优先**：Boss 必须在屏幕尺寸、颜色和武器轮廓上与小怪拉开差异。
2. **特效独立加载**：每关只预加载当前 Boss 的人物包和技能包，击败后释放纹理。
3. **重复人物目录问题**：张飞与华雄暂时都推荐了重型候选包 `101000`；正式制作时张飞优先换成另一个黑甲长矛本体，避免复用造型。A872 的 `role/zhangfei_2` 可作为确认张飞技能风格的依据。
4. **视觉适配不是身份确认**：数字 ID 目录没有人物名称元数据；进入主项目之前应建立可运行预览页逐个确认。

---

## 4. A872：J / K / L / 受击 / Boss 特效统一映射

### 4.1 输入动作语义

| 输入 | 游戏语义 | 推荐 A872 包 | 触发与表现 |
|---|---|---|---|
| J | 普攻/连续技 | `base_attack_daoguang/`、`attack_daoguang1/` 至 `attack_daoguang5/`，以及各武将 `*_phyattack/` | 3 段普攻使用不同刀光；命中帧同步产生小型闪光、轻微停顿和短震屏 |
| K | 技能一 | 各武将 `*_skill1/` 或 `role/<name>/skill1/2/` | 中等范围，冷却约 5–8 秒；优先使用位移、击飞或破防技能 |
| L | 技能二/无双 | 各武将 `*_skill2/3/4/`，大招优先 `role/<name>/skill3/4/5/` | 大范围、高粒子量、镜头拉近、0.08–0.15 秒命中停顿；移动端需限制同屏粒子数量 |
| 受击 | 命中反馈 | `shanguang/`、`shandianzi1/`、`role/lvbu/lvbu_3_skill2_02/` 中的 `skill1_shouji_*` 图序列 | 普通命中使用白/黄闪；破甲使用红闪；雷击使用 `shandianzi1`；不要每次都生成完整 Spine 实例 |
| 击杀 | 死亡消散 | `die_1/`，配合通用火花、烟尘或角色 `dead` 动画 | 先播放骨骼死亡，随后淡出；尸体与物理碰撞体及时销毁 |
| 箭矢 | 黄忠/夏侯渊飞行物 | `base_fly_arrow/`、`base_fly_fire/`、`base_fly_poison/`、`base_fly_thunder/` | 飞行物与爆炸特效分离；箭矢命中使用对象池，避免频繁创建纹理/骨骼实例 |

### 4.2 四武将快捷映射

| 武将 | J | K | L | 受击附加 |
|---|---|---|---|---|
| 关羽 | `guanyu_phyattack` 或 `guanyu_2phyattack` | `guanyu_skill1` | `guanyu_2skill3` + `guanyu_skill4` | 青色刀光 + 金色 `shanguang` |
| 张飞 | `role/zhangfei_2/skill0` | `zhangfei_skill1` | `zhangfei_skill2` 或 `zhangfei_skill4` | 红色冲击环 + 地面烟尘；L 加强震屏 |
| 赵云 | `role/zhaoyun/skill0` | `role/zhaoyun/skill2` | `role/zhaoyun_2/skill2` + `buff/zhaoyun_2_skill3_2` | 蓝白枪芒 + 小型电闪；连续命中减少特效生命周期 |
| 黄忠 | `base_fly_arrow` | `huangzhong_skill1` | `huangzhong_skill2` + 多箭对象池 | 箭矢命中火花；元素箭可替换为 fire/poison/thunder 飞行包 |

### 4.3 十 Boss 技能映射

| Boss | 普攻 | 主技能 | 狂暴/终结技 |
|---|---|---|---|
| 程远志 | `huangjinyishi_skill1` 的近战段 | `zhangjiao_skill1` | `zhangjiao_skill2/3` + 召唤黄巾兵 |
| 华雄 | `pangde_skill1` | `pangde_skill2` | `pangde_skill4` 或 `xuhuang_skill2` |
| 吕布 | `lvbu_phyattack` | `lvbu_skill1` | `lvbu_skill2` + `role/lvbu/lvbu_3_skill2_01/02` |
| 夏侯惇 | `xiahouchun_skill1` | `role/xiahouchun_2/skill2` | `role/xiahouchun_2/skill3/5` |
| 曹仁 | `judunbing_phyattack` | `judunbing_skill1` | `daodunbing_skill1` + `dunqibing_skill1` 形成盾墙反击 |
| 许褚 | `xuchu_skill1` | `xuchu_skill2` | `xuchu_skill4` + `role/xuchu_2/skill4` |
| 甘宁 | `ganning_phyattack` | `ganning_skill1/2` | `ganning_skill4` |
| 夏侯渊 | `base_fly_arrow` | `xiahouyuan_skill1` | `xiahouyuan_skill2` + fire/thunder 箭矢变体 |
| 陆逊 | `luxun/luxun_phyattack` | `luxun/luxun_skill1/2` | `role/luxun_2/skill3` + 持续燃烧地面区 |
| 司马懿 | `simayi_phyattack` | `simayi_skill1` | `simayi_skill2` + `role/simayi_2/skill2`，二阶段可叠加黑紫全屏法阵 |

---

## 5. 格式、版本和网页接入风险

### 5.1 Spine 版本不兼容是最高风险

- D002 人物资源主要是 **Spine 3.6.52 二进制 `.skel`**。
- A872 绝大多数是 **Spine 2.1.27 JSON**，少量为 3.6.53 和 2.1.05。
- Spine 数据格式不是“新 runtime 自动兼容全部旧数据”。直接使用 Spine Web 4.x 加载 2.1 或 3.6 数据很可能失败。
- 不应在同一个加载器中混用 2.1 JSON、3.6 JSON 和 3.6 二进制。

建议方案：

1. 建立离线转换目录，不直接修改原素材。
2. 使用对应版本 Spine Editor 打开 `.spine` 工程并统一重新导出到项目选定版本。
3. 推荐统一到团队能合法使用、浏览器运行稳定的同一个 Spine Runtime 版本。
4. 如果无法重新导出，则人物层固定使用 3.6 runtime，A872 老特效优先转成序列帧/精灵表，避免在页面中同时维护 2.1 与 3.6 两套 runtime。

### 5.2 A872 2.1 JSON 风险

- 2.1 JSON 的 skin、slot、deform/ffd、事件和动画字段结构与后续版本存在差异。
- 部分包可能依赖旧版混合模式、旧版曲线或旧版网格行为。
- 不建议仅手工修改 JSON 中的 `skeleton.spine` 版本号，这不会完成真正的数据迁移。
- A872 每包附带 `.spine` 工程，是重新导出的最佳入口；但需要确认工程是否能在对应 Spine Editor 中完整打开。

### 5.3 D002 3.6 `.skel` 风险

- `.skel` 是二进制，版本匹配比 JSON 更严格。
- `.skel` 必须以二进制方式请求，不能被构建工具当文本处理。
- HTTP 服务应配置 `.skel`、`.atlas` 的正确静态文件响应和 CORS；建议 `.skel` 使用 `application/octet-stream`。
- 某些角色目录同时包含人物骨骼和独立 `effect_skill*.skel`，加载器应按 atlas 分包，不要错误共用纹理图集。

### 5.4 体积和性能风险

- 两个原始目录合计超过 **1.2 GB**，绝不能整包发布到网页。
- 单关只加载当前角色、当前小怪族群、当前 Boss 和当前技能特效。
- 首页角色选择只加载低分辨率立绘或索引预览，不提前加载完整 Spine。
- Spine 特效实例、箭矢、命中闪光必须使用对象池。
- 手机端建议：
  - 单个 atlas 页面控制在 1024–2048 像素范围。
  - 同屏高成本 Spine 特效控制在约 8–12 个。
  - 普通命中闪光优先改为精灵序列或 shader，不要每次创建完整 Skeleton。
  - 离屏角色暂停骨骼更新。
  - 低端机关闭部分 Bloom、扭曲、动态阴影和全屏粒子。
- 不要直接把 62,473 张人物 PNG 和 10,649 张特效 PNG 作为独立网络请求；应重新打 atlas 并按关卡拆包。

### 5.5 图集和渲染风险

- `.atlas` 内纹理文件名必须与部署后的实际文件名、大小写完全一致；Linux 服务器区分大小写。
- 老素材常使用 additive/screen 混合；Three.js、Pixi 或 spine-web 的 premultiplied alpha 配置错误会产生黑边、白边或颜色过曝。
- 如果把 Spine 渲染到 Three.js 场景，需要统一：
  - Y 轴方向。
  - 缩放单位。
  - 原点/脚底锚点。
  - Z 层级和透明排序。
  - `premultipliedAlpha` 与 blending。
- Spine 只负责视觉动画，攻击判定、受击盒、霸体、击退和地面碰撞应由游戏逻辑/Planck.js 独立管理，不能直接依赖骨骼包的图片边界。

### 5.6 动画名称不统一

已观察到的动作命名包含：

- `move`、`run`
- `gongji`、`skill0`、`skill1`、`skill2`
- `shouji`、`hit1`、`hit2`、`hit3`
- `dead`
- `win`

不同包可能带前缀、后缀或乱码字节。建议建立人物动画适配表：

```js
const animationMap = {
  idle: ['idle', 'stand', 'wait'],
  run: ['run', 'move'],
  attack: ['attack', 'gongji', 'skill0'],
  skill1: ['skill1'],
  skill2: ['skill2'],
  hurt: ['hurt', 'shouji', 'hit1'],
  death: ['death', 'dead']
};
```

加载后应先读取 skeleton 的实际 animation 列表，再按别名选择，禁止硬编码假设每包都有同名动作。

### 5.7 音效缺失

- 当前两个目录没有音频文件。
- 至少需要补充：轻武器挥舞、重武器挥舞、刀剑命中、枪刺、弓弦、箭命中、肉体受击、盾牌格挡、地面震击、火焰、雷击、Boss 咆哮、无双爆发、UI 点击。
- 音效触发应绑定攻击有效帧/Spine event，而不是绑定按键按下瞬间。
- WebAudio 首次播放需要用户手势解锁；移动端进入游戏时应显示“点击开始/开启声音”。

### 5.8 授权与发布风险

- 素材目录中未发现清晰的网页商用授权说明。
- 发布到公开网站、GitHub 或服务器之前，应确认人物、特效和 Spine Runtime 的许可范围。
- `.spine` 工程源文件不应部署到公开静态目录，也不应提交到公开 Git 仓库；项目只保留合法导出的运行时资源。
- API Key、服务器密码和第三方生成服务密钥不得写入前端、README、Git 历史或公开仓库。

---

## 6. 推荐落地目录（仅规划，尚未复制）

```text
public/assets/spine/
├── heroes/
│   ├── guanyu/
│   ├── zhangfei/
│   ├── zhaoyun/
│   └── huangzhong/
├── bosses/
│   ├── 01-chengyuanzhi/
│   ├── 02-huaxiong/
│   ├── 03-lvbu/
│   ├── 04-xiahoudun/
│   ├── 05-caoren/
│   ├── 06-xuchu/
│   ├── 07-ganning/
│   ├── 08-xiahouyuan/
│   ├── 09-luxun/
│   └── 10-simayi/
├── effects/
│   ├── common-hit/
│   ├── common-slash/
│   ├── projectiles/
│   └── character-skills/
└── manifest.json
```

`manifest.json` 应记录：原始来源路径、导出版本、atlas 页面、纹理尺寸、动画名、默认缩放、脚底锚点、技能事件帧和授权状态。

---

## 7. 当前结论

- D002 适合作为 **人物本体与 Boss 本体**的候选库，画风统一、动作较完整，但数字 ID 需要人工预览确认人物身份。
- A872 适合作为 **J/K/L、受击、飞行物和 Boss 大招特效库**，并且包含大量三国人物命名特效。
- 最大技术阻碍是 **A872 的 Spine 2.1.27 与 D002 的 Spine 3.6.52 不兼容**。
- 最稳妥的网页方案是：人物统一使用一个 Spine runtime；无法升级的老特效转为序列帧/精灵表；Planck.js 管物理和判定；Three.js 管背景、Bloom、粒子和镜头特效。
- 当前已完成素材映射、自动库存和 Sprite fallback 接入；原始 Spine 包仍需在授权确认与版本转换后按关卡选择性导入。
