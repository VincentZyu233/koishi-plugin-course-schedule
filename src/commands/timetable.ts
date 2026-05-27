import { h, Context } from 'koishi'
import type { Config } from '../config'
import type { CourseScheduleServices } from '../services'
import { TimeSlotManager, UserTimeSlot } from '../services/timeslot-manager'

export function registerTimetableCommand(
  ctx: Context,
  config: Config,
  services: CourseScheduleServices,
  timeSlotManager: TimeSlotManager,
) {
  ctx.command(`${config.baseCommand}.${config.timetableCommand} [text:text]`, '📅 设置星链时间表')
    .example(`${config.baseCommand}.${config.timetable} 请发送你的时间表 JSON`)
    .action(async ({ session }, text) => {
      const userId = session.userId

      if (!text) {
        await session.send(`${config.enableQuote ? h.quote(session.messageId) : ''}📥 请发送你的时间表 JSON 数据文本（星链课表导出的时间表格式）`)
        const promptResult = await (session as any).prompt(60000)

        if (promptResult) {
          text = String(promptResult).trim()
        } else {
          const doQuote = config.enableQuote ? h.quote(session.messageId) : ''
          return `${doQuote}操作超时，请重试。`
        }
      }

      services.log('[timetable] 收到用户时间表设置请求, userId=', userId)

      const timeSlots = parseTimetableJSON(text)
      if (!timeSlots) {
        services.log('[timetable] 解析失败, 无法识别时间表格式')
        const doQuote = config.enableQuote ? h.quote(session.messageId) : ''
        return `${doQuote}❌ 无法解析时间表 JSON，请检查格式是否正确。`
      }

      services.log('[timetable] 解析成功, 共', timeSlots.length, '个时间段:', JSON.stringify(timeSlots))
      await timeSlotManager.saveTimeSlots(userId, timeSlots)
      services.log('[timetable] 时间表已保存到缓存')
      const doQuote = config.enableQuote ? h.quote(session.messageId) : ''
      return `${doQuote}✅ 已保存 ${timeSlots.length} 个时间段。`
    })
}

function parseTimetableJSON(text: string): UserTimeSlot[] | null {
  const trimmed = text.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null

  let parsed: any
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return null
  }

  if (Array.isArray(parsed)) {
    return normalizeTimeSlots(parsed)
  }

  if (typeof parsed === 'object' && parsed !== null) {
    if ('timeSlots' in parsed && Array.isArray(parsed.timeSlots)) {
      return normalizeTimeSlots(parsed.timeSlots)
    }
    if ('items' in parsed && Array.isArray(parsed.items)) {
      return normalizeTimeSlots(parsed.items)
    }
    if ('data' in parsed && typeof parsed.data === 'object' && 'items' in parsed.data) {
      return normalizeTimeSlots(parsed.data.items)
    }

    const keys = Object.keys(parsed)
    if (keys.every(k => /^\d+$/.test(k))) {
      const slots: UserTimeSlot[] = []
      for (const [key, value] of Object.entries(parsed)) {
        const section = parseInt(key, 10)
        if (typeof value === 'object' && value !== null && 'start' in value && 'end' in value) {
          slots.push({
            section,
            startTime: String(value.start).slice(0, 5),
            endTime: String(value.end).slice(0, 5),
          })
        }
      }
      if (slots.length) return slots
    }
  }

  return null
}

function normalizeTimeSlots(items: any[]): UserTimeSlot[] | null {
  const slots: UserTimeSlot[] = []

  for (const item of items) {
    if (!item || typeof item !== 'object') continue

    const section = item.section ?? item.number ?? item.index ?? item.period ?? null
    if (section === null) continue

    let startTime: string | null = null
    let endTime: string | null = null

    if (item.startHour !== undefined && item.endHour !== undefined) {
      startTime = `${String(item.startHour).padStart(2, '0')}:${String(item.startMinute ?? 0).padStart(2, '0')}`
      endTime = `${String(item.endHour).padStart(2, '0')}:${String(item.endMinute ?? 0).padStart(2, '0')}`
    } else {
      startTime = item.startTime ?? item.start_time ?? item.start ?? item.begin ?? null
      endTime = item.endTime ?? item.end_time ?? item.end ?? null
    }

    if (startTime !== null && endTime !== null) {
      slots.push({
        section: parseInt(section, 10),
        startTime: String(startTime).slice(0, 5),
        endTime: String(endTime).slice(0, 5),
      })
    }
  }

  return slots.length ? slots : null
}
