# 《三国大乱斗》参考项目只读分析与独立实现建议

> 分析日期：2026-08-04  
> 参考目录：`/private/tmp/sanguo-refs-1785854496`  
> 分析范围：`ironhold`、`beat-fight`、`mario-magic`、`yongzhe`  
> 约束：仅做架构和玩法机制分析，不修改 `/Users/diyuan/Project/github-cr/play.sanguo/`，不直接复制许可证不明确或具有传染性许可证的代码/素材。

## 1. 结论摘要

1. **以 Operation Ironhold 的“系统完整度”和测试方式为第一参考，但不要照搬其单 HTML 架构。** 最值得吸收的是战斗导演、视线一致性、动态分辨率、对象池、HUD 降频和游戏内调试测试接口。
2. **以 Beat Fight 的数据驱动攻击、连招、波次和角色选择为玩法参考。** 该仓库没有许可证，不复制代码、Prefab、模型、音频或贴图，只独立实现抽象设计。
3. **以 MarioMagic 的输入缓存、可变跳跃、碰撞修正、移动平台与卷轴相机原则为平台动作参考。** 文档声明 CC BY-NC-SA，样例代码与图片授权边界不够清晰；只使用通用算法思想，不复制文字、代码或图片。
4. **以 YONGZHE 的角色状态机、Coyote Time、Jump Buffer、Hitbox/Hurtbox 分层为参考。** 项目是 GPLv3；若不希望主游戏整体进入 GPLv3，应采取 clean-room 独立实现。
5. 推荐主项目采用：**Three.js 负责 3D/伪 3D 背景和后期，Planck.js 负责固定步长物理与场景碰撞，Spine/精灵图负责角色，Tiled JSON 负责十关数据，Web Audio API 负责分层音乐和打击音效。**

---

## 2. 许可证检查与使用边界

| 项目 | 本地许可证结论 | 可以做 | 不应做 |
|---|---|---|---|
| Operation Ironhold | MIT，`ironhold/LICENSE` | 可研究、改写或复用；若复制实质代码必须保留 MIT 版权和许可声明 | 不应把 MIT 来源删除后伪装成完全原创；本项目仍建议只借鉴架构思想 |
| Beat Fight Game | 根目录无 LICENSE | 可研究公开可见的玩法思想、系统职责和非版权化机制 | 不复制 C#、Unity Prefab、模型、贴图、音频、动画控制器 |
| MarioMagic | README 声明文档为 CC BY-NC-SA；无标准 LICENSE 文件，样例/图片边界不清晰 | 可研究通用的平台游戏算法和工程原则 | 商业或非同许可项目中不要复制文档、代码样例、图片；不要逐行翻译实现 |
| YONGZHE | GPLv3，`yongzhe/LICENSE` | 可研究状态机、输入缓冲、Hitbox/Hurtbox 等通用设计 | 若复制/改写受保护代码，分发衍生作品可能触发 GPLv3 源码和同许可义务 |

### Clean-room 独立实现规则

- 参考报告只记录“系统职责、输入输出、约束和验收标准”，不记录可直接粘贴的原代码。
- 新实现使用新的模块名、数据结构、数值参数、状态命名和测试用例。
- 所有外部素材建立 `ASSET_PROVENANCE.md`：来源、生成模型、生成日期、提示词摘要、许可证、哈希。
- 对 MIT 项目如确实复制了实质代码，在 `THIRD_PARTY_NOTICES.md` 保留原版权和 MIT 文本。
- 对无许可证、GPLv3、CC BY-NC-SA 来源默认采取“只学思想，不复制表达”。

> 以上是工程合规建议，不替代正式法律意见。

---

## 3. 四个参考项目的可吸收要点

## 3.1 Operation Ironhold（重点）

### 最值得吸收

