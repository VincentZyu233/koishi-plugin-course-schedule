const pkg = require('../package.json')

export const usage = `
<h1>Koishi 插件：course-schedule</h1>
<h2>🎯 插件版本：v${pkg.version}</h2>

<p>
  <a href="https://www.npmjs.com/package/koishi-plugin-course-schedule" target="_blank">
    <img src="https://img.shields.io/npm/v/koishi-plugin-course-schedule?style=flat-square" alt="npm version">
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

<p><b>💡 提示：</b>
  <a href="https://gitee.com/vincent-zyu/koishi-plugin-course-schedule" target="_blank">
    前往 Gitee README 获得更佳观感 →
    <i>https://gitee.com/vincent-zyu/koishi-plugin-course-schedule</i>
  </a>
</p>

<hr>

<details>
<summary><h2>📖 插件详细说明（点击展开）</h2></summary>

<h2>🎓 功能简介</h2>
<p>课程表插件 —— 群u在上什么课捏？支持多格式课表导入、个人课表查看、群课表纵览、本周上课排行和周课表视图。</p>

<h3>📥 支持导入的格式</h3>
<ul>
  <li><b>WakeUp 课程表</b> —— 直接发送 WakeUp 分享口令即可导入</li>
  <li><b>星链课表</b> —— 支持星链课表分享码和 JSON 格式</li>
  <li><b>拾光课表 / 原生 JSON</b> —— 粘贴课表 JSON 文本直接导入</li>
  <li><b>WakeUp 备份文件</b> —— 支持 <code>.wakeup_schedule</code> 备份文件导入</li>
  <li><b>ICS 文件/链接</b> —— 支持 <code>.ics</code> 文件上传或 ICS 链接下载解析</li>
</ul>

<h3>📋 可用命令</h3>
<table>
  <tr><th>命令</th><th>说明</th><th>示例</th></tr>
  <tr><td><code>课表.绑定 &lt;文本/文件&gt;</code></td><td>导入课表数据</td><td><code>课表.绑定 分享口令为「xxxxxxxx」</code></td></tr>
  <tr><td><code>课表.查看 [天]</code></td><td>查看个人某天课程</td><td><code>课表.查看 明天</code></td></tr>
  <tr><td><code>课表.群课表 [天]</code></td><td>查看本群所有人某天的课程</td><td><code>课表.群课表 周三</code></td></tr>
  <tr><td><code>课表.排行</code></td><td>查看本周本群上课时长排行榜</td><td><code>课表.排行</code></td></tr>
  <tr><td><code>课表.周课表 [周数]</code></td><td>查看个人周课表纵览</td><td><code>课表.周课表 12</code></td></tr>
</table>

<h3>🖼️ 渲染方式</h3>
<p>基于 <b>Puppeteer</b> 将 HTML 模板渲染为图片输出，支持自定义渲染等待策略和字体文件。</p>

<h3>📅 节假日支持</h3>
<p>内置 2026 年节假日数据，节假日自动提示休息消息，调休上班日正常显示课程。</p>

<h3>🎨 渲染颜色自定义</h3>
<p>在插件配置中可自定义以下颜色：</p>
<ul>
  <li><b>主题色</b> —— 左侧装饰竖线、周课表标题下划线</li>
  <li><b>卡片背景色</b> —— 个人课表课程卡片背景</li>
  <li><b>进行中标签色</b> —— 正在上课的状态标签</li>
  <li><b>下一节标签色</b> —— 即将开始的状态标签</li>
  <li><b>已结束标签色</b> —— 已结束的状态标签</li>
</ul>

<h3>📁 文件设置</h3>
<ul>
  <li>ICS 临时文件目录可自定义</li>
  <li>临时文件自动清理时间可配置</li>
</ul>

</details>

<hr>

<p><b>Koishi 插件：course-schedule</b> — 课程表，群u在上什么课捏</p>
`
