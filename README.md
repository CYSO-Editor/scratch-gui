# CYSO Editor GUI

CYSO Editor 的图形化用户界面，基于 [TurboWarp/scratch-gui](https://github.com/TurboWarp/scratch-gui) 与 Scratch 3.0 官方编辑器深度定制。提供编辑、运行 CYSO Editor 项目的完整界面，内置 Aurora 主题、CYSO Core 权限中心与扩展管理。

## 主要特性

- **Aurora / Misty Sand 主题**：多套自定义视觉主题。
- **CYSO Core 集成**：菜单栏提供 CYSO Core 按钮与安全设置中心，管理扩展权限。
- **扩展权限管理**：扩展加载前展示权限弹窗，支持批量加载与管理。
- **CYSO 默认项目**：内置 CYSO 猫等自定义默认素材。
- **编辑器个性化**：基于 tw-personalization 替代原 tw-theme-* 的个性化体系。

## 开发

```bash
npm ci
npm start
```

依赖的 `scratch-vm`、`scratch-paint` 由 `package.json` 中的依赖声明指向对应仓库。

## 相关仓库

- [CYSO-Editor/desktop](https://github.com/CYSO-Editor/desktop)：桌面客户端（主进程）
- [CYSO-Editor/vm](https://github.com/CYSO-Editor/vm)：虚拟机器（项目执行引擎）
- [CYSO-Editor/paint](https://github.com/CYSO-Editor/paint)：造型编辑器

## License

[GPL-3.0](./LICENSE)
