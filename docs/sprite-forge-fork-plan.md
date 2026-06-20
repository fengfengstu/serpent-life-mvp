# Sprite Forge 分叉版计划

## 为什么做分叉

当前 `main` 已经是可玩的 visual-remaster 版本，但它的资产仍以“单张透明 PNG + 程序动画”为主。`agent-sprite-forge` 更适合做真正的游戏资产流水线：生成 sheet，去背、切帧、对齐、质检，再让引擎播放帧动画。

分叉版目标不是立刻替换所有内容，而是验证这条管线能否解决当前最大问题：

- 敌人和 Boss 不再像静态贴图。
- 技能/命中反馈可以分层播放。
- 资产进入游戏前有 metadata 和 QA，而不是凭肉眼塞图。

## 对 agent-sprite-forge 的判断

适合使用：

- 2D 精灵、敌人、Boss、投射物、impact FX、拾取物。
- 洋红背景去背。
- sheet 切帧、对齐、透明 PNG/GIF 导出。
- 让 Codex 自己规划 asset type、action、sheet grid、frame count。

不直接照搬：

- Godot/Unity 输出暂不需要。
- 地图分层只借思想，不在 Phaser 版本里重做地图编辑器。
- 不把所有动作塞进一个 atlas；先做少量高价值 sheet。

## 本 fork 的最小验证

### 资产

1. 普通敌人 idle/combat sheet：`2x2`。
2. Boss idle/aura sheet：`3x3`。
3. Impact 命中特效 sheet：`2x2`。

### 代码

- Phaser 加载 processed transparent frames。
- 敌人创建时随机播放 idle frames。
- Boss 出场时播放 aura/idle frames。
- 命中/死亡时播放 impact frames。

### 验收

- 画面不再是静态贴图漂移。
- sheet frames 没有明显绿/洋红底色残留。
- 小屏 HUD、重开、升级仍通过现有 QA。
- 如果管线稳定，再扩到蛇头 idle、技能 icon、三类敌人独立 sheet。

## 工作流

1. 用 `generate2dsprite` 的 prompt 规则写图像生成 prompt。
2. 使用内置 image generation 生成洋红背景 sheet。
3. 复制 raw 到 `public/assets/generated/sprite-forge/raw/`。
4. 用 `generate2dsprite.py process` 处理出透明 sheet 和 frames。
5. 将通过 QA 的 frames 复制到 `public/assets/generated/sprite-forge/processed/`。
6. Phaser 读取 frames 并播放。
