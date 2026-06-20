# V3 资产生产记录

## 版本

`v3-phaser-art-pass`

## 主角蛇模块

原始生成图：

`public/assets/generated/sprite-forge/raw/player-modules-2x2-v3-raw.png`

处理输出：

`public/assets/generated/sprite-forge/processed/player-modules-v3/`

运行时资产：

| 纹理 | 文件 | 用途 |
| --- | --- | --- |
| snake-head-v3 | player-module-1.png | 蛇头 |
| snake-body-v3 | player-module-2.png | 普通身体段 |
| snake-memory-v3 | player-module-3.png | 记忆身体段 |
| snake-tail-v3 | player-module-4.png | 蛇尾 |

质检结果：

- `edge_touch_frames`: `[]`
- 每帧输出尺寸：128x128
- 背景已由 Sprite Forge 处理为透明。
- 主体轮廓清晰，移动端小屏可读。

## 竞技场底图

原始生成图：

`public/assets/generated/arena-v3/archive-arena-floor-v3.png`

标准化运行时图：

`public/assets/generated/arena-v3/archive-arena-floor-v3-1024.png`

用途：

- 替换 V2 的程序网格底板。
- 作为深青黑 + 暗金档案风竞技场地面。
- 不包含敌人、奖励、UI 或剧情元素，避免干扰 gameplay 层。

## 接入原则

1. 保留 Phaser 现有玩法算法。
2. 优先替换视觉层，不重写碰撞和成长逻辑。
3. 仍然保持玩家/敌人/奖励/弹道颜色语义。
4. V3 发布到独立版本目录，不覆盖 V1/V2。
