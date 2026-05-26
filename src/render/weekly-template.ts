import type { WeeklyDayView } from '../types'

function esc(v: string) {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function ff(name: string) { return name ? `'${name}',` : '' }

export function renderWeeklyScheduleTemplate(
  nickname: string,
  week: number,
  dateRange: string,
  days: WeeklyDayView[],
  updateTime: string,
  fontName = '',
) {
  const dayBlocks = days.map((day) => {
    const holidayTag = day.isHoliday ? ` [${esc(day.holidayName)}]` : day.isWorkdayOnWeekend ? ` [${esc(day.holidayName)}]` : ''
    const todayTag = day.isToday ? ' (今天)' : ''

    const dayHeader = `<div class="dh">${esc(day.label)} ${esc(day.date)}${esc(holidayTag)}${esc(todayTag)}</div>`

    const courseItems = day.courses.map(course => {
      const info = [course.teacher, course.location].filter(Boolean).join(' @ ')
      const rescheduleTag = course.rescheduled ? `[调课·${esc(course.originalDate)}] ` : ''
      return `<div class="ci"><span class="ct">${esc(course.startTime)}-${esc(course.endTime)}</span><span class="cn">${esc(rescheduleTag)}${esc(course.name)}</span>${info ? `<span class="cf">${esc(info)}</span>` : ''}</div>`
    }).join('')

    const noCourses = day.courses.length === 0 ? '<div class="nc">无课程</div>' : ''

    return `<div class="db">${dayHeader}${courseItems || noCourses}</div>`
  }).join('')

  const totalHeight = 140 + days.length * 40 + days.reduce((sum, d) => sum + Math.max(d.courses.length, 1) * 40, 0) + 40

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;background:#FFF;font-family:${ff(fontName)}"Microsoft YaHei","PingFang SC",sans-serif;overflow:hidden;padding:40px}
.ac{width:20px;height:60px;background:#26A69A;border-radius:0 4px 4px 0;margin-bottom:16px}
.ht{font-size:48px;font-weight:700;color:#000;margin-bottom:8px}
.sb{font-size:24px;color:#888;margin-bottom:30px}
.dh{font-size:28px;font-weight:700;color:#000;padding:10px 0;border-bottom:2px solid #26A69A;margin-bottom:8px}
.ci{display:flex;align-items:center;padding:6px 0;border-bottom:1px solid #f0f0f0}
.ci:last-child{border-bottom:none}
.ct{flex:0 0 160px;font-size:24px;font-weight:700;color:#000}
.cn{flex:0 0 240px;font-size:22px;font-weight:600;color:#333}
.cf{flex:1;font-size:20px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nc{padding:8px 0;font-size:20px;color:#888}
.ft{margin-top:20px;font-size:20px;color:#888}
</style></head><body>
<div class="ac"></div>
<div class="ht">${esc(nickname)} 的每周课表</div>
<div class="sb">第 ${week} 周 · ${esc(dateRange)}</div>
${dayBlocks}
<div class="ft">生成时间: ${esc(updateTime)}</div>
</body></html>`
}
