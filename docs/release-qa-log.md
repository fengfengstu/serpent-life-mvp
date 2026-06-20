# 《此生为蛇》分叉版发布与 QA 记录

## 当前外网地址

https://fengfengstu.github.io/serpent-life-mvp/

## 源码分支

`sprite-forge-fork`

## 已发布构建

- Pages source: `gh-pages`
- Source branch pushed: `sprite-forge-fork`
- Latest source commits:
  - `e27744f` Create sprite forge gameplay rebalance fork
  - `f8a3d57` Add smoke QA and adaptive combat audio
  - `85014db` Preserve GitHub Pages nojekyll marker

## 已验证项目

使用：

```bash
QA_URL='https://fengfengstu.github.io/serpent-life-mvp/?v=85014db' npm run qa:smoke
```

公网 smoke 通过：

- 390x844 手机视口：通过。
- 320x568 小屏视口：通过。
- 首屏仍处于 playing，不被升级界面过早打断。
- 首屏至少 1 个可见敌人。
- Sprite Forge 资产加载成功：`sf-enemy-idle-1`、`sf-boss-idle-1`、`impact-1`。
- 跟随式虚拟摇杆可激活，底座会随大幅拖动移动。
- 第一次升级选择后回到 playing。
- BGM 在升级后恢复。
- 结算页无可见区域溢出。
- 重开后玩家仍在镜头内。

## Sprite Forge v2 更新

最新分叉继续推进后，enemy 与 Boss 不再使用失败 sheet 的单帧过渡，而是接入了通过 `edge_touch_frames: []` 质检的 v2 动画：

- `public/assets/generated/sprite-forge/processed/enemy-idle-v2/pipeline-meta.json`
- `public/assets/generated/sprite-forge/processed/boss-idle-v2/pipeline-meta.json`

运行时已确认：

- 普通敌人播放 `enemy-idle-v2`。
- Boss 播放 `boss-idle-v2`。
- 旧的失败 enemy/boss processed 资产已从项目发布资产中移除。

## 当前仍不是最终完成项

- 蛇头仍来自上一轮 remaster 资产，风格可用但不是最终主美级。
- 技能图标仍用文字符号，后续应替换为统一的极简图标资产。
- Boss 战只验证了资源和基础生成，没有完成完整 5-8 分钟胜负曲线测试。
- 尚未进行真人试玩反馈；目前只有自动 smoke 和视觉截图判断。

## 下一轮优先级

1. 增加 Boss 出场 3 秒警示和阶段反馈。
2. 补技能图标与技能 VFX 的 Sprite Forge 管线。
3. 重做蛇头/蛇身为统一可动资产。
4. 做 3-5 分钟自动游玩/人工跑测，观察升级次数、击杀、死亡时间、Boss 到达率。
