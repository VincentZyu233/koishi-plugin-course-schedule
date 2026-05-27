import { h, Context } from 'koishi'
import type { Config } from '../config'
import type { CourseScheduleServices } from '../services'
import type { TargetUser } from '../types'
import { IcsFileService } from '../services/ics-file'
import { IcsWatcher } from '../services/ics-watcher'
import { StarlinkParser } from '../services/starlink-parser'
import { JsonParser } from '../services/json-parser'
import { WakeupFileParser } from '../services/wakeup-file-parser'

const starlinkParser = new StarlinkParser()
const jsonParser = new JsonParser()
const wakeupFileParser = new WakeupFileParser()

export function registerBindCommand(
  ctx: Context, config: Config, services: CourseScheduleServices,
  icsFileService: IcsFileService, icsWatcher: IcsWatcher,
) {
  ctx.command(`${config.baseCommand}.${config.bindCommand} [text:text]`, `📥 导入课表捏`)
    .example(`${config.baseCommand}.${config.bindCommand} 这是来自「WakeUp课程表」的课表分享......分享口令为「xxxxxxxx」`)
    .example(`${config.baseCommand}.${config.bindCommand} https://example.com/course.ics`)
    .action(async ({ session }, text) => {
      const targetUser: TargetUser = {
        userId: session.userId,
        username: session.username || session.userId,
        useravatar: session.event.user?.avatar ?? '',
      }

      let sourceText = (text || '').trim()
      let fileName = ''

      if (!sourceText) {
        const fileInfo = extractFileUrlFromMessage(session)
        if (fileInfo) {
          services.log('[bind] 从当前消息提取到文件附件:', fileInfo.filename)
          fileName = fileInfo.filename
          const localPath = await icsFileService.download(fileInfo.url)
          sourceText = await icsFileService.readFile(localPath)
        } else {
          const pending = icsWatcher.consume(session.userId)
          if (pending) {
            services.log('[bind] 从中间件缓存提取到文件附件:', pending.filename)
            fileName = pending.filename
            const localPath = await icsFileService.download(pending.url)
            sourceText = await icsFileService.readFile(localPath)
          }
        }
      }

      if (!sourceText) {
        services.log('[bind] 无直接参数，进入交互式等待')
        await session.send('请发送 WakeUp 分享文本、ICS 文本、课表 JSON，或附带 .ics/.json/.wakeup_schedule 文件。')
        const promptResult = await (session as any).prompt(60000)

        if (promptResult) {
          const rawText = String(promptResult).trim()
          const cqUrl = extractIcsFromCqCode(rawText)
          if (cqUrl) {
            services.log('[bind] 交互式收到 CQ 文件码，提取到附件 URL')
            const localPath = await icsFileService.download(cqUrl)
            sourceText = await icsFileService.readFile(localPath)
          } else {
            sourceText = rawText
            services.log('[bind] 交互式收到文本, length=', sourceText.length)
          }
        } else {
          const pending = icsWatcher.consume(session.userId)
          if (pending) {
            services.log('[bind] 交互式等待期间捕获到文件:', pending.filename)
            fileName = pending.filename
            const localPath = await icsFileService.download(pending.url)
            sourceText = await icsFileService.readFile(localPath)
          } else {
            services.log('[bind] 交互式等待超时')
            const doQuote = config.enableQuote ? h.quote(session.messageId) : ''
            return `${doQuote}操作超时，请重新绑定。`
          }
        }
      }

      const courses = await parseSourceText(sourceText, fileName, session.channelId, targetUser, services, ctx)
      if (!courses.length) {
        services.log('[bind] 解析结果为空，无法导入')
        const doQuote = config.enableQuote ? h.quote(session.messageId) : ''
        return `${doQuote}没有解析出可导入课程。请检查格式是否正确。`
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

      const doQuote = config.enableQuote ? h.quote(session.messageId) : ''
      return [doQuote, `✅ 已导入 ${courses.length} 门课程。`]
    })
}

async function parseSourceText(
  sourceText: string,
  fileName: string,
  channelId: string,
  targetUser: TargetUser,
  services: CourseScheduleServices,
  ctx: Context,
): Promise<any[]> {
  const trimmed = sourceText.trim()

  // 1. WakeUp 分享口令
  const shareKey = services.icsParser.parseWakeupShareKey(trimmed)
  if (shareKey) {
    services.log('[bind] 检测到 WakeUp 分享口令, key=', shareKey)
    const response = await ctx.http.get(
      `https://i.wakeup.fun/share_schedule/get?key=${shareKey}`,
      {
        headers: { 'User-Agent': 'okhttp/4.12.0' },
        timeout: 15000,
        responseType: 'json',
      },
    )
    if (response?.status !== 1 || !response?.data) {
      services.log('[bind] WakeUp API 返回异常:', response?.message)
      return []
    }
    const courses = services.icsParser.convertWakeupPayload(String(response.data), channelId, targetUser)
    services.log('[bind] WakeUp 解析完成, 课程数=', courses.length)
    return courses
  }

  // 2. 星链课表关键词
  if (trimmed.includes('星链课表') || trimmed.includes('starlinkkb')) {
    const codeMatch = trimmed.match(/「([A-Za-z0-9_-]{8,64})」/) || trimmed.match(/分享码[为：:]\s*([A-Za-z0-9_-]+)/)
    if (codeMatch?.[1]) {
      services.log('[bind] 检测到星链课表, code=', codeMatch[1])
      try {
        const courses = await starlinkParser.fetchAndParse(ctx, codeMatch[1], channelId, targetUser)
        services.log('[bind] 星链课表解析完成, 课程数=', courses.length)
        return courses
      } catch (e: any) {
        services.log('[bind] 星链课表 API 请求失败:', e.message)
        return []
      }
    }
  }

  // 3. JSON 文本（拾光 / 原生）
  if (trimmed.startsWith('{')) {
    let parsed: any
    try { parsed = JSON.parse(trimmed) } catch {}
    if (parsed) {
      if (starlinkParser.isStarlinkJson(parsed)) {
        services.log('[bind] 检测到星链课表 JSON')
        const courses = starlinkParser.convertStarlinkJson(parsed, channelId, targetUser)
        services.log('[bind] 星链 JSON 解析完成, 课程数=', courses.length)
        return courses
      }
      const jsonCourses = jsonParser.parseJsonText(trimmed, channelId, targetUser)
      if (jsonCourses) {
        services.log('[bind] JSON 课表解析完成, 课程数=', jsonCourses.length)
        return jsonCourses
      }
    }
  }

  // 4. WakeUp 备份文件
  if (fileName.endsWith('.wakeup_schedule') || isWakeupFileFormat(trimmed)) {
    services.log('[bind] 检测到 WakeUp 备份文件')
    const courses = wakeupFileParser.parseWakeupFileText(trimmed, channelId, targetUser)
    if (courses) {
      services.log('[bind] WakeUp 备份文件解析完成, 课程数=', courses.length)
      return courses
    }
  }

  // 5. ICS 文件/链接
  services.log('[bind] 未匹配到特殊格式，走 ICS 解析')
  let icsText = trimmed
  if (!/BEGIN:VCALENDAR/i.test(icsText) && /^https?:\/\//i.test(icsText)) {
    services.log('[bind] 检测到 ICS 链接，下载中...')
    icsText = await ctx.http.get(icsText, {
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Referer': 'https://qun.qq.com/',
      },
    }) as string
  }
  const courses = services.icsParser.parseIcsText(icsText, channelId, targetUser)
  services.log('[bind] ICS 解析完成, 课程数=', courses.length)
  return courses
}