- **战斗导演限制同时攻击者数量。** 敌人都可以移动、找位和制造压力，但只有少量敌人获得攻击令牌，防止交叉火力造成不可读伤害。对应本游戏可限制同时近战出招者为 2 名、远程出手者为 1 名、重型蓄力者为 1 名。
- **攻击双方使用一致的视线/遮挡规则。** Ironhold 同时考虑射手端和玩家端的可见性，避免“敌人隔墙打到玩家、玩家却打不到敌人”。横版游戏也应保证投射物、远程弓箭、法术和 Boss 激光统一经过场景碰撞层判定。
- **敌人状态机和战斗职责分开。** 敌人可以处于巡逻、警觉、战斗、死亡状态；“能否攻击”则由导演额外授权。不要把 AI 状态和攻击许可混成一个布尔值。
- **高成本视觉系统始终有预算。** 使用动态分辨率、InstancedMesh、静态几何合并、粒子/弹壳/弹道/贴花对象池、裁剪小型阴影物体、降低 HUD 和小地图更新频率。
- **打击反馈是多通道叠加。** 武器后坐、闪光、点光、粒子、音效、命中提示、击杀提示和屏幕后处理共同构成“击中感”，而不是只播放一个动画。
- **开发测试接口直接挂在运行中的游戏对象上。** 测试工具可以摆放玩家、设置武器、制造开放射击通道、检查命中一致性、冲撞所有碰撞体、尝试逃离地图、观察敌人卡死情况。这一方法非常适合浏览器游戏自动化。

### 不建议照搬

- 单个 6500 行 `index.html` 适合展示型 FPS，不适合十关、四角色、三十种小怪、十个 Boss、Spine、Tiled 和移动端控制的长期项目。
- Ironhold 的碰撞和寻路主要是为单场景 FPS 定制；本项目应使用 Planck.js 固定步长物理、Tiled 碰撞层和横版专用角色控制器。
- 运行时生成所有纹理/音效是其项目特色，不适合已经明确使用生成图片、Spine、音乐文件和大量关卡资源的本项目。

### 证据索引

- 战斗导演：`/private/tmp/sanguo-refs-1785854496/ironhold/index.html:5300`
- 敌人状态机：`/private/tmp/sanguo-refs-1785854496/ironhold/index.html:5405`
- 射击/命中：`/private/tmp/sanguo-refs-1785854496/ironhold/index.html:4864`
- LOS 与枪口遮挡：`/private/tmp/sanguo-refs-1785854496/ironhold/index.html:5110`
- 动态分辨率：`/private/tmp/sanguo-refs-1785854496/ironhold/index.html:805`
- 对象池/粒子：`/private/tmp/sanguo-refs-1785854496/ironhold/index.html:3272`
- 主循环：`/private/tmp/sanguo-refs-1785854496/ironhold/index.html:6411`
- 命中一致性测试：`/private/tmp/sanguo-refs-1785854496/ironhold/tools/test-harness.js:45`
- 碰撞冲撞测试：`/private/tmp/sanguo-refs-1785854496/ironhold/tools/test-harness.js:353`
- 越界测试：`/private/tmp/sanguo-refs-1785854496/ironhold/tools/test-harness.js:391`

## 3.2 Beat Fight Game

### 可吸收思想

- 攻击数据和角色逻辑分离：攻击定义包含伤害、攻击类型、击倒、慢动作、碰撞尺寸/距离/高度、命中音效等。
- 普攻与技能按“前摇—生效—后摇”处理，并通过可攻击状态白名单阻止非法切招。
- 连招是否继续可由“是否命中”“是否在取消窗口输入”共同决定。
- 波次系统由区域触发器启动，适合横版清关中的锁屏战斗房间。
- 角色选择先存角色配置，再进入关卡；适合关羽、张飞、赵云、黄忠四人。
- 相机震动、短暂慢动作、命中音效独立成反馈模块。

### 需要改进后再采用

- 不要在每次播放空间音效时频繁创建临时对象；Web Audio 节点、粒子和飘字应池化或受并发数限制。
- 不要让动画事件成为伤害判定的唯一真相；应由攻击时间轴驱动动画、Hitbox、SFX 和 VFX，动画只做表现层。
- 不要依赖宽泛的物理 Overlap 作为全部近战命中；使用明确 Hitbox/Hurtbox 层、攻击实例 ID 和每目标命中集合。

### 证据索引

