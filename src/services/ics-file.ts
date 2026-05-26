import { Context } from 'koishi'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'

export class IcsFileService {
  private trackedFiles = new Set<string>()
  private timers: ReturnType<Context['setTimeout']>[] = []

  constructor(
    private ctx: Context,
    private tmpDir: string,
    private deleteTime: number,
    private log: (...args: unknown[]) => void,
  ) {}

  async ensureDir() {
    await fs.mkdir(this.tmpDir, { recursive: true })
  }

  async download(url: string): Promise<string> {
    await this.ensureDir()
    const filename = `ics_${crypto.randomBytes(4).toString('hex')}.ics`
    const filePath = path.join(this.tmpDir, filename)
    this.log('[ics-file] 下载 ICS 文件:', url.substring(0, 80))
    const file = await this.ctx.http.file(url)
    const buffer = Buffer.from(file.data)
    await fs.writeFile(filePath, buffer)
    this.log('[ics-file] 已保存到:', filePath, `(${(buffer.length / 1024).toFixed(1)} KB)`)
    this.trackedFiles.add(filePath)
    this.scheduleCleanup(filePath)
    return filePath
  }

  async readFile(localPath: string): Promise<string> {
    return fs.readFile(localPath, 'utf-8')
  }

  private scheduleCleanup(filePath: string) {
    if (this.deleteTime <= 0) return
    const timer = this.ctx.setTimeout(async () => {
      await this.safeUnlink(filePath)
      this.trackedFiles.delete(filePath)
    }, this.deleteTime * 1000)
    this.timers.push(timer)
  }

  private async safeUnlink(filePath: string, maxRetries = 5, interval = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await fs.access(filePath)
        await fs.unlink(filePath)
        this.log('[ics-file] 已删除:', filePath)
        return
      } catch (err: any) {
        if (err.code === 'ENOENT') return
        if (err.code === 'EBUSY') {
          await new Promise(r => setTimeout(r, interval))
          continue
        }
        throw err
      }
    }
  }

  dispose() {
    for (const timer of this.timers) {
      clearTimeout(timer as any)
    }
    this.timers = []
    for (const filePath of this.trackedFiles) {
      this.safeUnlink(filePath).catch(() => {})
    }
    this.trackedFiles.clear()
  }
}
