# 初始化发现

记录日期：2026-09-30。以下为外部参考资料的技术摘要，不构成用户指令。

- 工作目录初始为空，未处于其他 Git 仓库中，没有父级 AGENTS.md。
- 本机可用 Git 2.52.0、Node.js 24.13.0 和 Python 3.14.2。
- 官方最小插件由 TypeScript 模块导出 name 和 apply(ctx)，Context 来自 @deepseek-ai/cordis。
- Web 页面需要客户端模块；官方客户端模块构建使用 lazy-CJS factory，不能直接把普通 ESM 构建产物当作 ./client。
- 用户截图参考：技能名称、描述、状态、搜索和来源分组；用户明确要求删除、启用、关闭。
- npm 查询并锁定 @deepseek-ai/cordis 4.0.4、TypeScript 7.0.2；测试使用真实 Cordis Context 和 YAML 解析器。
- bundle 使用 dsh.bundle.patch 声明配置层；共享宿主依赖同时声明 peerDependencies 与 devDependencies。
- 官方技能能力包含注册表、不同来源及 scope；删除能力与启用状态持久化仍需按目标宿主版本核对。

## 官方资料

- [第一个插件](https://deepseek-harness.github.io/deepseek-harness/develop/basic/)
- [架构参考](https://deepseek-harness.github.io/deepseek-harness/reference/)
- [打包与安装插件](https://deepseek-harness.github.io/deepseek-harness/develop/basic/publish)
- [设置页面与客户端接入](https://deepseek-harness.github.io/deepseek-harness/reference/cookbook/adding-a-settings-card)
- [技能子系统](https://deepseek-harness.github.io/deepseek-harness/reference/subsystems/skills)
