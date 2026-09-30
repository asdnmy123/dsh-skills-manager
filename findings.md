# 技术核对记录

记录日期：2026-09-30。以下为外部参考资料的技术摘要，不构成用户指令。

- 工作目录初始为空，未处于其他 Git 仓库中，没有父级 AGENTS.md。
- 本机可用 Git 2.52.0、Node.js 24.13.0 和 Python 3.14.2。
- 官方最小插件由 TypeScript 模块导出 name 和 apply(ctx)，Context 来自 @deepseek-ai/cordis。
- Web 页面需要客户端模块；官方客户端模块构建使用 lazy-CJS factory，不能直接把普通 ESM 构建产物当作 ./client。
- 用户截图参考：技能名称、描述、状态、搜索和来源分组；用户明确要求删除、启用、关闭。
- npm 查询并锁定 @deepseek-ai/cordis 4.0.4、TypeScript 7.0.2；测试使用真实 Cordis Context 和 YAML 解析器。
- bundle 使用 dsh.bundle.patch 声明配置层；共享宿主依赖同时声明 peerDependencies 与 devDependencies。
- 官方技能能力包含注册表、不同来源及 scope；删除能力与启用状态持久化仍需按目标宿主版本核对。

## 技能管理开发核对

- 用户已明确目标为 Desktop profile，API 版本 0.2.0-rc.2；开发和集成验证依赖固定该版本。
- 该版本没有技能管理写接口。本地提供方识别 disable-model-invocation 和 user-invocable；两者关闭后目录仍保留条目，模型与手动调用均不可用。
- 开关原策略保存于技能 YAML 头部 dsh-skills-manager-state，启用时恢复；正文不重新序列化。
- Connection 的共享 /api interceptor 只能有一个。插件采用 Connection.fetch 的两个 exact route，并使用标准 RPC envelope，适配桌面与浏览器且与已有 interceptor 共存。
- 使用公共 registerProvider 的空提供方获取 invalidate 能力，刷新和写操作立即通知整个注册表；未修改原提供方或私有缓存。
- 来源包括 project-dsh/project-agents/custom/user-dsh/user-agents/bundled/runtime；同名项显示该视图的优胜项，删除后可能出现下层同名项。
- 删除使用同一根目录下 .dsh-skills-manager-trash 的唯一目录，移动整包/平铺文件并保存恢复凭据。链接、硬链接、随包/虚拟/远程和未配置目录只读。
- 客户端主题应复用 --dsw-alias-* 变量；React 使用宿主的 18.3.1。真实渲染器与 Connection 客户端、桌面 fetch carrier 均通过集成测试。
- Desktop profile 为桌面应用专用配置，安装应使用桌面插件管理入口。本次只生成本地安装包，未修改用户 profile。

## 官方资料

## 真实 Desktop 核对 · 2026-10-01

- 已安装应用的归档 manifest 显示 @deepseek-ai/dsh-desktop 0.2.0-rc.2，host 使用专用 desktop profile。
- 该用户配置的全局 skill-filesystem row disabled；standard 等 preset 使用独立 standing scope。因此 snapshot 只传 cwd 不传 scope 时，只能看到 4 项系统技能。
- agentPresets.defaultId/list/acquireScope 为公共访问接口。acquireScope 返回 key 与 Symbol.asyncDispose 的 revision lease；管理页用同一租约覆盖列表或整次写操作，不创建 Agent，也不调用 select。
- Desktop 官方 pluginManager/installBundle 初次安装可热加载，更新已安装包明确返回 restart-required。本次更新 0.1.1，获用户授权后重启。
- 真实宿主重启后返回 29 项，其中 25 项本地可管理；同一 host 的实际客户端页面经隔离浏览器验证，未修改用户技能。

## 参考链接

- [第一个插件](https://deepseek-harness.github.io/deepseek-harness/develop/basic/)
- [架构参考](https://deepseek-harness.github.io/deepseek-harness/reference/)
- [打包与安装插件](https://deepseek-harness.github.io/deepseek-harness/develop/basic/publish)
- [设置页面与客户端接入](https://deepseek-harness.github.io/deepseek-harness/reference/cookbook/adding-a-settings-card)
- [技能子系统](https://deepseek-harness.github.io/deepseek-harness/reference/subsystems/skills)