- 连招/攻击配置：`/private/tmp/sanguo-refs-1785854496/beat-fight/Assets/BeatEmUp_GameTemplate3D/Scripts/Player/PlayerCombat.cs:16`
- DamageObject：`/private/tmp/sanguo-refs-1785854496/beat-fight/Assets/BeatEmUp_GameTemplate3D/Scripts/Health/DamageObject.cs:1`
- 波次系统：`/private/tmp/sanguo-refs-1785854496/beat-fight/Assets/BeatEmUp_GameTemplate3D/Scripts/Enemy/EnemyWaveSystem.cs:1`
- 相机震动：`/private/tmp/sanguo-refs-1785854496/beat-fight/Assets/BeatEmUp_GameTemplate3D/Scripts/Camera/CamShake.cs:1`
- 慢动作：`/private/tmp/sanguo-refs-1785854496/beat-fight/Assets/BeatEmUp_GameTemplate3D/Scripts/Camera/CamSlowMotionDelay.cs:1`
- 角色选择：`/private/tmp/sanguo-refs-1785854496/beat-fight/Assets/BeatEmUp_GameTemplate3D/Scripts/UI/CharSelection.cs:1`

## 3.3 MarioMagic

### 可吸收思想

- 每个逻辑帧开始时生成统一 Input Snapshot，不在角色代码中随时查询 DOM 键盘状态。
- 同时保存 `held / pressed / released`，实现跳跃缓冲、连招缓冲和按键上升沿检测。
- 使用可变跳跃：按住跳跃延长上升，提前松开则截短向上速度。
- 运动处理坚持“预测移动—检测碰撞—分轴修正—更新接地状态”。
- 移动平台坚持“检测站立关系—移动平台—按平台位移调整乘员”的顺序。
- 卷轴相机使用软跟随和安全窗口，不把角色永远锁死在屏幕正中心。

### 证据索引

- 游戏循环：`/private/tmp/sanguo-refs-1785854496/mario-magic/gameloop.md:1`
- 输入缓存：`/private/tmp/sanguo-refs-1785854496/mario-magic/keyfilter.md:3`
- 可变跳跃：`/private/tmp/sanguo-refs-1785854496/mario-magic/jump.md:47`
- 碰撞接触与修正：`/private/tmp/sanguo-refs-1785854496/mario-magic/colldet.md:37`
- 移动平台：`/private/tmp/sanguo-refs-1785854496/mario-magic/platform.md:74`
- 卷轴相机：`/private/tmp/sanguo-refs-1785854496/mario-magic/scroll.md:53`

## 3.4 YONGZHE

### 可吸收思想

- 通用 StateMachine 只负责请求下一个状态、执行转换、记录状态持续时间，具体行为由角色拥有者实现。
- 将 Coyote Timer、Jump Request Timer、Attack Request Timer、无敌帧 Timer 独立出来，避免散落的时间判断。
- Hitbox 与 Hurtbox 使用不同碰撞层，通过事件/信号传递命中，而不是攻击者直接寻找并修改敌人血量。
- 动画时间轴在有效帧打开 Hitbox，其余时间关闭，适合 Spine 事件驱动的攻击窗口。
- 状态覆盖跑、跳、落地、墙滑、墙跳、三段攻击、受伤、死亡和滑铲，说明角色动作应由显式状态而非多个互相冲突的布尔值控制。

### 需要修正的风险

- 状态机的 `while true` 连续转换必须设置单帧最大转换次数，例如 8 次，否则错误状态规则会导致死循环。
- Damage 不能只有 amount/source；应包含硬直、韧性伤害、击退、方向、元素、攻击实例、无敌组、命中特效和命中音效。
- Hitbox 事件必须防止同一攻击帧重复命中同一目标。

### 证据索引

- 状态机：`/private/tmp/sanguo-refs-1785854496/yongzhe/classes/StateMachine.gd:1`
- Hitbox/Hurtbox：`/private/tmp/sanguo-refs-1785854496/yongzhe/classes/Hitbox.gd:1`
- 角色状态与输入缓冲：`/private/tmp/sanguo-refs-1785854496/yongzhe/player.gd:4`
- Coyote/Jump Request：`/private/tmp/sanguo-refs-1785854496/yongzhe/player.gd:54`
- J 与 Space 输入映射：`/private/tmp/sanguo-refs-1785854496/yongzhe/project.godot:44`

