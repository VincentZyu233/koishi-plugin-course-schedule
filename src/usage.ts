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

<blockquote>
<p><b>⚠️ 兼容性说明</b>（更新于 2026-05-27，可能有时效性）</p>

<p><img src="https://gitee.com/vincent-zyu/koishi-plugin-course-schedule/raw/main/docs/images/%E4%B8%89%E4%B8%AA%E8%AF%BE%E7%A8%8B%E8%A1%A8app%E5%9B%BE%E6%A0%87.%E6%98%9F%E9%93%BE.%E6%8B%BE%E5%85%89.WakeUp.png" alt="三个课程表app图标" width="400"></p>

<ul>
  <li>
    <b>WakeUp 课程表</b> — 旧版安卓 App 使用 v1 API（无鉴权），新版使用 v2 API（有鉴权）。<i>对于作者自己的学校教务网站</i>：
    <ul>
      <li>WakeUp 的课表导入很顺利</li>
      <li>但口令导出功能在最新版 App 中不可用，需要降级到旧版本</li>
      <li>据说 <b>≥ 6.1.x 的版本均不行，6.0.x 及以下版本可以</b></li>
      <li>作者暂时不清楚新旧版本的确切分水岭，推测大概率是 <b>6.0.x 与 6.1.x</b> 之间</li>
    </ul>
    <p>因此在不同的导入方案中，<b>最佳选择是降级 WakeUp 到作者同款版本</b>（作者实测确认可用）：<br>
    作者使用的版本：<b>6.0.23</b></p>
    <p>
      <a href="https://github.com/VincentZyuApps/koishi-plugin-course-schedule/releases/download/WakeUp6.0.23/WakeUp_6.0.23.apk" target="_blank">
        <img src="https://img.shields.io/badge/Release_APK-GitHub-181717?style=flat-square&logo=github" alt="GitHub Release APK">
      </a>
      &nbsp;
      <a href="https://gitee.com/vincent-zyu/koishi-plugin-course-schedule/releases/download/WakeUp6.0.23/WakeUp_6.0.23.apk" target="_blank">
        <img src="https://img.shields.io/badge/Release_APK-Gitee-C71D23?style=flat-square&logo=gitee" alt="Gitee Release APK">
      </a>
    </p>
  </li>
  <li>
    <b>星链课表</b> — <i>对于作者自己的学校教务网站</i>：没有直接的学校教务导入选项，通用的 AI 导入工具也无法使用。作者目前的导入方式：浏览器 F12 下载课表 HTML 数据 → 让 AI（如 OpenCode / Codex / Gemini）参考本地 HTML 结构与课表截图识别，生成符合星链 JSON 格式的文件 → 复制 JSON → 星链 App 右上角「+」→ 一键导课 → 粘贴 JSON → 点击 AI 解析即可完成导入。
  </li>
  <li>
    <b>拾光课程表</b> — 作者暂时无法成功导入
  </li>
</ul>

<p>如果你遇到了导入问题，欢迎加群反馈，帮助逐步完善适配 🙏 艾特作者回复更快哦~ @VincentZyu</p>
</blockquote>

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

`;
