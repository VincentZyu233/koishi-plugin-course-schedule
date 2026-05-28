import { h } from 'koishi'
import type { Context } from 'koishi'
import type { Config } from '../config'
import type { CourseScheduleServices } from '../services'
import type { NameMap } from '../services/schedule-service'
import { TABLE_NAME } from '../constants'

async function buildNameMap(ctx: Context, channelId: string, userid: string, services: CourseScheduleServices): Promise<NameMap> {
  const nameMap: NameMap = new Map()
  try {
    try {
      const member = await ctx.bots[0].getGuildMember(channelId.replace('group-', ''), userid)
      if (member?.user?.name || member?.nick) {
        nameMap.set(userid, {
          username: member.user?.name ?? userid,
          nickname: member.nick ?? '',
        })
      }
    } catch {
      services.log('[week] 无法获取用户信息, userId=', userid)
    }
  } catch {
    services.log('[week] 无法获取用户信息, userId=', userid)
  }
  return nameMap
}

export function registerWeekCommand(ctx: Context, config: Config, services: CourseScheduleServices) {
  ctx.command(`${config.baseCommand}.${config.weekCommand} [week:text]`, `📅 获取某人某个周的全部课程`)
    .action(async ({ session }, week) => {
      let weekNumber: number | undefined
      if (week) {
        const trimmed = week.trim()
        if (trimmed === '本周' || trimmed === '这周') {
          weekNumber = undefined
        } else if (trimmed === '上周') {
          weekNumber = -1
        } else if (trimmed === '下周') {
          weekNumber = -2
        } else {
          const n = Number(trimmed)
          if (!Number.isNaN(n) && n > 0) {
            weekNumber = n
          }
        }
      }

      const doQuote = config.enableQuote ? h.quote(session.messageId) : ''

      if (weekNumber === -1 || weekNumber === -2) {
        return `${doQuote}上周/下周功能需要记录学期开始日期，暂未实现。请使用 "课表.周课表 5" 指定周数。`
      }

      const waitingHintMsgId = config.enableWatingHint
        ? (await session.send(`${doQuote}📅 正在渲染周课表，请稍候... ⏳`))[0]
        : null

      const nameMap = await buildNameMap(ctx, session.channelId, session.userId, services)
      const img = await services.scheduleService.renderWeeklySchedule(session.channelId, session.userId, weekNumber, nameMap)
      services.log('[week] 渲染结果:', img ? '成功' : '无数据')

      waitingHintMsgId && session.bot.deleteMessage(session.channelId, waitingHintMsgId).catch(() => {})

      if (typeof img === 'string') return `${doQuote}${img}`
      return img ? [doQuote, img] : `${doQuote}当前没有可渲染的课程数据。`
    })
}
