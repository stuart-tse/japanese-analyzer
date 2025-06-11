# Japanese Sentence Analyzer (日本語文章解析器) 🈁

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](#📄-许可证)
[![Demo](https://img.shields.io/badge/demo-online-blue.svg)](https://japanese-analyzer-demo.vercel.app/)

> **使用 AI大模型 驱动的日语句子深度解析工具**  
> 面向中文学习者，拆解句法结构、标注词性、呈现发音与释义，让读懂日语不再困难。
> 使用Gemini 2.5 Flash模型
---

## ✨ 主要特性
| 功能 | 描述 |
| :-- | :-- |
| 🔍 **智能句法标注** | 一键输出词性、假名、罗马音与语法成分 |
| 📚 **多维词义解释** | 集合权威词典，提供精准中文释义 |
| 🖼️ **OCR 图像识别** | 从截图或照片中提取日语文本并立即解析 |
| 🔈 **原声 TTS 朗读** | 集成 Gemini TTS, 朗读整段日语 |
| 🔄 **整句翻译** | 双语对照，迅速把握整体含义 |
| 🌐 **流式响应** | 基于流式 API，交互更丝滑 |
| ⚙️ **高度可配置** | 支持自定义 Gemini API Key / Endpoint |

---

## 🚀 在线体验
立即在浏览器中试用 👉 **[Demo](https://japanese-analyzer-demo.vercel.app/)**
国内访问地址 👉 **[国内访问](https://nihongodemo.howen.ink/)**
> 注意：当前 Demo 网站使用的是免费的 API Key，可能存在不稳定情况。请勿滥用，如有大量使用需求，建议根据下方教程申请您自己的 API Key（完全免费）。

## 📺 演示视频


https://github.com/user-attachments/assets/5039cb62-135e-48e1-971d-960d6b82cacf


---
## 🛠️ 在线部署指南

1. 访问 Google Aistudio 官网 👉 **[aistudio](https://aistudio.google.com/)**
2. 点击页面右上角的 **“Get API Key”** 按钮
3. 在弹出窗口中选择已有项目，或点击创建新项目（完全免费）
4. 创建后复制生成的 API Key，并妥善保存
5. 您可以将该 API Key 应用于：
   - 自行部署完整项目
   - 或在 Demo 网站右上角“设置”中自定义使用您的 API Key

### 一键部署到 Vercel（推荐）
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cokice/japanese-analyzer&env=API_KEY)

1. **Fork** 本仓库到自己的 GitHub 账户  
2. 在 [Vercel](https://vercel.com/) 中 **Import** 该仓库  
3. 在 *Project Settings › Environment Variables* 添加：  
4. 目前仅支持gemini模型，后续可能会加新模型
   | 变量名 | 必填 | 说明 |
   | :--- | :---: | :--- |
   | `API_KEY` | ✅ | 你的 Gemini API 密钥（前文获取的） |
| `API_URL` | ❌ | 自定义接口地址（留空使用默认） |

### 本地 TTS 测试

确认 `API_KEY` 已配置后，可在命令行运行：

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}" \
  -X POST -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"こんにちは"}]}],"generationConfig":{"responseModalities":["AUDIO"],"speechConfig":{"voiceConfig":{"prebuiltVoiceConfig":{"voiceName":"Kore"}}}},"model":"gemini-2.5-flash-preview-tts"}' \
  | jq -r '.candidates[0].content.parts[0].inlineData.data' | base64 --decode >out.pcm
ffmpeg -f s16le -ar 24000 -ac 1 -i out.pcm out.wav
```

即可得到 `out.wav` 音频文件。

4. 点击 **Deploy**，几秒后即可访问专属域名 ✨
---

## 🤝 如何贡献
我们热忱欢迎任何形式的贡献！

- 🐛 **报告 Bug**：在 Issues 中描述复现步骤  
- 🚀 **提出功能**：新特性 Idea & 需求讨论  
- 💻 **提交代码**：Pull Request  

> 在提交 PR 之前请先创建 Issue 进行沟通，保持方向一致。
---

## 📄 许可证
本项目基于 **[MIT License](LICENSE)** 发布。© 2025 Japanese Analyzer

---

## 📬 联系方式
如有问题，请开一个 Issue 交流

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=cokice/japanese-analyzer&type=Date)](https://www.star-history.com/#cokice/japanese-analyzer&Date)