---

## 4. 推荐的独立实现架构

```text
src/
├── app/
│   ├── GameApp.js              # 启动、暂停、场景切换、资源加载
│   ├── GameLoop.js             # 固定逻辑步长 + 渲染插值
│   └── AppStateMachine.js      # 全局流程状态
├── input/
│   ├── InputManager.js         # 键盘/触摸/手柄统一快照
│   ├── KeyboardAdapter.js
│   └── TouchControls.js
├── gameplay/
│   ├── actors/
│   │   ├── Actor.js
│   │   ├── PlayerController.js
│   │   ├── EnemyController.js
│   │   └── BossController.js
│   ├── combat/
│   │   ├── AttackSpec.js
│   │   ├── CombatSystem.js
│   │   ├── HitboxSystem.js
│   │   ├── DamageResolver.js
│   │   ├── ComboSystem.js
│   │   └── CombatDirector.js
│   ├── movement/
│   │   ├── CharacterMotor.js
│   │   ├── GroundProbe.js
│   │   └── MovingPlatformSystem.js
│   └── progression/
│       ├── LevelFlow.js
│       └── StoryDirector.js
├── physics/
│   ├── PhysicsWorld.js         # Planck.js 固定步长
│   ├── CollisionLayers.js
│   └── ContactRouter.js
├── render/
│   ├── Renderer3D.js           # Three.js 背景、灯光、后期
│   ├── SpriteRenderer.js       # 2D 平面/精灵层
│   ├── SpineRenderer.js
│   ├── CameraRig.js
│   └── FXManager.js
├── audio/
│   ├── AudioManager.js
│   ├── MusicDirector.js
│   └── SfxPool.js
├── level/
│   ├── TiledLoader.js
│   ├── LevelRegistry.js
│   └── SpawnSystem.js
├── data/
│   ├── characters.js
│   ├── attacks.js
│   ├── enemies.js
│   ├── bosses.js
│   └── levels.js
└── debug/
    ├── DebugBridge.js
    ├── ReplayRecorder.js
    └── PerfHud.js
```

### 渲染和物理解耦

- 物理世界使用米制单位，推荐 `1 米 = 100 像素` 的显示换算。
- Planck.js 以固定 `1/60s` 步进；渲染使用 `requestAnimationFrame`，通过 accumulator 执行 0～N 次逻辑更新。
- 每帧限制最多 5 个物理补帧；超过则丢弃积压，避免页面恢复后“追帧爆炸”。
- 角色建议采用**受约束的运动控制器**：Planck 提供场景接触、平台、机关、投射物和破坏物；角色水平速度、跳跃、斜坡和落地由 CharacterMotor 控制，避免完全动态刚体带来的滑动和弹跳失控。
- Three.js 用 OrthographicCamera 渲染 2D 角色平面，同时以 3D 空间管理前景、中景、远景和体积粒子。

---

## 5. 核心循环与状态机

## 5.1 核心循环

```text
采集输入快照
→ 固定步长角色意图
→ 状态机转换
→ AI 感知与战斗导演分配令牌
→ 移动/物理步进
→ Hitbox/Hurtbox 接触收集
→ DamageResolver 统一结算
→ 事件队列触发动画/VFX/SFX/UI
→ 相机与渲染插值
→ 后期合成
```

### 必须遵守

- 输入只在帧首采集一次。
- 伤害只由 DamageResolver 改写生命、韧性和无敌状态。
- 物理接触回调只收集事件，不在回调中销毁刚体或切关。
- 渲染层不得直接修改战斗状态。
- 暂停时停止物理和战斗逻辑，但 UI、菜单动画和音频淡出可以继续。

## 5.2 三层状态机

### AppState

`BOOT → LOADING → TITLE → CHARACTER_SELECT → STORY_INTRO → PLAYING ↔ PAUSED → LEVEL_CLEAR / GAME_OVER → ENDING`

### LevelState

