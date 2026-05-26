export interface CourseRecord {
  id: number
  channelId: string
  userid: string
  username: string
  useravatar: string
  curriculumndate: string[]
  curriculumname: string
  curriculumtime: string
  startDate: string
  endDate: string
  location?: string
  source?: 'ics' | 'wakeup' | 'starlink' | 'shiguang' | 'wakeup-file' | 'json' | 'manual'
  weeks?: number[]
  startNode?: number
  step?: number
  teacher?: string
  rescheduled?: boolean
  originalDay?: number
  originalWeek?: number
  originalDate?: string
}

export interface CourseSummary {
  userid: string
  username: string
  useravatar: string
  courseName: string
  startTime: string
  endTime: string
  location?: string
}

export interface BindResult {
  count: number
  source: 'ics' | 'wakeup'
}

export interface DayCourseView {
  userid: string
  username: string
  useravatar: string
  courseName: string
  startTime: string
  endTime: string
  location: string
  status: 'ongoing' | 'next' | 'finished' | 'nocourse'
  statusDetail: string
}

export interface RankingItem {
  userid: string
  username: string
  useravatar: string
  totalMinutes: number
  courseCount: number
}

export interface TargetUser {
  userId: string
  username: string
  useravatar: string
}

declare module 'koishi' {
  interface Tables {
    course_schedule: CourseRecord
  }
}
