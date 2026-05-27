# 星链课表 JSON 格式

本格式描述星链课表 App 的 JSON 数据格式，**koishi-plugin-course-schedule 完全兼容**。

支持两种导入方式：通过分享码从 API 获取，或直接粘贴 JSON 文本。

> 下文中 **"本插件"** 指 koishi-plugin-course-schedule，"Yunzai 插件"指 Yunzai-Schedule-Plugin。

---

## 核心特点

- **基于节次的时间映射**：使用 `startSection`/`endSection`（节次编号）描述上课时间，而非直接存储时间字符串
- **自定义时间覆盖**：支持 `customStartTime`/`custom_endTime` 绕过节次映射
- **宽松的 fallback**：即使缺少 `timeSlots` 节次表，也可从 `startTime`/`endTime` 字段直接读取

---

## 完整 JSON 示例

```json
{
  "tableName": "我的课表",
  "startDate": "2026-03-02",
  "timeSlots": [
    { "number": 1, "startTime": "08:00", "endTime": "08:45" },
    { "number": 2, "startTime": "08:55", "endTime": "09:35" },
    { "number": 3, "startTime": "10:10", "endTime": "10:55" },
    { "number": 4, "startTime": "11:05", "endTime": "12:00" }
  ],
  "courses": [
    {
      "name": "高等数学",
      "teacher": "张教授",
      "location": "教101",
      "weekday": 1,
      "startSection": 1,
      "endSection": 2,
      "weeks": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    },
    {
      "name": "大学英语",
      "teacher": "李老师",
      "location": "教A201",
      "weekday": 3,
      "startSection": 3,
      "endSection": 4,
      "weeks": [1, 2, 3, 4, 5, 6, 7, 8]
    }
  ]
}
```

---

## 顶层字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `tableName` / `name` | string | 否 | 课表名称（`name` 是 Yunzai 插件后端 API 返回的字段名，二者选一即可） |
| `startDate` | string | 建议 | 学期开始日期，格式 `YYYY-MM-DD`。**本插件缺省时使用当前周一**；Yunzai 插件缺省时使用配置默认值 |
| `timeSlots` | array | 建议 | 节次时间映射表，缺省时使用默认节次表（见下方） |
| `courses` | array | **是** | 课程数组 |

---

## 课程对象字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | **是** | 课程名称 |
| `weekday` | number | **是** | 星期几：`1`=周一，`2`=周二，…，`7`=周日 |
| `startSection` | number | **是** | 起始节次编号 |
| `endSection` | number | **是** | 结束节次编号 |
| `weeks` | number[] | 建议 | 上课周数列表，如 `[1,3,5,7,9]`。缺省时根据 `startWeek`/`endWeek` 生成，默认 1-20 周 |
| `startWeek` | number | 否 | 起始周次（`weeks` 缺省时的备选方案） |
| `endWeek` | number | 否 | 结束周次 |
| `teacher` | string | 否 | 教师姓名 |
| `location` / `position` | string | 否 | 上课地点 |
| `customStartTime` | string | 否 | 自定义开始时间 `HH:MM`（**优先级最高**，见下方时间解析顺序） |
| `custom_endTime` | string | 否 | 自定义结束时间 `HH:MM`（注意字段名为 `custom_endTime` 而非 `customEndTime`） |
| `startTime` | string | 否 | 直接指定开始时间 `HH:MM`（最低优先级 fallback） |
| `endTime` | string | 否 | 直接指定结束时间 `HH:MM` |

---

## 时间解析优先级

本插件 `starlink-parser.ts:65-82` 按以下顺序解析每门课程的时间：

```
1. customStartTime / custom_endTime → 直接使用（最高优先级）
2. timeSlots 查表                → 取 startSection 的 startTime + endSection 的 endTime
3. startTime / endTime           → 直接使用（最低优先级 fallback）
4. 以上均无                      → 跳过该课程
```

### 示例说明

| 提供的字段 | 结果 |
|-----------|------|
| `customStartTime: "08:00"` + `custom_endTime: "09:35"` | 直接用 `08:00-09:35` |
| 仅有 `startSection: 1` + `endSection: 2` + `timeSlots` 表 | 查表得第1节开始 + 第2节结束 |
| 仅有 `startSection: 1` + `endSection: 2`，无 `timeSlots` | 使用默认节次表（见下方） |
| 仅有 `startTime: "08:00"` + `endTime: "09:35"` | 直接用 `08:00-09:35` |