`INTRO → TRAVERSE → LOCKED_ARENA → WAVE_BREAK → MINI_BOSS/BOSS → CLEAR`

### ActorState

`SPAWN / IDLE / RUN / JUMP_START / AIR / LAND / ATTACK_STARTUP / ATTACK_ACTIVE / ATTACK_RECOVERY / SKILL / GUARD / HURT / KNOCKBACK / KNOCKDOWN / GETUP / DEAD`

### 状态转换原则

- 使用状态表描述可转换目标，不散落 `if (attacking && !hurt && ...)`。
- 每次转换执行 `exit → set state → enter`。
- 单逻辑帧最多执行 8 次无时间消耗转换。
- 普攻连段仅在取消窗口接受缓存输入。
- 受伤、死亡、关卡切换拥有高于普通动作的转换优先级。

---

## 6. 战斗导演

## 6.1 目标

三十种小怪不应同时围殴。导演负责制造“看起来很激烈，但玩家能读懂”的战斗。

## 6.2 令牌模型

| 令牌 | 默认上限 | 说明 |
|---|---:|---|
| `meleeAttack` | 2 | 同时真正进入近战攻击前摇的敌人 |
| `rangedAttack` | 1 | 同时发射箭/法术的敌人 |
| `heavyAttack` | 1 | 重型蓄力或破防攻击 |
| `flank` | 1 | 绕到玩家背后，但背后攻击必须有明显预警 |
| `bossAssist` | 2 | Boss 战中允许小怪执行的干扰行为 |

## 6.3 敌人职责

- `ATTACKER`：持有令牌，靠近并执行攻击。
- `PRESSURER`：在攻击距离外游走、假动作、逼迫移动。
- `FLANKER`：换边但不瞬移，不从屏幕外立即攻击。
- `RANGED`：寻找无遮挡射线，友军挡线时换位。
- `RECOVERING`：被击退、倒地或刚攻击完，暂不申请令牌。

## 6.4 公平性规则

- 屏幕外敌人不得直接进入攻击有效帧。
- 新出生敌人至少有 0.6～1.0 秒可读入场时间。
- 同侧连续攻击次数受限，避免永久夹击。
- 玩家受重击后的短时间降低导演攻击预算。
- 导演选择攻击者时考虑距离、可见性、上次攻击时间、当前侧面和攻击类型重复度。
- Boss 技能与小怪远程技能共享危险预算，防止不可躲避叠加。

---

## 7. 平台跳跃与移动手感

### 推荐基础参数

| 参数 | 初始建议 | 用途 |
|---|---:|---|
| Fixed step | 16.667ms | 稳定物理与回放 |
| Coyote Time | 100ms | 离开边缘后仍可跳 |
| Jump Buffer | 120ms | 落地前按空格也能跳 |
| 最短跳跃 | 松键时截断上升速度至 45%～55% | 可变跳高 |
| 顶点重力 | 正常重力的 65%～80% | 增加腾空可控性 |
| 下落重力 | 正常重力的 130%～160% | 落地更有力量 |
| 落地锁定 | 40～80ms | 轻落地不打断，重落地体现重量 |

### 处理顺序

1. 读取输入快照。
2. 计算目标水平速度和加速度。
3. 处理跳跃缓冲、Coyote Time、单向平台。
4. 执行物理步进。
5. 根据接触法线更新 `grounded / wall / ceiling`。
6. 处理移动平台位移继承。
7. 将物理位置插值到 Spine/精灵渲染对象。

### 相机

- 使用横向安全窗口；角色在窗口内移动时相机不立即跟随。
- 速度越快，前方 Look Ahead 越大。
- 锁屏战斗时相机边界收紧；Boss 大招可临时放宽纵向视野。
- 相机震动使用频率分层：轻击高频低幅，重击低频高幅；UI 层默认不震。

---

## 8. Hitbox / Hurtbox / Damage 设计

## 8.1 数据结构

```js
AttackSpec = {
  id,
  startupMs,
  activeWindows,
  recoveryMs,
  damage,
  poiseDamage,
  hitStunMs,
  hitStopMs,
  knockback: { x, y },
  launch,
  guardDamage,
  hitLimitPerTarget,
  invulnerabilityGroup,
  hitboxSet,
  sfxId,
  vfxId,
  cameraProfile,
  cancelWindows,
  tags
}
```

