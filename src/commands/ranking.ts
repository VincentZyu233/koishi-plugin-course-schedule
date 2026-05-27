import type { Context } from 'koishi'
import type { Config } from '../config'
import type { CourseScheduleServices } from '../services'

export function registerRankingCommand(ctx: Context, config: Config, services: CourseScheduleServices) {
  ctx.command(`${config.baseCommand}.${config.rankingCommand}`, `查看本周本群上课排行榜`)
    .action(async ({ session }) => {
      services.log('[ranking] 频道=', session.channelId)
      const img = await services.scheduleService.renderWeeklyRanking(session.channelId)
      services.log('[ranking] 渲染结果:', img ? '成功' : '无数据')
      return img ?? '当前群组没有排行数据。'
    })
}
