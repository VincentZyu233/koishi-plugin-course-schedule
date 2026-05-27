import { h } from 'koishi'
import type { Context } from 'koishi'
import type { Config } from '../config'
import type { CourseScheduleServices } from '../services'
import { parseDayOffset } from '../utils/date'

export function registerShowCommand(ctx: Context, config: Config, services: CourseScheduleServices) {
  ctx.command(`${config.baseCommand}.${config.showCommand} [day:text]`, `查看自己某天的全部课程`)
    .action(async ({ session }, day) => {
      const dayOffset = parseDayOffset(day)
      services.log('[show] 频道=', session.channelId, '用户=', session.userId, 'dayOffset=', dayOffset)
      const img = await services.scheduleService.renderPersonalSchedule(session.channelId, session.userId, dayOffset)
      services.log('[show] 渲染结果:', img ? '成功' : '无数据')
      const quote = config.enableQuote ? h.quote(session.messageId) : ''
      return img ? [quote, img] : `${quote}当前没有可渲染的课程数据。`
    })
}
