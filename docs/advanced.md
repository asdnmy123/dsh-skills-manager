# 配置与技能文件管理

## 可管理目录

默认只管理 `filesystem` 提供方的本地技能：

| 来源 | 默认目录 |
| --- | --- |
| 个人 · dsh | `$DSH_HOME/skills`，未设置时为 `~/.dsh/skills` |
| 个人 · agents | `$DSH_AGENTS_HOME/skills`，未设置时为 `~/.agents/skills` |
| 项目 · dsh | 所选项目根目录的 `.dsh/skills` |
| 项目 · agents | 所选项目根目录的 `.agents/skills` |
| 自定义 | 插件配置中的 `customSkillDirs` |

支持 `<name>/SKILL.md` 技能包及根目录平铺的 `.md` 文件。项目根目录按最近的 `.git` 查找，无 `.git` 时使用所选工作区目录。

随包、虚拟、远程技能，以及链接、硬链接、超出范围、无法读取或超过 1 MiB 的文件只读。写入权限不足时会反馈操作失败。

列表按宿主的来源优先级显示所选 preset 和目录范围中的同名优胜项，包括已关闭的技能。部分来源加载失败时，管理操作暂停，需刷新后重试。

## 自定义目录

默认无需配置。如果文件系统技能提供方使用了自定义根目录，需要在技能管理插件中同步这些目录；本插件不会修改提供方的配置。

在 profile 的 `cordis.patch.yml` 中追加以下配置，按实际路径修改：

```yaml
- id: dsh-skills-manager
  config:
    dshHome: 'D:/my-dsh-home'
    agentsHome: 'D:/my-agents-home'
    customSkillDirs:
      - 'D:/shared-skills'
    filesystemProviders:
      - filesystem
```

`dshHome`、`agentsHome` 指向 home 目录，插件会追加 `/skills`；`customSkillDirs` 直接指向技能根目录。若提供方改了名称，也需同步 `filesystemProviders`。未配置为可管理范围的自定义目录仍可展示，但保持只读。

## 启用状态

开关使用 dsh 的 YAML 头部字段 `disable-model-invocation` 和 `user-invocable`：

- 关闭时，禁止后续模型和手动调用，并在 `dsh-skills-manager-state` 中保存原有策略。
- 重新启用时，恢复保存的策略，例如原本仅支持手动调用的技能仍保持该限制。
- 如果技能原本由外部同时关闭了两种调用，显式启用会打开两种调用。
- 关闭期间若手动改了策略，插件会报告冲突，避免覆盖修改。

正文保持原样，其他 YAML 字段及注释保留；头部格式可能重新排版。共享同一文件的其他宿主也会读取这些策略。操作不能撤回已注入对话的内容。

写入前重查版本与路径，使用排他锁、操作队列和临时文件替换。文件被其他程序修改时，需要刷新后重试。

## 恢复删除

删除技能包时会保留整个目录，包括附带资源；平铺技能只移动对应文件。回收内容位于原技能根目录：

```text
.dsh-skills-manager-trash/<编号>/
  receipt.json          原路径、删除时间和文件版本
  <原技能目录或文件>    技能正文及资源
```

1. 打开 `receipt.json`，确认 `originalPath`。
2. 将同目录下的技能文件或技能包移回该路径。
3. 回到技能页面刷新。

如果原位置已有内容，先处理名称冲突。当前版本通过文件恢复，不提供页面内回收站。

## 界面

[深色主题预览](images/skills-dark.png) · [窄屏预览](images/skills-mobile.png)

预览使用示例技能，不包含个人会话或配置。

[返回 README](../README.md)
