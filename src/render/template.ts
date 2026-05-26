import { FALLBACK_AVATAR } from '../constants'
import type { DayCourseView, RankingItem } from '../types'

function esc(v: string) {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

const S: Record<DayCourseView['status'], { label: string; bg: string; fg: string }> = {
  ongoing: { label: '进行中', bg: '#D32F2F', fg: '#FFFFFF' },
  next: { label: '下一节', bg: '#1976D2', fg: '#FFFFFF' },
  finished: { label: '已结束', bg: '#388E3C', fg: '#FFFFFF' },
  nocourse: { label: '无课程', bg: '#757575', fg: '#FFFFFF' },
}

function ff(name: string) { return name ? `'${name}',` : '' }

export function renderGroupScheduleTemplate(items: DayCourseView[], title: string, fontName = '', logFn?: (...args: unknown[]) => void) {
  if (logFn) logFn('[template] 群课表模板渲染: 共', items.length, '个 item')
  const rows = items.map((item, idx) => {
    const s = S[item.status]
    const y = 160 + idx * 120
    const summary = [item.courseName, item.location].filter(Boolean).join(' @ ')
    const timeInfo = [item.startTime && item.endTime ? `${item.startTime}-${item.endTime}` : '', item.statusDetail].filter(Boolean).join(' ')
  return `
    <div class="row" style="top:${y}px">
      <img class="av" src="${esc(item.useravatar || FALLBACK_AVATAR)}" alt="">
      <div class="ar"></div>
      <div class="nn" style="top:15px">${esc(item.username)}</div>
      <div class="bd" style="top:60px;background:${s.bg};color:${s.fg}">${s.label}</div>
      <div class="su" style="top:65px">${esc(summary)}</div>
      <div class="ti" style="top:95px">${esc(timeInfo)}</div>
    </div>`
  }).join('')

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;background:#FFF;font-family:${ff(fontName)}"Microsoft YaHei","PingFang SC",sans-serif;overflow:hidden}
.w{width:1200px;position:relative;min-height:${40 + 120 + items.length * 120 + 80}px}
.ac{position:absolute;left:40px;top:40px;width:20px;height:60px;background:#26A69A;border-radius:0 4px 4px 0}
.tl{position:absolute;left:80px;top:40px;font-size:48px;font-weight:700;color:#000;white-space:nowrap}
.ul{position:absolute;left:80px;top:110px;width:300px;height:5px;background:#A7FFEB;border-radius:3px}
.row{position:absolute;left:0;right:0;height:120px}
.av{position:absolute;left:40px;top:20px;width:80px;height:80px;border-radius:50%;object-fit:cover;background:#e0e0e0}
.ar{position:absolute;left:140px;top:40px;width:0;height:0;border-top:20px solid transparent;border-bottom:20px solid transparent;border-left:30px solid #BDBDBD}
.nn{position:absolute;left:190px;font-size:32px;font-weight:700;color:#333;white-space:nowrap}
.bd{position:absolute;left:190px;font-size:24px;font-weight:700;padding:2px 10px;white-space:nowrap}
.su{position:absolute;left:190px;font-size:24px;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:950px}
.ti{position:absolute;left:190px;font-size:24px;color:#888;white-space:nowrap}
</style></head><body>
<div class="w">
  <div class="ac"></div>
  <div class="tl">${esc(title)}</div>
  <div class="ul"></div>
  ${rows || '<div style="position:absolute;left:40px;top:160px;font-size:28px;color:#888">暂无课程</div>'}
</div></body></html>`
}

export function renderPersonalScheduleTemplate(items: DayCourseView[], title: string, footer: string, fontName = '') {
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

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1000px;background:#FFF;font-family:${ff(fontName)}"Microsoft YaHei","PingFang SC",sans-serif;overflow:hidden;padding:40px}
.ht{font-size:40px;font-weight:700;color:#000;margin-bottom:20px}
.cd{background:#E3F2FD;border-radius:10px;padding:15px 20px;margin-bottom:5px}
.ct{font-size:28px;font-weight:700;color:#000;margin-bottom:8px}
.cl{font-size:22px;color:#333;margin-bottom:4px}
.cl.cm{color:#888}
.ft{margin-top:15px;font-size:22px;color:#888}
</style></head><body>
<div class="ht">${esc(title)}</div>
${cards || '<div class="cd"><div class="cl">暂无课程</div></div>'}
<div class="ft">生成时间: ${esc(footer)}</div>
</body></html>`
}

export function renderRankingTemplate(items: RankingItem[], dateRange: string, fontName = '') {
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
</style></head><body>
<div class="rt">本周上课排行榜</div>
<div class="rsb">${esc(dateRange)}</div>
${rows || '<div style="font-size:28px;color:#888;margin-top:20px">本周暂无排行数据</div>'}
</body></html>`
}
