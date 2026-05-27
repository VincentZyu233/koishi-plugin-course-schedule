import type { Context } from 'koishi'
import { h } from 'koishi'
import type {} from 'koishi-plugin-puppeteer'
import fs from 'fs'
import path from 'path'
import {
  renderGroupScheduleTemplate,
  renderPersonalScheduleTemplate,
  renderRankingTemplate,
} from './template'
import { renderWeeklyScheduleTemplate } from './weekly-template'
import type { DayCourseView, RankingItem, WeeklyDayView } from '../types'
import type { RenderColors } from '../config'
import { defaultColors } from '../config'

export class ImageGenerator {
  private fontPath = ''
  private fontName = ''
  private fontBuffer: Buffer | null = null
  private verbose = false
  private colors: RenderColors

  constructor(
    private ctx: Context,
    fontPath: string,
    private waitUntil: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2' = 'load',
    verbose = false,
    colors?: RenderColors,
  ) {
    this.fontPath = fontPath
    this.verbose = verbose
    this.colors = colors ?? defaultColors
    if (!fontPath) return
    try {
      if (!fs.existsSync(fontPath)) {
        ctx.logger.warn('[course-schedule] 字体文件不存在，将使用系统默认字体:', fontPath)
        return
      }
      this.fontBuffer = fs.readFileSync(fontPath)
      this.fontName = path.basename(fontPath, path.extname(fontPath))
      ctx.logger.info(`[course-schedule] 字体已加载: ${this.fontName} (${(this.fontBuffer.length / 1024).toFixed(1)} KB)`)
    } catch (e: any) {
      ctx.logger.warn('[course-schedule] 字体加载失败，将使用系统默认字体:', fontPath, `(${e.message})`)
    }
  }

  async renderPersonalSchedule(items: DayCourseView[], targetDate: Date) {
    this.log('[render] 个人课表, 课程数=', items.length)
    const title = `我的课表 · ${targetDate.toLocaleDateString('zh-CN')}`
    const now = new Date()
    const footer = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    return this.renderHtml(renderPersonalScheduleTemplate(items, title, footer, this.fontName, this.colors), '个人课表')
  }

  async renderGroupSchedule(items: DayCourseView[], targetDate: Date) {
    this.log('[render] 群课表, 用户数=', items.length)
    const logFn = this.verbose ? (...args: unknown[]) => this.log('[render][verbose]', ...args) : undefined
    const html = renderGroupScheduleTemplate(items, '群友在上什么课?', this.fontName, this.colors, logFn)
    this.log('[render] 群课表HTML已生成, length=', html.length)
    return this.renderHtml(html, '群课表')
  }

  async renderRanking(items: RankingItem[], dateRange: string) {
    this.log('[render] 排行, 人数=', items.length)
    return this.renderHtml(renderRankingTemplate(items, dateRange, this.fontName), '排行')
  }

  async renderWeeklySchedule(nickname: string, week: number, dateRange: string, days: WeeklyDayView[]) {
    this.log('[render] 周课表, 周数=', week, '天数=', days.length)
    const now = new Date()
    const updateTime = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    return this.renderHtml(renderWeeklyScheduleTemplate(nickname, week, dateRange, days, updateTime, this.fontName, this.colors), '周课表')
  }

  private log(...args: unknown[]) {
    this.ctx.logger.info('[course-schedule]', ...args)
  }

  private async injectFont(page: any) {
    if (!this.fontBuffer || !this.fontName) return

    try {
      const base64 = this.fontBuffer.toString('base64')
      await page.addStyleTag({
        content: `@font-face{font-family:'${this.fontName}';src:url('data:font/truetype;base64,${base64}') format('truetype');font-display:swap}`,
      })
      this.ctx.logger.info(`[course-schedule] 字体已注入: ${this.fontName} (base64, ${(base64.length / 1024).toFixed(0)} KB)`)
      return
    } catch (e: any) {
      this.ctx.logger.info('[course-schedule] base64 注入失败，回退到 file://:', e.message)
    }

    const absPath = path.resolve(this.fontPath).replace(/\\/g, '/')
    try {
      await page.addStyleTag({
        content: `@font-face{font-family:'${this.fontName}';src:local('${this.fontName}'),url('file:///${absPath}') format('truetype');font-display:swap}`,
      })
      this.ctx.logger.info(`[course-schedule] 字体通过 file:// 协议注入: ${this.fontName}`)
    } catch (e: any) {
      this.ctx.logger.warn('[course-schedule] file:// 字体注入也失败，使用系统字体:', e.message)
    }
  }

  private async waitForFontReady(page: any) {
    if (!this.fontName) return
    try {
      await page.evaluate(async (fontName: string) => {
        if (!('fonts' in document)) return
        await document.fonts.load(`16px "${fontName}"`)
        await document.fonts.ready
      }, this.fontName)
      this.ctx.logger.info(`[course-schedule] 字体已完成加载并可用于渲染: ${this.fontName}`)
    } catch (e: any) {
      this.ctx.logger.warn('[course-schedule] 等待字体渲染就绪失败，继续使用当前页面状态截图:', e.message)
    }
  }

  private async renderHtml(html: string, label: string) {
    if (!this.ctx.puppeteer) {
      this.log('[render]', label, '- puppeteer 不可用')
      return null
    }
    if (this.verbose) {
      this.log('[render][verbose]', label, '- HTML 前500字符:', html.substring(0, 500))
    }
    let page = null
    try {
      page = await this.ctx.puppeteer.page()
      this.log('[render]', label, '- 页面已创建')
      await page.setContent(html, { waitUntil: this.waitUntil, timeout: 30000 })
      this.log('[render]', label, `- setContent 完成(waitUntil=${this.waitUntil})`)
      await this.injectFont(page)
      await this.waitForFontReady(page)
      const el = await page.$('body')
      if (!el) {
        this.log('[render]', label, '- body 元素未找到')
        return null
      }
      const img = await el.screenshot({ type: 'png' })
      this.log('[render]', label, '- 截图完成, size=', img?.byteLength ?? 0)
      return h.image(img, 'image/png')
    } finally {
      if (page) {
        await page.close().catch(() => {})
        this.log('[render]', label, '- 页面已关闭')
      }
    }
  }
}
