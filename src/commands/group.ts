import type { Context } from 'koishi'
import type { Config } from '../index'
import type { CourseScheduleServices } from '../services'
import { parseDayOffset } from '../utils/date'

export function registerGroupCommand(ctx: Context, config: Config, services: CourseScheduleServices) {
  ctx.command(`${config.baseCommand}.${config.groupCommand} [day:text]`, `获取本群所有群u某天的全部课程`)
    .action(async ({ session }, day) => {
      const dayOffset = parseDayOffset(day)
      services.log('[group] 频道=', session.channelId, 'dayOffset=', dayOffset)
      const img = await services.scheduleService.renderChannelSchedule(session.channelId, dayOffset)
      services.log('[group] 渲染结果:', img ? '成功' : '无数据')
      return img ?? '当前群组没有可渲染的课程数据。'
    })
}