function isWakeupFileFormat(text: string): boolean {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 5) return false
  try {
    JSON.parse(lines[1])
    JSON.parse(lines[2])
    JSON.parse(lines[3])
    JSON.parse(lines[4])
    return true
  } catch {
    return false
  }
}

interface FileInfo {
  url: string
  filename: string
}

function extractFileUrlFromMessage(session: any): FileInfo | null {
  const fromElements = extractFileFromElements(session.elements as any[])
  if (fromElements) return fromElements
  const fromCq = extractFileFromCqCode(session.content)
  if (fromCq) return fromCq
  return null
}

function extractFileFromElements(elements: any[] = []): FileInfo | null {
  for (const element of elements ?? []) {
    if (!element) continue
    const attrs = element.attrs ?? {}
    const url = attrs.src || attrs.url
    const fileName = attrs.file || attrs.name || attrs.title || ''
    if (typeof url === 'string' && url && fileName) {
      return { url, filename: String(fileName) }
    }
    if (Array.isArray(element.children) && element.children.length) {
      const nested = extractFileFromElements(element.children)
      if (nested) return nested
    }
  }
  return null
}

function extractFileFromCqCode(content: string): FileInfo | null {
  if (!content) return null
  const match = content.match(/\[CQ:file[^\]]*?file=([^,\]]+)[^\]]*?url=([^,\]]+)/)
  if (match) return { url: match[2], filename: match[1] }
  const match2 = content.match(/\[CQ:file[^\]]*?url=([^,\]]+)[^\]]*?file=([^,\]]+)/)
  if (match2) return { url: match2[1], filename: match2[2] }
  return null
}

function extractIcsFromCqCode(content: string): string {
  if (!content) return ''
  const match = content.match(/\[CQ:file[^\]]*?url=([^,\]]+)/)
  return match ? match[1] : ''
}
