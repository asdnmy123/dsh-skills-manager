# dsh-skills-manager

为 **DeepSeek Harness Desktop 0.2.0-rc.2** 添加左侧「技能」页面。参考 Codex 技能管理页面，支持真实技能列表、搜索、来源与工作区筛选、单项和批量启用/关闭，以及确认后删除。

## 安装到 Desktop

1. 在项目目录执行 `npm ci` 和 `npm run build`。需要 Node.js 22.12 或更高版本。
2. 在 Desktop 的插件管理页面，通过本地安装入口选择本项目目录。也可以执行 `npm pack`，选择生成的 `dsh-skills-manager-0.1.0.tgz` 安装包。
3. 按宿主提示重新加载插件或重启 Desktop，在左侧打开「技能」。

Desktop profile 由桌面应用管理，请使用桌面插件管理入口。项目依赖和集成测试固定为 `0.2.0-rc.2`；`dsh.client.platform: web` 表示 Desktop 内嵌页面的客户端类型。

本项目已用该版本的真实 SkillRegistry、FileSystemSkillProvider、Connection、页面渲染器和客户端模块验证，尚未安装到用户正在运行的 Desktop profile。包目前为 private，许可证为 UNLICENSED。

## 使用

- 默认查看全局技能；选择工作区后，包含该项目中生效的技能。可按名称、描述、提供方搜索，按来源或启用状态筛选。
- 开关控制后续模型和手动调用。关闭时保存原来的调用策略，重新启用时恢复，例如原本仅支持手动调用的技能仍保持该策略。已注入对话的内容会保留。
- 勾选技能后，可批量启用、关闭或删除；每次最多 100 项。操作结果逐项反馈，文件被其他程序修改时需刷新再操作。
- 删除前显示技能名称及路径，确认后把文件或整个技能包移动到回收目录，保留资源文件。刷新后列表按宿主的同名技能优先级重新计算，可能出现下层的同名技能。
- 页面支持浅色、深色主题和窄屏布局，提供键盘操作、删除弹窗焦点管理、加载及错误状态。

列表显示所选范围中由宿主解析出的同名优胜项，包括已关闭的技能；不枚举被覆盖的副本或其他 agent preset 的专属 scope。部分技能来源加载失败时，暂停管理操作，刷新后重试。

## 可管理范围

默认可管理 `filesystem` 提供方的个人技能和所选工作区的项目技能：

| 来源 | 目录 |
| --- | --- |
| 个人 · dsh | `$DSH_HOME/skills`，默认 `~/.dsh/skills` |
| 个人 · agents | `$DSH_AGENTS_HOME/skills`，默认 `~/.agents/skills` |
| 项目 · dsh | 项目根目录的 `.dsh/skills` |
| 项目 · agents | 项目根目录的 `.agents/skills` |
| 自定义 | 明确配置的 `customSkillDirs` |

支持 `<name>/SKILL.md` 技能包及根目录平铺的 `.md` 文件。随包、虚拟、远程技能，以及链接、硬链接、超出范围、无法读取或超过 1 MiB 的技能文件为只读；鼠标停在「只读」上可查看原因。写入权限不足时会反馈操作失败。

若文件系统提供方使用了自定义根目录，在宿主的插件配置中同步以下字段。默认无需配置；这些字段不会修改技能提供方自己的配置。

```yaml
dshHome: 'D:/my-dsh-home'
agentsHome: 'D:/my-agents-home'
customSkillDirs:
  - 'D:/shared-skills'
filesystemProviders:
  - filesystem
```

`dshHome`、`agentsHome` 指向 home 目录，插件会追加 `/skills`；`customSkillDirs` 直接指向技能根目录。项目根目录按最近的 `.git` 查找，无 `.git` 时使用所选工作区目录。

## 状态保存与恢复删除

启用状态写入原技能文件的 YAML 头部，使用 dsh 的 `disable-model-invocation` 与 `user-invocable` 字段，并在 `dsh-skills-manager-state` 中保存关闭前的策略。正文保持原样，其他字段及注释保留；YAML 头部格式可能重新排版。共享同一技能文件的其他宿主也会读取这些调用策略。关闭期间若手动改了策略，插件会提示冲突，避免覆盖修改。

删除后的内容位于原技能根目录：

```text
.dsh-skills-manager-trash/<唯一编号>/
  receipt.json          原路径、删除时间和文件版本
  <原技能目录或文件>    技能正文及资源
```

需要恢复时，打开 `receipt.json`，将同目录内的技能文件或技能包移回 `originalPath`，再刷新技能页。如果原位置已有同名内容，先处理名称冲突。当前版本通过文件恢复，不提供页面内回收站。

## 开发与验证

```sh
npm ci
npm run verify
npm pack
```

`npm run verify` 包含类型检查、构建、20 项业务及集成测试、1 项隔离浏览器测试和打包预检。测试使用临时技能目录，不修改现有个人技能。

浏览器测试默认使用 Windows 的 Microsoft Edge。其他环境可先执行 `npx playwright install chromium`，或通过 `DSM_BROWSER_EXECUTABLE` 指定 Chromium 浏览器路径。测试截图保存在被 Git 忽略的 `artifacts/` 目录。

| 命令 | 用途 |
| --- | --- |
| `npm run build` | 生成宿主代码、声明和客户端 lazy-CJS 模块 |
| `npm run typecheck` | 检查 TypeScript 类型 |
| `npm test` | 构建并运行业务、通信、生命周期及界面交互测试 |
| `npm run test:browser` | 运行真实浏览器布局和操作测试，需先构建 |
| `npm run verify` | 完整验证与打包预检 |
| `npm pack` | 构建并生成本地安装包 |

宿主与客户端通过 Connection 的标准 RPC 协议通信，复用认证与 Desktop 传输。文件管理验证路径、版本和文件类型，使用排他锁与临时文件替换，并通过公共技能提供方接口使目录缓存失效。插件卸载时移除路由、页面、导航、样式及监听器。

每次改动都须更新相关测试，全部验证通过后创建对应 Git commit。

## 官方参考

- [第一个插件](https://deepseek-harness.github.io/deepseek-harness/develop/basic/)
- [架构参考](https://deepseek-harness.github.io/deepseek-harness/reference/)
- [客户端页面接入](https://deepseek-harness.github.io/deepseek-harness/reference/cookbook/adding-a-settings-card)
- [技能子系统](https://deepseek-harness.github.io/deepseek-harness/reference/subsystems/skills)
