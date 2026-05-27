import * as fs from 'fs'
import * as path from 'path'

export interface UserTimeSlot {
  section: number
  startTime: string
  endTime: string
}

export interface TimeTableData {
  timeSlots: UserTimeSlot[]
}

export class TimeSlotManager {
  private cacheDir: string

  constructor(baseDir?: string) {
    this.cacheDir = baseDir ?? path.resolve(process.cwd(), 'cache', 'timeslots')
    this.ensureCacheDir()
  }

  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true })
    }
  }

  private getUserFilePath(userId: string | number): string {
    return path.join(this.cacheDir, `${userId}.json`)
  }

  async saveTimeSlots(userId: string | number, timeSlots: UserTimeSlot[]): Promise<void> {
    const filePath = this.getUserFilePath(userId)
    const data: TimeTableData = { timeSlots }
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  }

  async loadTimeSlots(userId: string | number): Promise<UserTimeSlot[] | null> {
    const filePath = this.getUserFilePath(userId)
    if (!fs.existsSync(filePath)) return null

    try {
      const raw = await fs.promises.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(raw) as TimeTableData | { items: UserTimeSlot[] } | UserTimeSlot[]
      
      if (Array.isArray(parsed)) return parsed
      if ('timeSlots' in parsed && Array.isArray(parsed.timeSlots)) return parsed.timeSlots
      if ('items' in parsed && Array.isArray(parsed.items)) return parsed.items
      return null
    } catch {
      return null
    }
  }

  async deleteTimeSlots(userId: string | number): Promise<boolean> {
    const filePath = this.getUserFilePath(userId)
    if (!fs.existsSync(filePath)) return false

    try {
      await fs.promises.unlink(filePath)
      return true
    } catch {
      return false
    }
  }

  async hasTimeSlots(userId: string | number): Promise<boolean> {
    const filePath = this.getUserFilePath(userId)
    return fs.existsSync(filePath)
  }
}
