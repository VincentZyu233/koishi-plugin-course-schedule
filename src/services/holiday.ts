import type { Context } from 'koishi'
import fs from 'fs'
import path from 'path'
import { HARDCODED_HOLIDAYS, type HolidayData, type HolidayEntry } from '../constants/holidays'

export interface HolidayInfo {
  isHoliday: boolean
  isWorkdayOnWeekend: boolean
  name: string
}

const API_URL = 'https://timor.tech/api/holiday/year'

export class HolidayService {
  private cacheDir: string
  private memoryCache = new Map<number, HolidayData['holiday']>()
  private logFn: (...args: unknown[]) => void

  constructor(ctx: Context, logFn: (...args: unknown[]) => void) {
    this.cacheDir = path.resolve(__dirname, '..', 'data', 'holidays')
    this.logFn = logFn
    this.ensureCacheDir()
  }

  private ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true })
    }
  }

  private cacheFilePath(year: number): string {
    return path.join(this.cacheDir, `${year}.json`)
  }

  async loadHolidayData(year: number): Promise<HolidayData['holiday'] | null> {
    if (this.memoryCache.has(year)) {
      this.logFn('[holiday] 使用内存缓存:', year)
      return this.memoryCache.get(year)!
    }

    const localPath = this.cacheFilePath(year)
    if (fs.existsSync(localPath)) {
      try {
        const raw = fs.readFileSync(localPath, 'utf8')
        const data = JSON.parse(raw) as HolidayData
        if (data.holiday && Object.keys(data.holiday).length > 0) {
          this.memoryCache.set(year, data.holiday)
          this.logFn('[holiday] 使用本地缓存文件:', year)
          return data.holiday
        }
      } catch (e) {
        this.logFn('[holiday] 本地缓存文件解析失败:', year, e)
      }
    }

    try {
      const resp = await this.fetchFromApi(year)
      if (resp && Object.keys(resp).length > 0) {
        this.memoryCache.set(year, resp)
        this.writeCacheFile(year, resp)
        this.logFn('[holiday] API 拉取成功:', year)
        return resp
      }
    } catch (e) {
      this.logFn('[holiday] API 拉取失败:', year, e)
    }

    const hardcoded = HARDCODED_HOLIDAYS[year]
    if (hardcoded && Object.keys(hardcoded.holiday).length > 0) {
      this.memoryCache.set(year, hardcoded.holiday)
      this.logFn('[holiday] 使用硬编码 fallback:', year)
      return hardcoded.holiday
    }

    this.logFn('[holiday] 无节假日数据:', year)
    return null
  }

  private async fetchFromApi(year: number): Promise<HolidayData['holiday'] | null> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)
    try {
      const url = `${API_URL}/${year}`
      const resp = await fetch(url, { signal: controller.signal })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json() as HolidayData
      return data?.holiday ?? null
    } finally {
      clearTimeout(timer)
    }
  }

  private writeCacheFile(year: number, holiday: HolidayData['holiday']) {
    try {
      const data: HolidayData = { code: 0, year, holiday }
      fs.writeFileSync(this.cacheFilePath(year), JSON.stringify(data, null, 2), 'utf8')
    } catch (e) {
      this.logFn('[holiday] 写入缓存文件失败:', year, e)
    }
  }

  async getHolidayInfoForDate(date: Date): Promise<HolidayInfo | null> {
    const year = date.getFullYear()
    const holidays = await this.loadHolidayData(year)
    if (!holidays) return null
    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const entry = holidays[monthDay]
    if (!entry) return null
    if (entry.holiday === true) {
      return { isHoliday: true, isWorkdayOnWeekend: false, name: entry.name }
    }
    if (entry.holiday === false) {
      return { isHoliday: false, isWorkdayOnWeekend: true, name: entry.name }
    }
    return null
  }

  async isHoliday(date: Date): Promise<boolean> {
    return (await this.getHolidayInfoForDate(date))?.isHoliday ?? false
  }

  async isWorkdayOnWeekend(date: Date): Promise<boolean> {
    return (await this.getHolidayInfoForDate(date))?.isWorkdayOnWeekend ?? false
  }

  async getHolidayName(date: Date): Promise<string | null> {
    return (await this.getHolidayInfoForDate(date))?.name ?? null
  }
}
