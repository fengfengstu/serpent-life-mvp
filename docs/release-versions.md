# 《此生为蛇》外网版本规则

## 原则

每次给用户或面试官看的可玩版本都必须发布到独立 URL，旧版本不得被新版本覆盖。

根目录可以保留为最新稳定版入口，但每个里程碑版本必须同时保存在：

`https://fengfengstu.github.io/serpent-life-mvp/versions/<version-id>/`

版本索引页：

`https://fengfengstu.github.io/serpent-life-mvp/versions/`

机器可读清单：

`https://fengfengstu.github.io/serpent-life-mvp/versions/releases.json`

## 当前版本

| 版本 | URL | 说明 |
| --- | --- | --- |
| v1-sprite-forge | `/versions/v1-sprite-forge/` | Sprite Forge 敌人与 Boss 动画版 |
| v2-color-semantics | `/versions/v2-color-semantics/` | 战斗识别分色版 |

## 后续发布要求

1. 先构建并测试本地版本。
2. 发布到新的版本目录，例如 `/versions/v3-player-art-pass/`。
3. 更新 `/versions/index.html` 和 `/versions/releases.json`。
4. 可选：根目录同步为最新稳定版。
5. 对新版本 URL 跑移动端烟测。

不要只覆盖根目录后就结束。