---

## 默认节次表

当 JSON 中不含 `timeSlots` 字段时，Yunzai 插件会使用以下默认节次映射（`starlinkApi.js:3-16`）：

| 节次 | 开始 | 结束 |
|------|------|------|
| 1 | 08:00 | 08:45 |
| 2 | 08:50 | 09:35 |
| 3 | 09:50 | 10:35 |
| 4 | 10:40 | 11:25 |
| 5 | 11:30 | 12:15 |
| 6 | 14:00 | 14:45 |
| 7 | 14:50 | 15:35 |
| 8 | 15:40 | 16:25 |
| 9 | 16:30 | 17:15 |
| 10 | 19:00 | 19:45 |
| 11 | 19:50 | 20:35 |
| 12 | 20:40 | 21:25 |

> **注意**：本插件（koishi-plugin-course-schedule）在缺少 `timeSlots` 时**不会使用此默认表**，而是依赖 `startTime`/`endTime` fallback。如需保证时间准确，建议在 JSON 中提供 `timeSlots`。

---

## 最小可用示例

```json
{
  "startDate": "2026-03-02",
  "timeSlots": [
    { "number": 1, "startTime": "08:00", "endTime": "08:45" },
    { "number": 2, "startTime": "08:55", "endTime": "09:35" }
  ],
  "courses": [
    {
      "name": "高等数学",
      "weekday": 1,
      "startSection": 1,
      "endSection": 2,
      "weeks": [1, 2, 3, 4, 5, 6, 7, 8]
    }
  ]
}
```

---

## 格式识别条件

### 本插件（koishi-plugin-course-schedule）

在 `src/services/starlink-parser.ts:123-128` 中，`isStarlinkJson()` 检测方式：

```ts
// 第一门课程同时包含 startSection 和 weekday 两个字段
return 'startSection' in sample && 'weekday' in sample
```

> **⚠️ 此检测优先级最高**（在 `bind.ts` 的 JSON 解析中，星链检测先于拾光和原生格式）。即使课程同时含有 `startTime`/`endTime`，只要还含有 `startSection` 和 `weekday`，就会被识别为星链格式。

### Yunzai-Schedule-Plugin

在 `services/scheduleImporter.js:144-151` 中，`isStarlinkJsonFormat()` 检测方式（**更严格**）：

```js
// 1. 必须含有 startSection 或 weekday
// 2. 不能含有 startTime 或 day
// 3. 不能含有 timeSlots 顶层字段
return (sample.hasOwnProperty('startSection') || sample.hasOwnProperty('weekday')) &&
    !sample.hasOwnProperty('startTime') &&
    !sample.hasOwnProperty('day');
```

> 两条规则同时满足时才判为星链格式，否则走原生/拾光/兜底路径。

---

## 与 Yunzai 原生格式的关键差异

| 差异点 | Yunzai 原生格式 | 星链格式 |
|--------|---------------|---------|
| **星期字段** | `day` | `weekday` |
| **时间存储** | `startTime`/`endTime` 直接存储，完全可靠 | `startSection`/`endSection` 节次映射，依赖 `timeSlots` 表 |
| **时间可靠性** | ✅ 100% 保留 | ⚠️ 取决于 `timeSlots` 的准确性 |
| **学期开始日期** | `semesterStart` | `startDate` |
| **课表名称字段** | `tableName` | `tableName` 或 `name` |

---

## 导入方式

1. **分享码导入**：发送含有「星链课表」关键词 + 分享码的文本（如 `课表.绑定 分享口令为「xxxxxxxx」`），插件会自动调用星链 API 获取数据
2. **JSON 文本导入**：直接发送 `课表.绑定` + 星链 JSON 文本（自动识别）
3. **JSON 文件导入**：上传 `.json` 文件

---

## 参考来源

- 本插件源码：`src/services/starlink-parser.ts`
- Yunzai 插件源码：`services/starlinkApi.js`、`services/scheduleImporter.js`
- 星链课表 API：`https://api.starlinkkb.cn/share/curriculum/{shareCode}`
