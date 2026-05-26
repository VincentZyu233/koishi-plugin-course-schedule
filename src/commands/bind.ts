import { Context } from 'koishi'
import axios from 'axios'
import type { Config } from '../index'
import type { CourseScheduleServices } from '../services'
import type { TargetUser } from '../types'
import { IcsFileService } from '../services/ics-file'
import { IcsWatcher } from '../services/ics-watcher'

export function registerBindCommand(
  ctx: Context, config: Config, services: CourseScheduleServices,
  icsFileService: IcsFileService, icsWatcher: IcsWatcher,
) {
  ctx.command(`${config.baseCommand}.${config.bindCommand} [text:text]`)
    .example(`${config.baseCommand}.${config.bindCommand} 这是来自「WakeUp课程表」的课表分享......分享口令为「xxxxxxxx」`)
    .example(`${config.baseCommand}.${config.bindCommand} https://example.com/course.ics`)
    .action(async ({ session }, text) => {
      const targetUser: TargetUser = {
        userId: session.userId,
        username: session.username || session.userId,
        useravatar: session.event.user?.avatar ?? '',
      }

      let sourceText = (text || '').trim()

      if (!sourceText) {
        const fileUrl = extractIcsFileUrlFromMessage(session)
        if (fileUrl) {
          services.log('[bind] 从当前消息提取到 ICS 附件 URL')
          const localPath = await icsFileService.download(fileUrl)
          sourceText = await icsFileService.readFile(localPath)
        } else {
          const pending = icsWatcher.consume(session.userId)
          if (pending) {
            services.log('[bind] 从中间件缓存提取到 ICS 附件 URL:', pending.filename)
            const localPath = await icsFileService.download(pending.url)
            sourceText = await icsFileService.readFile(localPath)
          }
        }
      }

      if (!sourceText) {
        services.log('[bind] 无直接参数，进入交互式等待')
        await session.send('请发送 WakeUp 分享文本、ICS 文本，或附带 `.ics` 文件/链接。')
        const promptResult = await (session as any).prompt(60000)

        if (promptResult) {
          const rawText = String(promptResult).trim()
          const cqUrl = extractIcsFromCqCode(rawText)
          if (cqUrl) {
            services.log('[bind] 交互式收到 CQ 文件码，提取到 ICS 附件 URL')
            const localPath = await icsFileService.download(cqUrl)
            sourceText = await icsFileService.readFile(localPath)
          } else {
            sourceText = rawText
            services.log('[bind] 交互式收到文本, length=', sourceText.length)
          }
        } else {
          const pending = icsWatcher.consume(session.userId)
          if (pending) {
            services.log('[bind] 交互式等待期间捕获到 ICS 文件:', pending.filename)
            const localPath = await icsFileService.download(pending.url)
            sourceText = await icsFileService.readFile(localPath)
          } else {
            services.log('[bind] 交互式等待超时')
            return '操作超时，请重新绑定。'
          }
        }
      }

      let courses = []
      const shareKey = services.icsParser.parseWakeupShareKey(sourceText)
      if (shareKey) {
        services.log('[bind] 检测到 WakeUp 分享口令, key=', shareKey)
        services.log('[bind] 请求 WakeUp API...')
        const axiosResp = await axios.get(
          `https://i.wakeup.fun/share_schedule/get?key=${shareKey}`,
          {
            headers: { 'User-Agent': 'okhttp/4.12.0' },
            timeout: 15000,
            responseType: 'json',
          },
        )
        const response = axiosResp.data
        services.log('[bind] WakeUp axios status=', axiosResp.status,
          'keys=', Object.keys(response ?? {}).join(','))

        services.log('[bind] WakeUp API 响应 status=', response?.status, 'message=', response?.message)
        if (response?.status !== 1 || !response?.data) {
          return `WakeUp 导入失败：${String(response?.message ?? '返回为空')}`
        }
        courses = services.icsParser.convertWakeupPayload(String(response.data), session.channelId, targetUser)
        services.log('[bind] WakeUp 解析完成, 课程数=', courses.length)
      } else {
        services.log('[bind] 未匹配到 WakeUp 口令，走 ICS 解析')
        let icsText = sourceText
        if (!/BEGIN:VCALENDAR/i.test(icsText) && /^https?:\/\//i.test(icsText)) {
          services.log('[bind] 检测到 ICS 链接，下载中...')
          icsText = await ctx.http.get(icsText, {
            responseType: 'text',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
              'Referer': 'https://qun.qq.com/',
            },
          }) as string
          services.log('[bind] ICS 文本下载完成, length=', icsText?.length ?? 0)
        }
        courses = services.icsParser.parseIcsText(icsText, session.channelId, targetUser)
        services.log('[bind] ICS 解析完成, 课程数=', courses.length)
      }

      if (!courses.length) {
        services.log('[bind] 解析结果为空，无法导入')
        return '没有解析出可导入课程。'
      }

      services.log('[bind] 开始写入数据库, 频道=', session.channelId, '用户=', session.userId)
      const removed = await ctx.database.remove('course_schedule', {
        channelId: session.channelId,
        userid: session.userId,
      })
      services.log('[bind] 清除旧数据, 受影响行数=', typeof removed === 'number' ? removed : 'unknown')

      for (const course of courses) {
        await ctx.database.create('course_schedule', course)
      }
      services.log('[bind] 写入完成, 共', courses.length, '门课程')

      return `已导入 ${courses.length} 门课程。`
    })
}

function extractIcsFileUrlFromMessage(session: any): string {
  const fromElements = extractIcsFromElements(session.elements as any[])
  if (fromElements) return fromElements
  const fromCq = extractIcsFromCqCode(session.content)
  if (fromCq) return fromCq
  return ''
}

function extractIcsFromElements(elements: any[] = []): string {
  for (const element of elements ?? []) {
    if (!element) continue
    const attrs = element.attrs ?? {}
    const url = attrs.src || attrs.url
    const fileName = attrs.file || attrs.name || attrs.title || ''
    if (typeof url === 'string' && (String(fileName).endsWith('.ics') || url.endsWith('.ics'))) {
      return url
    }
    if (Array.isArray(element.children) && element.children.length) {
      const nested = extractIcsFromElements(element.children)
      if (nested) return nested
    }
  }
  return ''
}

function extractIcsFromCqCode(content: string): string {
  if (!content) return ''
  const match = content.match(/\[CQ:file[^\]]*?url=([^,\]]+)/)
  return match ? match[1] : ''
}
