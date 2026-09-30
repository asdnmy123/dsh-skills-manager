# 技能管理页面开发计划

## 目标

在 dsh Desktop 0.2.0-rc.2 的左侧导航添加技能管理页面，支持搜索、来源/工作区筛选、启用、关闭和删除。
每次完成的改动更新相关测试，全部验证通过后提交 Git。

## 阶段

1. 核对 0.2.0-rc.2 技能、桌面通信和页面扩展接口：complete
2. 实现技能文件管理与宿主 API：complete
3. 实现页面、导航与客户端构建：complete
4. 运行业务、生命周期、客户端、桌面传输和打包验证：complete
5. 更新文档，创建 Git commit 并确认工作区状态：complete

## 错误记录

- 升级目标 API 时旧 node_modules/lockfile 的 peer 版本冲突；清理项目依赖后按 0.2.0-rc.2 重新生成。
- 首次类型检查发现 ClientConnectionRpc 导出位于 ./client、slots 服务声明由 renderer 提供、RPC failure 需 details；已修正。
- 首次业务测试 15/16 通过；Windows 在持有目录内锁文件句柄时不能移动技能目录，改为保留排他锁文件并关闭句柄。
- 内嵌浏览器工具因隔离环境初始化失败不可用；使用独立临时浏览器、真实客户端模块与认证传输完成验证。
- React 测试工具过早加载导致 JSDOM 输入事件不响应；按宿主版本固定 React 18.3.1 并改用 React 的 act，交互测试通过。

- 初次查询 Git 根目录提示未初始化仓库；已通过 git init -b main 处理。
- 隔离命令执行两次因 setup refresh 错误无法启动；使用获自动审批的非隔离执行继续初始化。
- 隔离账户创建的 .git 触发所有权校验；调整所有者被操作系统拒绝，已为当前用户添加仅针对本项目的 Git safe.directory 配置。