## 8.2 碰撞层

- `WORLD_SOLID`
- `ONE_WAY_PLATFORM`
- `PLAYER_BODY`
- `ENEMY_BODY`
- `PLAYER_HURTBOX`
- `ENEMY_HURTBOX`
- `PLAYER_HITBOX`
- `ENEMY_HITBOX`
- `PROJECTILE`
- `TRIGGER`

## 8.3 命中结算流水线

```text
Hitbox 接触 Hurtbox
→ 校验阵营/无敌组/攻击实例
→ 校验该目标是否已被当前攻击命中
→ 计算格挡、护甲、韧性、暴击和属性
→ 写入 PendingHit 队列
→ 按优先级统一结算
→ 发出 HitConfirmed / Guarded / Killed 事件
→ 驱动 hit-stop、受击动画、击退、相机、VFX、SFX、UI
```

### 防重复命中

每次出招生成唯一 `attackInstanceId`，保存 `hitTargets` 集合；多段技能使用明确的 `hitGroup` 和 `rehitDelayMs`，不依赖碰撞回调次数。

---

## 9. 打击反馈标准

| 层级 | 轻击 | 重击/技能 | Boss 破防 |
|---|---|---|---|
| Hit-stop | 35～50ms | 60～90ms | 100～140ms |
| 相机震动 | 小幅高频 | 中幅混合频率 | 低频大幅 + 快速衰减 |
| 角色顿帧 | 攻击者与受击者 | 攻击者、受击者、局部特效 | 全局但 UI 不冻结 |
| VFX | 火花/斩痕 | 拖尾、冲击环、粒子爆发 | 屏幕空间冲击波/色差 |
| 音效 | 兵器主体 + 肉体/护甲材质层 | 低频冲击 + 技能层 | 低频重击 + 环境尾响 |
| UI | 小伤害数 | 放大、颜色变化 | 破防提示、Boss 韧性反馈 |

### 反馈预算

- 同屏普通命中特效最多 12 组，超出时合并或降级。
- 同一帧相机震动按最大强度和向量混合，不简单累加。
- Hit-stop 不暂停音乐时钟；只冻结 gameplay time scale。
- 高亮 Bloom 仅作用于技能核心和关键斩痕，避免全屏发白。

---

## 10. 音频架构

### 音乐

- `explore`、`combat`、`boss` 三种音乐状态，按小节边界交叉淡化。
- 每关可以共用三国风动机，但更换打击乐、笛/唢呐/琵琶/战鼓层，减少十首音乐全部常驻内存。
- Boss 进入二阶段时增加战鼓和低音层，不必切换整首文件。

### SFX 分层

一次近战命中建议由以下声音组合：

1. 武器挥动 Whoosh。
2. 兵器主体声（金属/木柄/弓弦）。
3. 命中材质声（肉体、甲胄、盾牌、岩石）。
4. 低频冲击层。
5. 角色喊声，带冷却和随机变体。
6. 技能专属尾响或空间混响。

### Web Audio 要点

- 首次点击“开始游戏”时解锁 `AudioContext`。
- 使用 `GainNode` 总线：`master / music / sfx / voice / ui`。
- 重击触发音乐 Ducking 80～160ms，但不要每次轻击都压低音乐。
- 每类声音设置最大并发、最小重复间隔和 3～6 个音高/样本变体。
- 音频节点和 Panner 复用；移动端限制空间音效并发。
- 资源格式优先 Opus/WebM，提供 AAC/MP3 回退。

---

## 11. 性能策略

### 目标预算

| 档位 | 目标 | 渲染比例 | Spine 活跃数 | 普通粒子上限 |
|---|---|---:|---:|---:|
| PC 高 | 60 FPS | 1.0 | 16～20 | 1200 |
| PC 低 | 60/45 FPS | 0.75～0.9 | 12～16 | 700 |
| 移动端 | 30/45 FPS | 0.6～0.8 | 8～12 | 350 |

