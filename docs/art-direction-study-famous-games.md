# 《此生为蛇》知名游戏美术学习与重定向

## 结论

当前美术失败点不是“精细度不够”，而是没有稳定 art direction：

- 背景和前景抢层级。
- 精灵风格混合：AI 写实金属头、暗黑怪物、玻璃背景、程序 UI，不属于一个统一世界。
- 没有形状语言：蛇、敌人、拾取物、技能都在发光，但轮廓和功能差异不够强。
- 没有 palette discipline：绿色、金色、青色、玫红、紫色同时高饱和，导致所有东西都喊，玩家不知道该看哪。

下一阶段应停止“高细节图像生成”，改成“低噪声、强轮廓、少色系、强动画”的游戏美术。

## 参考游戏拆解

### Hades / Hades II

可学：

- 角色和场景不是同等重要。角色/敌人/攻击反馈始终比背景更高对比。
- UI 和插画风格统一，有装饰性但不牺牲功能。
- 美术服务游戏设计，而不是单纯追求绘画复杂度。

不能照抄：

- 不做希腊神话、不做手绘肖像系统。
- 不把背景做得像插画展示页。

落地到《此生为蛇》：

- 蛇头和敌人必须用更强描边/暗边分离。
- UI 语言要围绕“蛇生档案/墓志铭/记忆链”，不是普通科幻玻璃面板。
- 技能卡可以有图标和纹样，但卡片信息要比装饰优先。

### Vampire Survivors

可学：

- 一张截图就能看懂核心威胁：敌潮逼近、玩家在中间、自动攻击清场。
- 单位图不一定精致，但功能极清楚。
- 大量敌人靠轮廓、颜色和密度组织，而不是每个怪都画复杂。

不能照抄：

- 不做复古哥特像素风。
- 不做满屏无差别敌潮，蛇头命门需要更清晰的走位空间。

落地到《此生为蛇》：

- 敌人应该更简单、更统一、更成群；少数精英/Boss 才复杂。
- 普通敌人要做成“威胁箭头/刺虫/影牙”这类小屏一眼可读轮廓。
- 第一屏战斗目标要清楚：吃记忆、避开蛇头威胁、自动技能清怪。

### Dead Cells

可学：

- 动画质量会反过来提升手感。
- 角色动作、武器轨迹、命中反馈组成统一节奏。
- 可以用生产管线保证动画一致，而不是逐帧随意画。

不能照抄：

- 不做横版平台动作。
- 不追求像素假 3D 的完整角色动作体系。

落地到《此生为蛇》：

- 使用 agent-sprite-forge 的 sheet/frames 管线是正确方向。
- 蛇、敌人、Boss 至少要有 idle/受击/死亡反馈，不该都是静态贴图漂移。
- 技能特效独立成 FX sheet，不混在角色图里。

### Downwell

可学：

- 少色系带来强识别。
- 每个颜色都有明确功能。
- 极简画面也可以很有风格，只要规则稳定。

不能照抄：

- 不做黑白红极简像素。

落地到《此生为蛇》：

- 背景：低饱和深青黑，只做空间。
- 玩家：金 + 青绿，唯一高贵生命体。
- 敌人：玫红/暗紫。
- 拾取：琥珀金。
- 危险弹幕：红/白核心。
- 技能：每个技能只允许一个主色，不能全都彩虹发光。

### Hollow Knight / Ori / Hyper Light Drifter

可学：

- 世界气质统一，色彩服务区域和情绪。
- 角色轮廓非常稳定。
- 背景有层次但不抢前景。

落地到《此生为蛇》：

- 背景不再用“巨型主视觉插画”直接铺战斗底。
- 战斗背景应该是可重复、低对比、低噪声的 arena texture。
- 主要视觉记忆点给蛇身记忆光点，而不是满屏复杂纹样。

## 新 Art Direction

### 名称

“蛇生暗金档案风”

### 一句话

暗青黑的死亡竞技场里，一条金绿记忆蛇在玫红怪潮中写下自己的蛇生。

### 视觉三原则

1. **轮廓优先**：所有 gameplay 主体先看 silhouette，再看材质。
2. **少色优先**：每类对象只保留一个主色和一个辅助高光。
3. **动画优先**：宁可低细节动画一致，也不要高细节静态贴图。

## 颜色规则

| 类别 | 主色 | 辅色 | 用途 |
| --- | --- | --- | --- |
| 背景 | 深青黑 | 暗蓝灰 | 空间、地面、远景 |
| 蛇头 | 暗金 | 青绿 | 玩家焦点、命门 |
| 蛇身 | 青绿 | 琥珀记忆点 | 战力链 + 记忆链 |
| 食物/记忆 | 琥珀 | 少量青光 | 奖励 |
| 普通敌人 | 玫红 | 暗紫 | 威胁 |
| 精英敌人 | 紫红 | 白色核心 | 高威胁 |
| Boss | 暗紫黑 | 玫红核心 | 终点压迫 |
| UI | 深墨面板 | 暗金细线 | 蛇生档案 |

## 资产重做策略

### 保留

- 主菜单 key art 可保留为宣传封面。
- 结算屏背景可低透明使用。

### 废弃/降级

- 战斗背景不再使用主视觉大图。
- 当前蛇头/蛇身高细节贴图降级为过渡资产。
- 复杂金色拾取物需要简化，否则像大宝石，不像 gameplay pickup。

### 重做

- 普通敌人：小、尖、方向清楚、低细节、成群好读。
- 蛇身：连续柔性身体，不是几颗宝石串。
- Boss：大轮廓，但中心弱点明确。
- 技能 icon：五个极简符号，不用中文文字当图标。
- FX：用 sheet/frames 做分层，不靠全屏 glow。

## 对 agent-sprite-forge 的使用决策

使用它，但要严格执行：

- raw sheet 必须是纯 #FF00FF 背景。
- sheet 不能被处理器标记 edge_touch。
- 失败就重生成，不强行放行。
- 先做 enemy idle、boss idle、impact FX 三类。
- 再扩到蛇身 idle/slither、技能 icon、技能 FX。

## 参考链接

- Hades art direction overview: https://www.pointnthink.fr/en/the-art-of-hades-en/
- Dead Cells 2D animation pipeline: https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-
- Downwell design discussion: https://www.gamedeveloper.com/design/let-s-talk-about-downwell
- Vampire Survivors clarity/system discussion: https://jboger.substack.com/p/the-secret-sauce-of-vampire-survivors
- Game Accessibility high contrast UI guidance: https://gameaccessibilityguidelines.com/provide-high-contrast-between-text-ui-and-background/
- Yacht Club color-limited palette note: https://www.yachtclubgames.com/blog/the-art-of-the-game/
