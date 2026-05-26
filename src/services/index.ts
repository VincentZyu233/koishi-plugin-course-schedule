import type { Context } from 'koishi'
import type { Config } from '../index'
import { DataManager } from './data-manager'
import { ICSParser } from './ics-parser'
import { ScheduleService } from './schedule-service'
import { ImageGenerator } from '../render/image-generator'

export function createCourseScheduleServices(ctx: Context, config: Config) {
  const dataManager = new DataManager(ctx)
  const icsParser = new ICSParser()
  const imageGenerator = new ImageGenerator(ctx, config.textFontPath, config.renderWaitUntil)
  const scheduleService = new ScheduleService(ctx, dataManager, icsParser, imageGenerator)

  return {
    dataManager,
    icsParser,
    imageGenerator,
    scheduleService,
    registerDatabase() {
      dataManager.registerDatabase()
    },
    log(...args: unknown[]) {
      if (config.verboseConsoleLog) ctx.logger.info('[course-schedule]', ...args)
    },
  }
}

export type CourseScheduleServices = ReturnType<typeof createCourseScheduleServices>
