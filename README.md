# customtheme

DeepSeek Harness 的自定义主题插件：聊天窗口背景图、图片不透明度、全局配色（自动从图片提取主色）、输入框、消息气泡、文字与边框颜色，以及界面/代码字体。

## 安装

需要已安装 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh` 命令可用）以及 `pnpm`。

从 GitHub 安装：

```bash
dsh plugin --profile web add github:Arthu77/customtheme
```

从 npm 安装：

```bash
dsh plugin --profile web add customtheme
```

安装后重启 `dsh web` 即可。

## 使用

打开 **设置 → 自定义主题**：

- **背景图片**：上传 / 预览 / 移除；图片不透明度
- **全局配色**：自动配色开关、背景主题色、按钮/强调色、侧边栏透明度
- **输入框（对话框）**：背景色、不透明度、边框色
- **消息气泡**：背景色、不透明度
- **字体**：界面字体 / 代码字体（系统字体或上传 `.ttf/.otf/.woff/.woff2`）
- **文字与边框**：主文字色、次要文字色、边框色

所有设置实时生效，可一键"恢复默认"。

## 许可

MIT
