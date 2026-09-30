# 开发与验证

## 环境

- Node.js 22.12 或更高版本，npm。
- 开发 API 固定为 DSH `0.2.0-rc.2`；React 与宿主一致，使用 `18.3.1`。
- GitHub 安装使用仓库内的 `lib/`，安装阶段不执行构建脚本。

```sh
npm ci
npm run build
npm run verify
```

浏览器测试在 Windows 默认使用 Microsoft Edge。其他环境先执行 `npx playwright install --with-deps chromium`，或通过 `DSM_BROWSER_EXECUTABLE` 指定 Chromium 浏览器。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run build` | 生成宿主代码、声明和客户端 lazy-CJS 模块 |
| `npm run check:dist` | 重新构建并比较产物，发现过期或缺失文件 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm test` | 构建并运行业务、通信、生命周期、界面和发布测试 |
| `npm run test:browser` | 真实浏览器布局与操作测试，需先构建 |
| `npm run verify` | 完整验证及打包预检 |
| `npm pack` | 打包现有产物；修改源码后先构建并验证 |

修改源码后提交对应的 `lib/` 产物。CI 会检查产物可复现，并确认打包内容没有源码、测试、开发工具或本地数据。

## 项目结构

```text
src/index.ts          宿主路由与请求校验
src/manager.ts        目录、preset 范围、开关和删除
src/frontmatter.ts    YAML 策略保存与恢复
src/client/           页面、状态模型和样式
lib/                  已构建的可安装产物
scripts/              客户端构建与产物验证
tests/                业务、客户端、浏览器和发布测试
docs/                 配置和开发说明、示例截图
cordis.patch.yml      bundle 配置层
```

宿主与客户端通过 Connection 标准 RPC 协议通信，复用认证与 Desktop 传输。preset 范围通过公共 `acquireScope` 租约读取，不创建 Agent 或改变会话配置。插件卸载时清理路由、页面、导航、样式和监听器。

测试使用临时技能目录。浏览器测试截图保存在被 Git 忽略的 `artifacts/`；README 预览复制自示例数据的截图。个人 Desktop profile、凭据、安装备份和本地任务记录不进入发布包。

## 发布

1. 更新 `package.json` 版本、README 的固定安装 tag 和 CHANGELOG。
2. 执行 `npm run build`、`npm run verify`，提交源码及产物。
3. 执行 `npm pack`，创建匹配版本的 `v<版本>` tag，并上传 Release 安装包。

每次改动均需更新相关测试，全部验证通过后创建对应 Git commit。

## 参考

- [第一个插件](https://deepseek-harness.github.io/deepseek-harness/develop/basic/)
- [打包与安装](https://deepseek-harness.github.io/deepseek-harness/develop/basic/publish)
- [客户端页面接入](https://deepseek-harness.github.io/deepseek-harness/reference/cookbook/adding-a-settings-card)
- [技能子系统](https://deepseek-harness.github.io/deepseek-harness/reference/subsystems/skills)

[返回 README](../README.md)