### 实施清单

- Three.js 动态分辨率采用离散档位，连续低帧才降档，连续稳定才升档，并设置 2～4 秒迟滞。
- 后期效果分级：高档 Bloom + 色调映射 + 轻色差；移动端关闭景深、减少 Bloom 模糊次数。
- 静态场景按材质合并，重复灯笼、兵器架、树木、旗帜使用 InstancedMesh。
- Spine：屏幕外停止更新；远距离降低更新时间；小怪可用烘焙 Sprite Sheet 替代全量骨骼。
- 三十种小怪按关卡资源包加载，每关只加载 5～8 种，不一次性加载全部。
- 十关背景分层流式加载，过关后释放上一关纹理、几何、骨骼和音频引用。
- 粒子、伤害数字、投射物、命中框调试图形、音频节点全部池化。
- HUD 10Hz 更新，Boss 血条/连击数发生变化时事件驱动更新。
- 物理世界只保留附近激活敌人；远处敌人使用轻量逻辑，不创建复杂动态刚体。
- 每帧记录 CPU update、physics、Spine、render、post 和 draw-call 指标，动态策略不能只看总 FPS。

---

## 12. 测试与验收

## 12.1 调试桥

提供只在开发模式启用的：

```js
window.__GAME_DEBUG__ = {
  setSeed(),
  loadLevel(),
  selectHero(),
  teleport(),
  spawnEnemy(),
  startWave(),
  forceAttack(),
  getState(),
  getMetrics(),
  recordReplay(),
  playReplay()
};
```

## 12.2 自动化测试

### 平台动作

- 空格在起跳前 120ms、落地前 120ms、离开边缘后 100ms 的行为符合设计。
- 松开空格后短跳高度显著低于长按。
- 以不同帧率模拟时，水平位移和跳跃高度误差小于 2%。
- 从四侧冲撞每个碰撞体，不得穿透。
- 站在移动平台上 30 秒不得抖落或逐帧下沉。
- 以 32 个方向尝试离开关卡边界，不得越界。

### 战斗

- 攻击有效帧外不造成伤害。
- 同一攻击实例对单目标命中次数不超过配置。
- 屏幕显示 Hitbox 与实际结算一致，不出现“明显命中但未结算”。
- 格挡、无敌帧、击倒、Boss 霸体和死亡优先级正确。
- 同时攻击者不超过导演令牌预算。
- 屏幕外、新出生、被遮挡的敌人不得立即造成伤害。

### AI

- 每类敌人运行 60 秒，记录卡住时长、越界、穿墙和状态死锁。
- 寻路失败超过阈值后必须重新规划或回到合法点，不直接穿墙传送到玩家身边。
- 远程攻击线被场景或友军阻挡时不得造成伤害。

### 性能

- 每关分别测试低端移动、主流移动、桌面 1080p。
- 记录 P50/P95/P99 帧时间，而不仅是平均 FPS。
- 连续释放四名角色最复杂技能并生成最大波次，内存不得持续增长。
- 往返切换十关后，纹理、AudioBuffer、Spine Skeleton 和 Planck Body 数量回到稳定区间。

### 视觉回归

- 角色选择、关卡介绍、普通战斗、Boss 二阶段、暂停、胜利、失败分别保存基准截图。
- 使用固定随机种子和回放输入生成截图，避免随机粒子导致无意义差异。

---

## 13. 可直接纳入 ITERATIONS.md 的十轮迭代

## Iteration 1 — 可玩闭环

- 完成 BOOT、角色选择、关卡介绍、PLAYING、LEVEL_CLEAR、GAME_OVER。
- 关羽一名角色、一种小怪、一个测试关卡。
- WASD、Space、J/K/L 和移动端虚拟按键统一输入。
- 验收：可开始、战斗、死亡、重开、过关。

## Iteration 2 — 平台手感

- 固定步长、Coyote Time、Jump Buffer、可变跳高、单向平台、移动平台。
- 相机安全窗口和前视。
- 验收：30/60/120Hz 行为接近，无穿墙和卡边。

## Iteration 3 — 战斗骨架

