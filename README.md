# dsh-skills-manager

为 DeepSeek Harness（dsh）提供技能管理页面，查看技能并执行删除、启用、关闭操作。
页面交互参考用户提供的 Codex 技能管理截图。

目前已完成项目初始化：Git 仓库、开发约束、TypeScript 宿主插件入口、bundle 配置、构建和测试。
当前入口为空实现，安装后不会出现技能管理页面；业务功能尚未实现。
包暂设为 private，未选择开源许可证。

## 开发

需要 Node.js 22 或更高版本，以及 npm。

```sh
npm ci
npm run verify
```

- `npm run build`：生成 `lib/` 下的 JavaScript 和类型声明。
- `npm run typecheck`：检查 TypeScript 类型。
- `npm test`：先构建，再运行初始化测试。
- `npm run verify`：类型检查、构建、测试及打包预检。
- `npm pack`：构建并生成本地安装包。

依赖版本由 `package-lock.json` 锁定。
Cordis 同时声明为 peerDependency 和 devDependency，便于宿主共享依赖与本地验证。

## 本地加载骨架

以下仅用于验证入口加载，要求本机已有 dsh CLI；不提供管理功能。
在 PowerShell 中从项目目录执行：

```powershell
npm run build
dsh plugin --profile web add (Get-Location).Path
dsh --profile web --dump-config
dsh --profile web
```

源码更新后重新构建并重启宿主。tarball 安装可使用 `npm pack` 输出的文件。
当前尚未在真实 dsh 宿主中完成集成验证。

## 项目结构

```text
src/index.ts          宿主插件入口
tests/                初始化和插件生命周期测试
docs/requirements.md  功能范围、接入点和待确认项
cordis.patch.yml      bundle 插件配置层
AGENTS.md             测试与提交约束
task_plan.md          本次初始化计划
findings.md           官方资料核对记录
progress.md           验证进度
```

每次改动都应更新相关测试，全部验证通过后创建对应 Git commit。

## 官方参考

- [第一个插件](https://deepseek-harness.github.io/deepseek-harness/develop/basic/)
- [架构参考](https://deepseek-harness.github.io/deepseek-harness/reference/)
- [打包与安装](https://deepseek-harness.github.io/deepseek-harness/develop/basic/publish)
- [客户端页面接入](https://deepseek-harness.github.io/deepseek-harness/reference/cookbook/adding-a-settings-card)
- [技能子系统](https://deepseek-harness.github.io/deepseek-harness/reference/subsystems/skills)
