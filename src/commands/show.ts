import { h } from 'koishi'
import type { Context } from 'koishi'
import type { Config } from '../config'
import type { CourseScheduleServices } from '../services'
import type { NameMap } from '../services/schedule-service'
import { TABLE_NAME } from '../constants'
import { parseDayOffset } from '../utils/date'

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
      services.log('[show] 无法获取用户信息, userId=', userid)
    }
  } catch {
    services.log('[show] 无法获取用户信息, userId=', userid)
  }
  return nameMap
}

export function registerShowCommand(ctx: Context, config: Config, services: CourseScheduleServices) {
  ctx.command(`${config.baseCommand}.${config.showCommand} [day:text]`, `📋 查看自己某天的全部课程`)
    .action(async ({ session }, day) => {
      const dayOffset = parseDayOffset(day)
      const doQuote = config.enableQuote ? h.quote(session.messageId) : ''
      services.log('[show] 频道=', session.channelId, '用户=', session.userId, 'dayOffset=', dayOffset)

      const waitingHintMsgId = config.enableWatingHint
        ? (await session.send(`${doQuote}📋 正在渲染个人课表，请稍候... ⏳`))[0]
        : null

      const nameMap = await buildNameMap(ctx, session.channelId, session.userId, services)
      const img = await services.scheduleService.renderPersonalSchedule(session.channelId, session.userId, dayOffset, nameMap)
      services.log('[show] 渲染结果:', img ? '成功' : '无数据')

      waitingHintMsgId && session.bot.deleteMessage(session.channelId, waitingHintMsgId).catch(() => {})

      return img ? [doQuote, img] : `${doQuote}当前没有可渲染的课程数据。`
    })
}
