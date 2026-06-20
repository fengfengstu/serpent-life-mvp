# V4 技能与粒子表现修正

## 版本

`v4-skill-vfx-pass`

## 背景

V3 更换了主角蛇和竞技场背景，但没有解决技能表现问题。火环、冰轨、护盾、闪电等技能缺少稳定、明确、移动端可读的视觉身份，导致玩家看不出 Build 成长。

## 本版目标

V4 先不继续换主角或背景，改为技能与粒子表现优先：

1. 火环必须有真正的火焰环视觉。
2. 冰冻轨迹必须留下可见冰场。
3. 炮台必须在蛇身上有常驻青白节点。
4. 护盾必须有围绕蛇头旋转的护盾星。
5. 闪电必须有常驻电核，并在触发时有电弧。
6. QA 必须检查技能 VFX 纹理和技能层渲染数量。

## 新资产

原始生成图：

`public/assets/generated/sprite-forge/raw/skill-vfx-2x2-v4-raw.png`

处理输出：

`public/assets/generated/sprite-forge/processed/skill-vfx-v4/`

运行时纹理：

| 纹理 | 文件 | 用途 |
| --- | --- | --- |
| vfx-fire-ring-v4 | skill-vfx-1.png | 火焰光环 |
| vfx-frost-field-v4 | skill-vfx-2.png | 冰冻轨迹 |
| vfx-shield-star-v4 | skill-vfx-3.png | 旋转护盾 |
| vfx-lightning-core-v4 | skill-vfx-4.png | 闪电节点 |

质检结果：

- `edge_touch_frames`: `[]`
- 每帧输出尺寸：128x128
- 背景已透明化。

## QA 升级

`scripts/qa-smoke.mjs` 现在会检查：

- V4 四个技能 VFX 纹理是否存在。
- 强制点亮五个技能后，`skillLayer` 是否至少渲染 5 个视觉对象。

这避免技能只有数值、没有画面表现。
