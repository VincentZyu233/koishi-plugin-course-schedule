import type { Context } from 'koishi'
import { TABLE_NAME } from '../constants'
import type { CourseRecord, DayCourseView, RankingItem } from '../types'
import type { DataManager } from './data-manager'
import type { ICSParser } from './ics-parser'
import type { ImageGenerator } from '../render/image-generator'
import {
  formatDurationMinutes,
  getDayOffsetDate,
  getWeekRange,
  isCourseActiveOnDate,
  toIsoDate,
  weekdayNameOfDate,
} from '../utils/date'

export class ScheduleService {
  constructor(
    private ctx: Context,
    private _dataManager: DataManager,
    private _icsParser: ICSParser,
    private imageGenerator: ImageGenerator,
  ) {}

  private log(...args: unknown[]) {
    this.ctx.logger.info('[course-schedule]', ...args)
  }

  async listChannelCourses(channelId: string) {
    const courses = await (this.ctx.database.get(TABLE_NAME, { channelId }) as Promise<CourseRecord[]>)
    this.log('[schedule] listChannelCourses, channel=', channelId, 'count=', courses.length)
    return courses
  }

  async listUserCourses(channelId: string, userid: string) {
    const courses = await (this.ctx.database.get(TABLE_NAME, { channelId, userid }) as Promise<CourseRecord[]>)
    this.log('[schedule] listUserCourses, channel=', channelId, 'user=', userid, 'count=', courses.length)
    return courses
  }

  async renderPersonalSchedule(channelId: string, userid: string, dayOffset = 0) {
    const targetDate = getDayOffsetDate(dayOffset)
    const currentWeekday = weekdayNameOfDate(targetDate)
    const allCourses = await this.listUserCourses(channelId, userid)
    const courses = allCourses
      .filter(course => isCourseActiveOnDate(course, targetDate, currentWeekday))
      .sort((a, b) => a.curriculumtime.localeCompare(b.curriculumtime, 'zh-CN'))

    this.log('[schedule] renderPersonalSchedule, 总数=', allCourses.length, '筛选后=', courses.length)
    const items = courses.map(course => this.toDayCourseView(course, dayOffset))
    return this.imageGenerator.renderPersonalSchedule(items, targetDate)
  }

  async renderChannelSchedule(channelId: string, dayOffset = 0) {
    const targetDate = getDayOffsetDate(dayOffset)
    const weekday = weekdayNameOfDate(targetDate)
    const courses = await this.listChannelCourses(channelId)
    const byUser = new Map<string, CourseRecord[]>()
    let filteredCount = 0

    for (const course of courses) {
      if (!isCourseActiveOnDate(course, targetDate, weekday)) continue
      const bucket = byUser.get(course.userid) ?? []
      bucket.push(course)
      byUser.set(course.userid, bucket)
      filteredCount++
    }

    this.log('[schedule] renderChannelSchedule, 总课程=', courses.length, '符合条件=', filteredCount, '独立用户=', byUser.size)

    const items: DayCourseView[] = []
    for (const [userid, userCourses] of byUser) {
      userCourses.sort((a, b) => a.curriculumtime.localeCompare(b.curriculumtime, 'zh-CN'))
      const active = this.pickRepresentativeCourse(userCourses, dayOffset)
      if (active) {
        items.push(this.toDayCourseView(active, dayOffset))
      } else {
        const sample = userCourses[0]
        items.push({
          userid,
          username: sample.username,
          useravatar: sample.useravatar,
          courseName: dayOffset === 0 ? '今日无课' : '所选日期无课',
          startTime: '',
          endTime: '',
          location: '',
          status: 'nocourse',
          statusDetail: '',
        })
      }
    }

    return this.imageGenerator.renderGroupSchedule(items, targetDate)
  }

  async getWeeklyRanking(channelId: string) {
    const courses = await this.listChannelCourses(channelId)
    const week = getWeekRange(new Date())
    const ranking = new Map<string, RankingItem>()

    for (const course of courses) {
      const weekdays = course.curriculumndate ?? []
      const [startTime, endTime] = course.curriculumtime.split('-')
      const duration = this.diffMinutes(startTime, endTime)
      if (duration <= 0) continue

      for (const day of week.days) {
        if (!isCourseActiveOnDate(course, day.date, day.weekday)) continue
        if (!weekdays.includes(day.weekday)) continue
        const item = ranking.get(course.userid) ?? {
          userid: course.userid,
          username: course.username,
          useravatar: course.useravatar,
          totalMinutes: 0,
          courseCount: 0,
        }
        item.totalMinutes += duration
        item.courseCount += 1
        ranking.set(course.userid, item)
      }
    }

    return Array.from(ranking.values()).sort((a, b) => b.totalMinutes - a.totalMinutes)
  }

  async renderWeeklyRanking(channelId: string) {
    const ranking = await this.getWeeklyRanking(channelId)
    this.log('[schedule] renderWeeklyRanking, 参与人数=', ranking.length)
    const week = getWeekRange(new Date())
    const dateRange = `${week.days[0].date.toLocaleDateString('zh-CN')} - ${week.days[6].date.toLocaleDateString('zh-CN')}`
    return this.imageGenerator.renderRanking(ranking, dateRange)
  }

  private pickRepresentativeCourse(courses: CourseRecord[], dayOffset: number) {
    if (dayOffset !== 0) return courses[0] ?? null
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()
    let nextCourse: CourseRecord | null = null

    for (const course of courses) {
      const [startTime, endTime] = course.curriculumtime.split('-')
      const start = this.timeToMinutes(startTime)
      const end = this.timeToMinutes(endTime)
      if (start <= nowMinutes && nowMinutes <= end) return course
      if (start > nowMinutes && (!nextCourse || start < this.timeToMinutes(nextCourse.curriculumtime.split('-')[0]))) {
        nextCourse = course
      }
    }

    return nextCourse ?? courses[0] ?? null
  }

  private toDayCourseView(course: CourseRecord, dayOffset: number): DayCourseView {
    const [startTime, endTime] = course.curriculumtime.split('-')
    const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes()
    const start = this.timeToMinutes(startTime)
    const end = this.timeToMinutes(endTime)

    let status: DayCourseView['status'] = dayOffset === 0 ? 'finished' : 'next'
    let statusDetail = ''
    if (dayOffset === 0) {
      if (start <= currentMinutes && currentMinutes <= end) {
        status = 'ongoing'
        statusDetail = `剩余 ${formatDurationMinutes(end - currentMinutes)}`
      } else if (start > currentMinutes) {
        status = 'next'
        statusDetail = `${formatDurationMinutes(start - currentMinutes)}后`
      }
    }

    return {
      userid: course.userid,
      username: course.username,
      useravatar: course.useravatar,
      courseName: course.curriculumname,
      startTime,
      endTime,
      location: course.location ?? '',
      status,
      statusDetail,
    }
  }

  private timeToMinutes(value: string) {
    const [hour, minute] = value.split(':').map(Number)
    return hour * 60 + minute
  }

  private diffMinutes(start: string, end: string) {
    return this.timeToMinutes(end) - this.timeToMinutes(start)
  }
}
