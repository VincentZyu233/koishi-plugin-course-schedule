import { h } from 'koishi'
import type { Context } from 'koishi'
import type { Config } from '../config'
import type { CourseScheduleServices } from '../services'
import type { NameMap } from '../services/schedule-service'
import { TABLE_NAME } from '../constants'

async function buildNameMap(ctx: Context, channelId: string, services: CourseScheduleServices): Promise<NameMap> {
  const nameMap: NameMap = new Map()
  try {
    const courses = await (ctx.database.get(TABLE_NAME, { channelId }) as Promise<{ userid: string; username: string; nickname?: string }[]>)
    const uniqueUserIds = [...new Set(courses.map(c => c.userid))]
    for (const uid of uniqueUserIds) {
      try {
        const member = await ctx.bots[0].getGuildMember(channelId.replace('group-', ''), uid)
        if (member?.user?.name || member?.nick) {
          nameMap.set(uid, {
            username: member.user?.name ?? courses.find(c => c.userid === uid)?.username ?? uid,
            nickname: member.nick ?? '',
          })
        }
      } catch {
        services.log('[ranking] 无法获取用户信息, userId=', uid)
      }
    }
  } catch {
    services.log('[ranking] 无法获取课程列表, channelId=', channelId)
  }
  return nameMap
}

export function registerRankingCommand(ctx: Context, config: Config, services: CourseScheduleServices) {
  ctx.command(`${config.baseCommand}.${config.rankingCommand}`, `📊 查看本周本群上课排行榜`)
    .action(async ({ session }) => {
      const doQuote = config.enableQuote ? h.quote(session.messageId) : ''
      services.log('[ranking] 频道=', session.channelId)

      const waitingHintMsgId = config.enableWatingHint
        ? (await session.send(`${doQuote}📊 正在渲染排行榜，请稍候... ⏳`))[0]
        : null

      const nameMap = await buildNameMap(ctx, session.channelId, services)
      const img = await services.scheduleService.renderWeeklyRanking(session.channelId, nameMap)
      services.log('[ranking] 渲染结果:', img ? '成功' : '无数据')

      waitingHintMsgId && session.bot.deleteMessage(session.channelId, waitingHintMsgId).catch(() => {})

      return img ? [doQuote, img] : `${doQuote}当前群组没有排行数据。`
    })
}
