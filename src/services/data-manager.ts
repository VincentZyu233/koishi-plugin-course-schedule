import type { Context } from 'koishi'
import { TABLE_NAME } from '../constants'

export class DataManager {
  constructor(private ctx: Context) {}

  ensureStorage() {
    return Promise.resolve()
  }

  registerDatabase() {
    this.ctx.model.extend(TABLE_NAME, {
      id: 'unsigned',
      channelId: 'string',
      userid: 'string',
      username: 'string',
      useravatar: 'string',
      curriculumndate: 'json',
      curriculumname: 'string',
      curriculumtime: 'string',
      startDate: 'string',
      endDate: 'string',
      location: 'string',
      source: 'string',
    }, {
      primary: 'id',
      autoInc: true,
    })
  }
}

