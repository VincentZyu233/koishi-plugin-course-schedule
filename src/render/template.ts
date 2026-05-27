import { FALLBACK_AVATAR } from '../constants'
import type { DayCourseView, RankingItem } from '../types'
import type { RenderColors } from '../config'
import { defaultColors } from '../config'

function esc(v: string) {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function ff(name: string) { return name ? `'${name}',` : '' }

function renderFooter(footerText: string, timestamp: string): string {
  const parts: string[] = []
  if (timestamp) parts.push(`<div class="ft">生成时间: ${esc(timestamp)}</div>`)
  if (footerText) parts.push(`<div class="ff">${esc(footerText)}</div>`)
  return parts.length ? `<div class="fw">${parts.join('\n')}</div>` : ''
}

function makeStatus(colors: RenderColors) {
  return {
    ongoing: { label: '进行中', bg: colors.statusOngoingColor, fg: '#FFFFFF' },
    next: { label: '下一节', bg: colors.statusNextColor, fg: '#FFFFFF' },
    finished: { label: '已结束', bg: colors.statusFinishedColor, fg: '#FFFFFF' },
    nocourse: { label: '无课程', bg: '#757575', fg: '#FFFFFF' },
  }
}

export function renderGroupScheduleTemplate(items: DayCourseView[], title: string, fontName = '', colors: RenderColors = defaultColors, logFn?: (...args: unknown[]) => void, footerText = '', timestamp = '') {
  const S = makeStatus(colors)
  if (logFn) logFn('[template] 群课表模板渲染: 共', items.length, '个 item')
  const rows = items.map((item, idx) => {
    const s = S[item.status]
    const y = 160 + idx * 120
    const summary = [item.courseName, item.location].filter(Boolean).join(' @ ')
    const timeInfo = [item.startTime && item.endTime ? `${item.startTime}-${item.endTime}` : '', item.statusDetail].filter(Boolean).join(' ')
    if (logFn) logFn(`[template]   item${idx}: summary="${summary}", timeInfo="${timeInfo}", status=${s.label}, bg=${s.bg}`)
    return `
    <div class="row" style="top:${y}px">
      <img class="av" src="${esc(item.useravatar || FALLBACK_AVATAR)}" alt="">
      <div class="ar"></div>
      <div class="nn" style="top:15px">${esc(item.username)}</div>
      <div class="mc" style="top:55px">
        <div class="mr">
          <div class="bd" style="background:${s.bg};color:${s.fg}">${s.label}</div>
          <div class="su">${esc(summary)}</div>
        </div>
        <div class="ti">${esc(timeInfo)}</div>
      </div>
    </div>`
  }).join('')
  const footerHtml = renderFooter(footerText, timestamp)
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;background:#FFF;font-family:${ff(fontName)}"Microsoft YaHei","PingFang SC",sans-serif;overflow:hidden}
.w{width:1200px;position:relative;min-height:${40 + 120 + items.length * 120 + 80 + (footerHtml ? 50 : 0)}px}
.ac{position:absolute;left:40px;top:40px;width:20px;height:60px;background:${colors.primaryColor};border-radius:0 4px 4px 0}
.tl{position:absolute;left:80px;top:40px;font-size:48px;font-weight:700;color:#000;white-space:nowrap}
.ul{position:absolute;left:80px;top:110px;width:300px;height:5px;background:#E0E0E0;border-radius:3px}
.row{position:absolute;left:0;right:0;height:120px}
.av{position:absolute;left:40px;top:20px;width:80px;height:80px;border-radius:50%;object-fit:cover;background:#e0e0e0}
.ar{position:absolute;left:140px;top:40px;width:0;height:0;border-top:20px solid transparent;border-bottom:20px solid transparent;border-left:30px solid #BDBDBD}
.nn{position:absolute;left:190px;font-size:32px;font-weight:700;color:#333;white-space:nowrap}
.mc{position:absolute;left:190px;display:flex;flex-direction:column;gap:4px}
.mr{display:flex;align-items:center;gap:10px}
.bd{font-size:24px;font-weight:700;padding:2px 10px;white-space:nowrap;border-radius:3px}
.su{font-size:24px;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:950px}
.ti{font-size:24px;color:#888;white-space:nowrap}
.fw{position:absolute;left:40px;bottom:20px;color:#888}
.ft{font-size:20px}
.ff{margin-top:4px;font-size:12px;white-space:pre-line}
</style></head><body>
<div class="w">
  <div class="ac"></div>
  <div class="tl">${esc(title)}</div>
  <div class="ul"></div>
  ${rows || '<div style="position:absolute;left:40px;top:160px;font-size:28px;color:#888">暂无课程</div>'}
  ${footerHtml}
</div></body></html>`
}

export function renderPersonalScheduleTemplate(items: DayCourseView[], title: string, timestamp: string, fontName = '', colors: RenderColors = defaultColors, footerText = '') {
  const cards = items.map(item => {
    const lines = [item.courseName, item.location].filter(Boolean)
    const extra = [item.startTime && item.endTime ? `${item.startTime}-${item.endTime}` : '', item.statusDetail].filter(Boolean).join(' ')
    return `
    <div class="cd">
      <div class="ct">${item.startTime && item.endTime ? `${item.startTime}-${item.endTime}` : ''}</div>
      ${lines.map(p => `<div class="cl">${esc(p)}</div>`).join('')}
      ${extra ? `<div class="cl cm">${esc(extra)}</div>` : ''}
    </div>`
  }).join('')
  const footerHtml = renderFooter(footerText, timestamp)
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1000px;background:#FFF;font-family:${ff(fontName)}"Microsoft YaHei","PingFang SC",sans-serif;overflow:hidden;padding:40px}
.ht{font-size:40px;font-weight:700;color:#000;margin-bottom:20px}
.cd{background:${colors.cardBgColor};border-radius:10px;padding:15px 20px;margin-bottom:5px}
.ct{font-size:28px;font-weight:700;color:#000;margin-bottom:8px}
.cl{font-size:22px;color:#333;margin-bottom:4px}
.cl.cm{color:#888}
.fw{margin-top:15px;color:#888}
.ft{font-size:22px}
.ff{margin-top:4px;font-size:14px;white-space:pre-line}
</style></head><body>
<div class="ht">${esc(title)}</div>
${cards || '<div class="cd"><div class="cl">暂无课程</div></div>'}
${footerHtml}
</body></html>`
}

export function renderRankingTemplate(items: RankingItem[], dateRange: string, fontName = '', footerText = '', timestamp = '') {
  const rows = items.map((item, i) => {
    const r = i + 1
    const c = r === 1 ? '#FBBF24' : r === 2 ? '#9CA3AF' : r === 3 ? '#F59E0B' : '#374151'
    const h = Math.floor(item.totalMinutes / 60)
    const m = item.totalMinutes % 60
    return `
    <div class="rr${i % 2 === 1 ? ' e' : ''}">
      <div class="rn" style="color:${c}">${r}</div>
      <img class="ra" src="${esc(item.useravatar || FALLBACK_AVATAR)}" alt="">
      <div class="rnm">${esc(item.username)}</div>
      <div class="rs"><div class="rd">${h}h ${m}m</div><div class="rc">${item.courseCount} 节</div></div>
    </div>`
  }).join('')
  const footerHtml = renderFooter(footerText, timestamp)
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;background:#FFF;font-family:${ff(fontName)}"Microsoft YaHei","PingFang SC",sans-serif;overflow:hidden;padding:60px}
.rt{font-size:48px;font-weight:700;color:#1F2937}
.rsb{font-size:24px;color:#6B7280;margin-top:10px;margin-bottom:10px}
.rr{height:120px;display:flex;align-items:center}
.rr.e{background:#F9FAFB;border-radius:8px}
.rn{width:80px;text-align:center;font-size:36px;font-weight:800}
.ra{width:80px;height:80px;border-radius:50%;object-fit:cover;background:#e0e0e0;margin:0 30px}
.rnm{flex:1;font-size:28px;color:#374151;font-weight:600}
.rs{text-align:right;margin-right:20px}
.rd{font-size:28px;color:#374151;font-weight:600}
.rc{font-size:24px;color:#6B7280;margin-top:4px}
.fw{margin-top:20px;color:#888}
.ft{font-size:20px}
.ff{margin-top:4px;font-size:12px;white-space:pre-line}
</style></head><body>
<div class="rt">本周上课排行榜</div>
<div class="rsb">${esc(dateRange)}</div>
${rows || '<div style="font-size:28px;color:#888;margin-top:20px">本周暂无排行数据</div>'}
${footerHtml}
</body></html>`
}