- AttackSpec、Hitbox/Hurtbox、DamageResolver、三段普攻、击退、受伤、倒地。
- 建立命中实例去重和调试显示。
- 验收：有效帧、取消窗口、同目标命中次数完全可测。

## Iteration 4 — 打击反馈

- Hit-stop、相机震动、闪白、斩痕、粒子、伤害数字、材质命中音。
- 建立反馈预算和对象池。
- 验收：轻击、重击、技能、破防有明确层级差异。

## Iteration 5 — 四角色

- 关羽、张飞、赵云、黄忠数据化角色配置和专属技能。
- 技能资源预载与按角色卸载。
- 验收：四角色移动一致但攻击节奏、范围、技能用途不同。

## Iteration 6 — 战斗导演与怪物扩充

- 实现攻击令牌、职责分配、可见性、公平出生和远程遮挡。
- 接入至少 15 种小怪，按近战/远程/重型/控制/机动分类。
- 验收：同屏敌人多但攻击可读，无围殴失控。

## Iteration 7 — 十关数据驱动

- Tiled 关卡加载、锁屏波次、故事介绍、检查点、关卡结算。
- 十关各自 Boss 配置和故事节点。
- 验收：不改引擎代码即可调整出生点、波次和关卡边界。

## Iteration 8 — 视觉与音频导演

- Three.js 3D 背景、视差层、Bloom、技能光照和天气。
- 探索/战斗/Boss 音乐状态与分层音效。
- 验收：移动端自动降级，音频首击延迟和并发受控。

## Iteration 9 — 性能与稳定性

- 动态分辨率、Spine LOD、静态合批、Instancing、资源流式释放。
- 完成碰撞、越界、卡死、命中一致性、内存测试。
- 验收：目标设备达到帧时间预算，无持续内存增长。

## Iteration 10 — 终局打磨

- 十关 Boss 差异化、难度曲线、辅助选项、移动端按键布局、存档。
- 全流程回放、视觉回归、音量平衡、关卡故事节奏和新手教学。
- 验收：四角色均可通关，全部十关无阻断 Bug，README 与第三方声明完整。

---

## 14. README 中建议新增的简版“技术设计”段落

```markdown
## 技术设计

《三国大乱斗》采用 Three.js + Planck.js + Spine + Tiled 的混合架构：Three.js 负责正交角色层、3D 背景、粒子和后期处理；Planck.js 以固定 60Hz 步长负责场景碰撞、平台、机关和投射物；Spine/精灵图负责角色动画；Tiled JSON 驱动十关地图、波次和故事触发器。

核心循环按“输入快照 → 状态机 → AI/战斗导演 → 固定步长物理 → Hitbox/Hurtbox → 统一伤害结算 → 反馈事件 → 渲染插值”执行。战斗导演限制同时攻击者数量，使大量敌人保持压迫感但不会形成不可读围殴。所有攻击均使用数据化 AttackSpec，统一描述前摇、有效帧、后摇、伤害、韧性、击退、Hit-stop、特效、音效和取消窗口。

PC 使用 WASD 移动、Space 跳跃、J/K/L 执行不同操作；触摸设备显示虚拟摇杆和动作键。游戏提供动态分辨率、Spine LOD、对象池、静态合批和分层资源加载，以兼顾桌面与移动端性能。
```

---

## 15. 实施优先级

### P0：开始写代码前必须确定

- 主项目许可证和第三方声明策略。
- `GameLoop`、`InputManager`、三层状态机、AttackSpec、碰撞层。
- 十关和三十种小怪的数据 Schema。
- 角色/Spine/图片/音乐/音效的来源台账。

### P1：第一个可玩版本必须具备

- 固定步长、跳跃缓冲、Coyote Time。
- Hitbox/Hurtbox、DamageResolver、命中去重。
- 战斗导演攻击令牌。
- SFX 总线、Hit-stop、相机震动、对象池。
- Debug Bridge 和最小自动测试。

### P2：内容扩充前完成

- Tiled 数据驱动关卡。
- 动态分辨率、Spine LOD、资源分包和释放。
- 回放与固定种子测试。
- 十关性能基线和视觉回归截图。
