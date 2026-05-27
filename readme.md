# koishi-plugin-course-schedule

[![Socialify](https://socialify.git.ci/VincentZyu233/koishi-plugin-course-schedule/image?custom_description=%E8%AF%BE%E7%A8%8B%E8%A1%A8%EF%BC%8C%E7%BE%A4u%E5%9C%A8%E4%B8%8A%E4%BB%80%E4%B9%88%E8%AF%BE%E6%8D%8F&description=1&font=Bitter&forks=1&issues=1&language=1&logo=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Ff%2Ff3%2FKoishi.js_Logo.png&name=1&owner=1&pattern=Plus&stargazers=1&theme=Auto)](https://gitee.com/vincent-zyu/koishi-plugin-course-schedule)

<p>
  <a href="https://www.npmjs.com/package/koishi-plugin-course-schedule" target="_blank">
    <img src="https://img.shields.io/npm/v/koishi-plugin-course-schedule?style=flat-square" alt="npm version">
  </a>
  <a href="https://www.npmjs.com/package/koishi-plugin-course-schedule" target="_blank">
    <img src="https://img.shields.io/npm/dm/koishi-plugin-course-schedule?style=flat-square" alt="npm downloads">
  </a>
  <a href="https://github.com/VincentZyu233/koishi-plugin-course-schedule" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
  <a href="https://gitee.com/vincent-zyu/koishi-plugin-course-schedule" target="_blank">
    <img src="https://img.shields.io/badge/Gitee-C71D23?style=for-the-badge&logo=gitee&logoColor=white" alt="Gitee">
  </a>
  <a href="https://qm.qq.com/q/ZN7fxZ3qCq" target="_blank">
    <img src="https://img.shields.io/badge/QQ群-1085190201-1AAD19?style=flat-square" alt="QQ群">
  </a>
</p>

<p><del>💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入QQ群：<b>259248174</b> 🎉（这个群G了）</del></p>
<p>💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入新QQ群：<b>1085190201</b> 🎉</p>
<p>💡 在群里直接艾特我，回复的更快哦~ ✨</p>

---

## 📖 简介

课程表，**群u在上什么课捏**？

支持多种课表格式导入，自动渲染为图片输出，帮助群友互相了解彼此的课程安排。

## ✨ 功能

### 📥 多格式导入

| 格式 | 说明 |
|------|------|
| **WakeUp 课程表** | 直接发送 WakeUp 分享口令即可导入 |
| **星链课表** | 支持星链课表分享码和 JSON 格式 |
| **拾光课表 / 原生 JSON** | 粘贴课表 JSON 文本直接导入 |
| **WakeUp 备份文件** | 支持 `.wakeup_schedule` 备份文件导入 |
| **ICS 文件/链接** | 支持 `.ics` 文件上传或 ICS 链接下载解析 |

### 📋 可用命令

```
课表.绑定 <文本/文件>     — 导入课表数据
课表.查看 [天]           — 查看个人某天课程
课表.群课表 [天]         — 查看本群所有人某天的课程
课表.排行                — 查看本周本群上课时长排行榜
课表.周课表 [周数]        — 查看个人周课表纵览
```

> 命令名称可在插件配置中自定义。

### 🖼️ 渲染方式

基于 **Puppeteer** 将 HTML 模板渲染为图片输出，配置项：
- **waitUntil 策略** —— 控制渲染等待时机（load / domcontentloaded / networkidle0 / networkidle2）
- **自定义字体** —— 支持指定系统字体文件路径
- **自定义颜色** —— 主题色、卡片背景色、状态标签色均可配置

### 📅 节假日支持

内置 2026 年节假日数据，节假日自动提示休息消息，调休上班日正常显示课程。

## 📦 安装

在 Koishi 插件市场搜索 `course-schedule` 即可安装，或使用 npm：

```bash
npm install koishi-plugin-course-schedule
```

## ⚙️ 配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `baseCommand` | `课表` | 父级指令名称 |
| `renderWaitUntil` | `load` | Puppeteer 渲染等待策略 |
| `textFontPath` | `(空)` | 自定义字体文件路径 |
| `renderColors.primaryColor` | `#52449e` | 主题色 |
| `renderColors.cardBgColor` | `#E3F2FD` | 个人课表卡片背景色 |
| `renderColors.statusOngoingColor` | `#D32F2F` | 进行中标签色 |
| `renderColors.statusNextColor` | `#1976D2` | 下一节标签色 |
| `renderColors.statusFinishedColor` | `#388E3C` | 已结束标签色 |
| `icsTempDir` | `./tmp` | ICS 临时文件目录 |
| `icsTempDeleteTime` | `300` | 临时文件自动删除时间（秒） |
| `verboseConsoleLog` | `false` | 详细调试日志 |

## 🔗 链接

- **GitHub**: https://github.com/VincentZyu233/koishi-plugin-course-schedule
- **Gitee**: https://gitee.com/vincent-zyu/koishi-plugin-course-schedule
- **npm**: https://www.npmjs.com/package/koishi-plugin-course-schedule

## 📄 许可证

由于绝大部分上游采用强 copyleft 许可证（AGPL v3 / GPL v3），
要求修改后的代码也必须以相同许可证公开，
故本插件同样采用 **GNU Affero General Public License v3 (AGPL-3.0)** 发布。

在开发过程中参考/借鉴了以下开源项目：

| 项目 | 许可证 |
|------|--------|
| [astrbot_plugin_CourseSchedule](https://github.com/advent259141/astrbot_plugin_CourseSchedule) | AGPL v3 |
| [nonebot-plugin-course-schedule](https://github.com/GLDYM/nonebot-plugin-course-schedule) | AGPL v3 |
| [Yunzai-Schedule-Plugin](https://github.com/Temmie0125/Yunzai-Schedule-Plugin) | GPL v3 |
| [curriculum-table](https://github.com/koishi-shangxue-plugins/koishi-shangxue-apps/tree/main/plugins/curriculum-table) | MIT |
