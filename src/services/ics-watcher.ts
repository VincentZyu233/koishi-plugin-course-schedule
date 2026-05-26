import { Context, h } from 'koishi'

interface PendingFile {
  url: string
  filename: string
  time: number
}

export class IcsWatcher {
  private pendingFiles = new Map<string, PendingFile>()
  private cleanupTimer: ReturnType<Context['setTimeout']>

  constructor(
    private ctx: Context,
    private log: (...args: unknown[]) => void,
  ) {
    this.registerMiddleware()
    this.cleanupTimer = ctx.setInterval(() => this.cleanupStale(), 60_000)
  }

  private registerMiddleware() {
    this.ctx.middleware(async (session, next) => {
      const elements = h.parse(session.content)
      for (const el of elements) {
        if (el.type === 'file') {
          const fileName = el.attrs?.file ?? ''
          const url = el.attrs?.src ?? ''
          if (String(fileName).endsWith('.ics') && typeof url === 'string' && url) {
            this.log('[ics-watcher] 拦截到 ICS 文件:', fileName)
            this.pendingFiles.set(session.userId, {
              url,
              filename: String(fileName),
              time: Date.now(),
            })
          }
        }
      }
      return next()
    })
  }

  consume(userId: string): PendingFile | null {
    const entry = this.pendingFiles.get(userId)
    if (!entry) return null
    this.pendingFiles.delete(userId)
    return entry
  }

  private cleanupStale() {
    const cutoff = Date.now() - 5 * 60_000
    for (const [key, val] of this.pendingFiles) {
      if (val.time < cutoff) this.pendingFiles.delete(key)
    }
  }

  dispose() {
    clearInterval(this.cleanupTimer as any)
    this.pendingFiles.clear()
  }
}
