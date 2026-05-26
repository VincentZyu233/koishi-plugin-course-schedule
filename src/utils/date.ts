export function parseDayOffset(input?: string) {
  if (!input) return 0
  const n = Number(input)
  if (!Number.isNaN(n)) return n
  const map: Record<string, number> = {
    今天: 0,
    明天: 1,
    后天: 2,
    大后天: 3,
    昨天: -1,
    前天: -2,
    大前天: -3,
  }
  return map[input] ?? 0
}

export function getDayOffsetDate(dayOffset: number) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + dayOffset)
  return date
}

export function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function weekdayNameOfDate(date: Date) {
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
}

export function weekdayCodeToName(code: string) {
  const map: Record<string, string> = {
    MO: '周一',
    TU: '周二',
    WE: '周三',
    TH: '周四',
    FR: '周五',
    SA: '周六',
    SU: '周日',
  }
  return map[code.toUpperCase()] ?? code
}

export function isCourseActiveOnDate(
  course: { curriculumndate: string[]; startDate: string; endDate: string },
  date: Date,
  weekday: string,
) {
  const iso = toIsoDate(date)
  return iso >= course.startDate
    && iso <= course.endDate
    && (course.curriculumndate ?? []).includes(weekday)
}

export function formatDurationMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}小时${minutes}分钟`
  return `${minutes}分钟`
}

export function getWeekRange(baseDate: Date) {
  const date = new Date(baseDate)
  date.setHours(0, 0, 0, 0)
  const weekday = date.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  const monday = new Date(date)
  monday.setDate(date.getDate() + mondayOffset)

  const days = Array.from({ length: 7 }, (_, index) => {
    const current = new Date(monday)
    current.setDate(monday.getDate() + index)
    return {
      date: current,
      weekday: weekdayNameOfDate(current),
    }
  })

  return { days }
}
