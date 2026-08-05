# 素材生成与来源清单

生成日期：2026-08-04

> 所有 API 密钥仅在本地进程环境中使用，不写入仓库、构建产物或部署目录。AI 生成素材在发布前仍需进行人工视觉检查。

| 分类 | 文件 | 模型 / 来源 | 状态与用途 |
|---|---|---|---|
| 十关复杂背景 | `public/assets/backgrounds/level-01.webp` … `level-10.webp` | `gpt-image-2`，复杂国风横版场景提示词 | 虎牢关样片已成功；其余按关卡故事重新生成并覆盖旧占位图 |
| 四武将动作图集 | `public/assets/characters/*/atlas.webp` | MiniMax `image-01` | 3×3 动作布局，关羽/张飞/赵云/黄忠，运行时自适应色键抠图 |
| 30 种敌军图集 | `public/assets/monsters/group-*` | MiniMax `image-01` | 三组 4×3 图集，数据层映射 30 种敌军 |
| 10 Boss 动作图集 | `public/assets/bosses/animated/*/atlas.webp` | MiniMax `image-01` + `tools/repack-boss-atlases.py` | 每名 Boss 独立 4×3 多帧图集；离线绿幕重排消除跨格武器、重复姿势和生成模型偶发 4 行/5 列排版 |
| Boss 静态回退 | `public/assets/bosses/group-*` | MiniMax `image-01` | 两组 5×1 旧图集，仅在独立动作图集加载失败时回退 |
| 军令卷轴 UI | `public/assets/ui/war-scroll.webp` | MiniMax `image-01` | 菜单、角色选择和剧情面板纹理 |
| 背景音乐 | `public/assets/audio/sanguo-battle-theme.mp3` | MiniMax `music-2.6` | 纯音乐国风战斗 BGM；战鼓、琵琶、唢呐点缀 |
| Boss 压力层 | `public/assets/audio/sanguo-boss-pressure.mp3` | 用户提供的武器打斗音频包 + `tools/import-combat-audio.py` | 40.5 秒自适应战鼓/金属/剑气层，仅在 Boss 存活时淡入并与主 BGM 同步循环 |
| 战斗短音效 | `public/assets/audio/combat/*.mp3` | 用户提供的“1700款音频素材武器刀剑棍棒…”本地素材包 | 精选 15 个刀剑、枪棍、弓弩、肉体、护甲、重兵器与技能采样；裁切静音、压缩、限幅、单声道 44.1kHz/96kbps；WebAudio 随机音高和防连发复用 |
| 程序化音效层 | `src/audio.js` WebAudio | 项目代码独立生成 | 脚步、跳跃、UI、蓄力与采样叠加的低频/噪声层；命中时自动压低 BGM，强化打击瞬态 |
| 角色/Boss Spine 候选 | 本地 D002 素材库 | Spine 3.6.52 为主 | 仅做只读库存和路径映射；未把约 868 MiB 整库发布 |
| 技能 Spine 候选 | 本地 A872 素材库 | Spine 2.1.27 为主，少量 3.6.53 | 已映射 J/K/L/受击/Boss；因运行时版本与授权风险，当前正式运行使用 GPU 粒子/图集 fallback |

## 生成通道记录

- `gpt-image-2`：可用，已成功返回 1536×1024 复杂背景。
- MiniMax `image-01`：可用，已生成武将、敌军、Boss 和 UI 图集。
- MiniMax `music-2.6`：用于生成纯音乐战斗主题。
- `Qwen/Qwen-image`：2026-08-04 调用返回 `model_not_found` / 502，未虚构产物；保留 `tools/generate-assets.mjs qwen-ui` 作为通道恢复后的可选补充。
- `deepseek-ai/DeepSeek-OCR`：用于联系表文字识别试验；当前兼容接口返回内容不足，正式角色 ID 以文件库存、预览图人工复核和 Spine 包动画名为准。

## 可复现生成

```bash
export DOUZIMI_API_KEY='在本机安全注入'
export MINIMAX_API_KEY='在本机安全注入'

node tools/generate-assets.mjs gpt-backgrounds --ids 1,2,3
node tools/generate-assets.mjs minimax-atlases --ids guanyu,zhangfei,zhaoyun,huangzhong
node tools/generate-assets.mjs minimax-boss-animation
npm run assets:boss:repack
node tools/generate-assets.mjs minimax-music
SANGUO_AUDIO_PACK='/absolute/path/to/1700款音频素材...' npm run assets:audio:import
```

Boss 生成后需执行本地重排与视觉 QA；原始生成图备份在 Git 忽略的 `.gen/raw-boss-atlases/`。生成器只读取环境变量，响应摘要写入被 Git 忽略的 `.gen/`。不要把长期密钥放到前端 JavaScript、README、提交历史或服务器静态目录。


## 本地音效包说明

- 原始 1700 款素材包不进入仓库，只提交游戏实际使用的 15 个压缩短采样和一条重构压力层。
- 素材包目录未附带可识别的授权说明文件；上线使用范围与二次分发权应由素材持有人继续确认。本清单不对第三方授权状态作推定。
- `tools/import-combat-audio.py` 固化了精选文件映射和转码参数，便于在拥有原始包的机器上复现。
