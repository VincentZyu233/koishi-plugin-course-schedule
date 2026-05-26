import { Context, Schema } from 'koishi'
import path from 'path'
import { createCourseScheduleServices } from './services'
import { registerBindCommand } from './commands/bind'
import { registerGroupCommand } from './commands/group'
import { registerRankingCommand } from './commands/ranking'
import { registerShowCommand } from './commands/show'
import { IcsFileService } from './services/ics-file'
import { IcsWatcher } from './services/ics-watcher'

export const name = 'course-schedule'
export const inject = {
  required: ['database', 'puppeteer', 'http'],
}
export const usage = '课程表插件，支持 WakeUp 导入、个人课表、群课表和本周排行。'

export interface Config {
  baseCommand: string
  bindCommand: string
  showCommand: string
  groupCommand: string
  rankingCommand: string
  renderWaitUntil: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
  verboseConsoleLog: boolean
  icsTempDir: string
  icsTempDeleteTime: number
  textFontPath: string
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    baseCommand: Schema.string().default('课表').description('父级指令名称'),
    bindCommand: Schema.string().default('绑定').description('绑定课表命令名'),
    showCommand: Schema.string().default('查看').description('查看个人课表命令名'),
    groupCommand: Schema.string().default('群课表').description('查看群友课表命令名'),
    rankingCommand: Schema.string().default('排行').description('查看本周排行命令名'),
  }).description('⚙️ 指令设置'),

  Schema.object({
    renderWaitUntil: Schema.union([
      Schema.const('load').description('[load]等待页面与静态资源加载完成，适合当前纯本地 HTML 渲染'),
      Schema.const('domcontentloaded').description('[domcontentloaded]只等待 DOM 构建完成，速度快但更容易过早截图'),
      Schema.const('networkidle0').description('[networkidle0]等待网络连接归零，适合依赖外部资源的页面'),
      Schema.const('networkidle2').description('[networkidle2]等待网络基本空闲，介于 load 与 networkidle0 之间'),
    ]).default('load').description('🖼️ Puppeteer setContent 的 waitUntil 策略'),
    textFontPath: Schema.string().default('').role('textarea', { rows: [2, 5] }).description('🔤 文字字体文件路径（绝对路径，留空则使用系统默认字体）'),
  }).description('🖼️ 渲染设置'),

  Schema.object({
    icsTempDir: Schema.string().default(path.resolve(__dirname, '..', 'tmp')).role('textarea', { rows: [2, 5] }).description('📁 ICS 临时文件目录（绝对路径）'),
    icsTempDeleteTime: Schema.number().default(300).description('🗑️ 临时 ICS 文件删除时间（秒），0 或负数表示永不删除'),
  }).description('📁 文件设置'),

  Schema.object({
    verboseConsoleLog: Schema.boolean().default(false).description('📋 详细控制台调试日志'),
  }).description('🐛 调试设置'),
])

export function apply(ctx: Context, config: Config) {
  const services = createCourseScheduleServices(ctx, config)
  const icsFileService = new IcsFileService(ctx, config.icsTempDir, config.icsTempDeleteTime, services.log)
  const icsWatcher = new IcsWatcher(ctx, services.log)

  ctx.on('ready', async () => {
    await services.dataManager.ensureStorage()
    services.registerDatabase()
    registerBindCommand(ctx, config, services, icsFileService, icsWatcher)
    registerShowCommand(ctx, config, services)
    registerGroupCommand(ctx, config, services)
    registerRankingCommand(ctx, config, services)
  })

  ctx.on('dispose', () => {
    icsFileService.dispose()
    icsWatcher.dispose()
  })
}
