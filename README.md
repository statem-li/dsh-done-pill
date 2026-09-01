# dsh-done-pill — 对话完成胶囊（消息胶囊）

从 dsh-webui 的 `done-pill` 模块拆出的**独立插件**：顶部悬浮「消息胶囊」，
任一会话（含后台会话）回合完成时提醒、点击跳会话、悬停看记录全文、可拖拽
定位并持久化，附带健康提醒（休息时段 / 凌晨提醒）与胶囊外观设置（大小 /
字体）。**全程零 DSH 源码改动。**

> 背景：dsh-webui（全家桶）已于 2026-08-28 卸载，其 done-pill 能力随之下线。
> 本插件把该模块原样移植为单体插件，行为与数据契约不变，方便只想要「消息
> 胶囊」的用户。

> v0.2.0 视觉改版：按参考稿 1:1 复刻「对话完成记录」设计——暖白渐变全圆角
> 胶囊（左侧橙色月亮提醒 + 分隔线 + 白蓝圆底灯泡徽章 + 右箭头）、白色大圆角
> 记录面板（蓝色圆胶囊标题条 + 灰计数 + 蓝色「点击卡片进入会话」链接）、空
> 状态蓝色叠层气泡插画 + 浅蓝提示胶囊 + 底部浅蓝波浪；列表行改浅蓝圆角卡 +
> 未读蓝点。深/浅主题各一套 `--dpl-*` 变量，行为与数据契约不变。

## 模块清单

| 半身 | 模块 | 说明 |
| --- | --- | --- |
| host | `session/event` 监听（global） | 任一会话（含后台会话）`turn/end` 时提取标题 / 触发问题 / 助手回复，写入内存完成列表（最近 50 条，seq 单调递增）；`running` 表跟踪进行中的回合（`turn/start` 入表、`turn/end` 出表） |
| host | `GET /api/dsh-done-pill` | 前端轮询增量数据；`?since=N` 返回 `items = seq > N`（升序）+ `running` |
| client | `shell.overlay` 顶部胶囊 | 常驻悬浮、可拖拽（位置按中心点视口比率持久化）、点击进最新完成会话、悬停滑出记录面板（运行中任务列表 + 完成记录全文） |
| client | 通用设置 5 行 | 对话完成胶囊（显隐）/ 休息时间提醒 / 凌晨注意休息 / 胶囊大小 / 胶囊字体 |

## 路由

```
GET /api/dsh-done-pill?since=N
→ 200 { ok: true, version, items: DoneEntry[], running: RunningEntry[] }
其他方法 → 405
```

`DoneEntry`：`seq / id / sessionId / title / question / answer / endedAt / turn / reasonKind`。
`RunningEntry`：`sessionId / since / question / title`。

设计约束（与 webui 一致）：subagent 回合跳过；`aborted` 回合不算完成；
空回合（无问题也无回复）不上报；客户端每个页面加载先全量拉取恢复最近记录，
之后按 `since` 增量（仅存内存）。

## 配置

无 host 配置项。客户端全部走 localStorage（与 webui 共用同一套键，旧配置
无缝延续；卸载 webui 后再装本插件，位置 / 已读 / 开关 / 时段 / 外观都在）：

| 键 | 含义 |
| --- | --- |
| `dsh.donePill.enabled` | 胶囊整体显隐（"1"/"0"） |
| `dsh.donePill.pos` | 拖拽位置（中心点视口比率 `{xc,yc}`） |
| `dsh.donePill.read` | 已读记录 id 集合 |
| `dsh.donePill.rest` | 休息时间提醒 `{enabled,start,end}` |
| `dsh.donePill.late` | 凌晨注意休息 `{enabled,start,end}` |
| `dsh.donePill.appearance` | 外观 `{scale,font}` |

## 与 dsh-webui 的关系

- 路由：本插件用私有路径 `/api/dsh-done-pill`（不复用 webui 的
  `/api/webui-done-pill`），二者同时安装也不会注册冲突；路由冲突时 host
  端会 warn 并跳过，不影响插件加载。
- 座位：本插件槽位 id 带 `dsh-done-pill` 前缀，与 webui 的 `done-pill`
  座位不冲突。
- **建议**：同时装了 webui 时，在 webui 模块开关里关掉 `donePill`，
  避免双胶囊 + 双宿主路由。
- CSS 类名（`.dsh-done-pill*`）与样式表 id（`dsh-done-pill-css`）沿用
  webui 原值，注入幂等，两边共存无冲突。

与 webui 版的三处差异：① 路由/座位前缀独立（见上）；② **已移除胶囊右侧
的「文件」按钮**——它依赖 webui fileExplorer 的跨模块事件桥
（`dsh-file-explorer-toggle`），独立插件里没有监听者，去掉避免无效入口；
需要文件入口时用 webui（关掉 donePill 模块）或另行装文件浏览器插件；
③ **视觉风格自 v0.2.0 起改为「对话完成记录」参考稿的 soft-card 样式**
（见上方 v0.2.0 说明），替代旧版 HUD 线条感（tech-line）——行为与
几何骨架（拖拽/位置持久化/宽度形变节奏）不变。

## 构建与自测

```bash
pnpm install            # 只需 esbuild（devDependency）；没有 pnpm 时
                        # build.mjs 会自动借用 DSH checkout 的 esbuild
node build.mjs          # 产出 lib/index.js（host）+ lib/client.js（browser）
node scripts/smoke-host.mjs    # host 冒烟：事件流 → 完成条目 / 路由过滤 /
                               # aborted / subagent 跳过（裸 node 即可）
node scripts/smoke-client.mjs  # client 冒烟：loader 契约 + 6 个槽位注册
```

`lib/` 随仓库提交（pnpm≥10 拦截 git 依赖的 `prepare`，安装方不跑构建）。

## 安装 / 卸载

```bash
# 一句话安装（从 GitHub）——bundle patch 自动注册，无需手编 profile
dsh plugin --profile web add github:statem-li/dsh-done-pill
dsh plugin --profile web remove dsh-done-pill
```

本地开发用 junction（源码目录即运行目录）：

```powershell
New-Item -ItemType Junction -Path "C:\Users\Anti\.dsh\profiles\web\node_modules\dsh-done-pill" `
  -Target "D:\AI\Dsh\dsh-done-pill"
```

然后在 profile `cordis.patch.yml` 追加：

```yaml
- insert:
    - id: dsh-done-pill
      name: dsh-done-pill
```

**宿主半身不支持热重载：装完重启一次 DSH**（client 半身随页面刷新生效，
但 /api/dsh-done-pill 路由与新的事件监听需要服务重启）。

## 目录结构

```
src/host.ts           host 半身（监听 + 路由 + 插件契约）
src/client/index.ts   client 入口（apply + inject）
src/client/pill.tsx   胶囊 UI（自 webui done-pill.tsx 移植）
scripts/smoke-host.mjs   host 冒烟
scripts/smoke-client.mjs client 冒烟
build.mjs             esbuild 双产物构建 + 外部依赖守卫
cordis.patch.yml      插件自带 bundle patch（dsh plugin add 自动并入）
```

## 卸载步骤

1. `dsh plugin --profile web remove dsh-done-pill`（或删除 junction +
   profile `cordis.patch.yml` 里的 insert 条目）；
2. 重启 DSH；
3. 浏览器控制台 `localStorage.removeItem('dsh.donePill.enabled')` 等键可
   一并清掉（可选，留着无副作用）。
