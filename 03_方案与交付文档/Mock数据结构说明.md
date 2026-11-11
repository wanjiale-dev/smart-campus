# Mock 数据结构说明

对应任务书「数据库设计或 Mock 数据结构说明」一项。

系统没有接入真实数据库，全部数据由一份种子文件驱动：浏览器端和后端读取同一个 `seed.js`，所以「双击打开」和「npm start」看到的字段、条数、业务规则完全一致。

## 数据放在哪里

| 环境 | 位置 | 说明 |
|---|---|---|
| 种子数据 | `02_程序源码/frontend/js/mock/seed.js` | 唯一数据源，前端 `<script>` 直接加载，后端用 `vm` 读取同一个文件 |
| 浏览器运行 | `localStorage`，键名 `campus_mock_db` | 首次打开从种子复制，之后增删改只写这里，刷新不丢 |
| 后端运行 | `02_程序源码/server/data/db.json` | 启动时复制种子，写操作落盘到这个文件 |
| 重置 | 顶栏头像菜单 →「重置演示数据」 | 等价于 `POST /api/admin/reset`，或直接删掉 `db.json` |

`db.json` 和浏览器存储都是运行时副本，不进版本库。

## 实体总览

共 15 个实体，种子数据合计 79 条记录。

| 实体 | 中文 | 种子条数 | 主键示例 | 主要使用页面 |
|---|---|---|---|---|
| `users` | 登录账号 | 6 | `U001` | 登录页、全站身份 |
| `students` | 学生 | 10 | `S2024001` | 学生信息管理 |
| `teachers` | 教师 | 5 | `T001` | 课程与排课 |
| `courses` | 课程库 | 8 | `C001` | 课程与排课 |
| `offerings` | 开课班（排课结果） | 8 | `O0001` | 课程与排课、选课、两个门户 |
| `selections` | 选课记录 | 0 | `SE0001` | 选课管理 |
| `grades` | 成绩 | 8 | `G0001` | 成绩管理、学生门户 |
| `exams` | 考试安排 | 4 | `E0001` | 考试与考务 |
| `leaves` | 请假单 | 4 | `L0001` | 学工与请假 |
| `venues` | 场地 | 6 | `V001` | 场地预约 |
| `bookings` | 场地预约单 | 3 | `BK0001` | 场地预约 |
| `books` | 图书 | 8 | `B0001` | 图书借阅 |
| `borrows` | 借阅记录 | 3 | `BR0001` | 图书借阅 |
| `messages` | 通知 | 5 | `M0001` | 消息中心、各首页 |
| `receipts` | 已读回执 | 1 | `R0001` | 消息中心 |

`selections` 种子为空是刻意的：学生第一次点「选课」才有数据，方便演示选课和退课的完整过程。

## 字段定义

类型一栏中，`date` 统一是 `YYYY-MM-DD`，`datetime` 是 `YYYY-MM-DD HH:mm`，两者都以字符串存储，比较大小即可排序，不引入时区问题。

### users 登录账号

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 主键，`U001` 起 |
| `username` | string | 是 | 登录名，与角色同名（admin、academic…） |
| `password` | string | 是 | 演示用明文，统一 `123456`，登录成功返回时会被剔除 |
| `name` | string | 是 | 姓名 |
| `role` | string | 是 | `admin` / `academic` / `counselor` / `teacher` / `student` / `librarian` |
| `dept` | string | 是 | 所属部门 |
| `title` | string | 否 | 职务或年级 |
| `teacherId` | string | 否 | 仅教师账号有，指向 `teachers.id` |
| `studentId` | string | 否 | 仅学生账号有，指向 `students.id` |

### students 学生

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 学号，同时是主键，新增时由表单填写 |
| `name` | string | 是 | 姓名 |
| `gender` | string | 是 | `男` / `女` |
| `grade` | string | 是 | 年级，如 `2024` |
| `className` | string | 是 | 行政班，如 `计算机 2401` |
| `major` | string | 是 | 专业 |
| `phone` | string | 否 | 11 位手机号 |
| `email` | string | 否 | 校内邮箱 |
| `status` | string | 是 | `在读` / `休学` / `毕业` |

`className` 是选课、请假、考试三处联动班级的关联键，改名要同步改 `offerings`、`leaves`、`exams` 里的同名字段。

### teachers 教师

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | `T001` 起 |
| `name` | string | 是 | 姓名 |
| `title` | string | 否 | 职称，如 `副教授` |
| `dept` | string | 是 | 学院 |
| `phone` | string | 否 | 手机号 |

### courses 课程库

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 主键，`C001` 起 |
| `code` | string | 是 | 课程代码，如 `CS2001`，对外展示用 |
| `name` | string | 是 | 课程名 |
| `credit` | number | 是 | 学分，允许 0.5 步进 |
| `type` | string | 是 | `必修` / `选修` |
| `dept` | string | 是 | 开课学院 |
| `teacherId` | string | 否 | 默认任课教师，指向 `teachers.id` |

课程库与开课班是一对多：同一门课可以给多个班开多个教学班。

### offerings 开课班（排课结果）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | `O0001` 起 |
| `courseId` | string | 是 | 指向 `courses.id` |
| `courseName` | string | 是 | 冗余课程名，列表直接展示，避免前端再查一次 |
| `teacherId` | string | 是 | 指向 `teachers.id` |
| `teacherName` | string | 是 | 冗余教师名 |
| `className` | string | 是 | 上课班级 |
| `weekday` | string | 是 | `周一` 至 `周五` |
| `timeSlot` | string | 是 | `第 1-2 节` / `第 3-4 节` / `第 5-6 节` / `第 7-8 节` |
| `room` | string | 是 | 教室 |
| `capacity` | number | 是 | 容量 |
| `enrolled` | number | 是 | 已选人数，选课/退课时 ±1 |

`weekday + timeSlot` 是检测时间冲突的键：同一学生两条选课记录占同一个格子即冲突。`enrolled >= capacity` 时选课按钮应禁用。

### selections 选课记录

一条记录 = 某学生选了某个开课班。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 内核自动生成 |
| `studentId` | string | 是 | 指向 `students.id` |
| `studentName` | string | 是 | 冗余姓名 |
| `offeringId` | string | 是 | 指向 `offerings.id`，判断「是否已选」用这个字段 |
| `courseId` | string | 是 | 指向 `courses.id` |
| `courseName` | string | 是 | 冗余课程名 |
| `teacherName` | string | 是 | 冗余教师名 |

退课要同时做两件事：删掉本记录、把对应 `offerings.enrolled` 减 1。只删记录会导致人数虚高。

### grades 成绩

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | `G0001` 起 |
| `studentId` | string | 是 | 指向 `students.id` |
| `studentName` | string | 是 | 冗余姓名 |
| `courseId` | string | 是 | 指向 `courses.id` |
| `courseName` | string | 是 | 冗余课程名 |
| `credit` | number | 是 | 学分，计算加权平均用 |
| `usual` | number | 是 | 平时分，0–100，占 40% |
| `final` | number | 是 | 期末分，0–100，占 60% |
| `total` | number | 是 | 总评，`usual × 0.4 + final × 0.6` 四舍五入 |
| `term` | string | 是 | 学期，如 `2026-2027-1` |

总评与结果列都是派生值：`total < 60` 记为不及格，不单独存字段。

### exams 考试安排

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | `E0001` 起 |
| `courseName` | string | 是 | 考试课程 |
| `className` | string | 是 | 考试班级 |
| `date` | date | 是 | 考试日期 |
| `time` | string | 是 | `09:00-11:00` 形式的时段 |
| `room` | string | 是 | 考场 |
| `invigilator` | string | 否 | 监考教师，多人用 ` / ` 分隔，未分配写 `待分配` |
| `type` | string | 是 | 考试类型，种子里都是 `期末考试`；自由文本，加期中或补考直接写新值 |
| `status` | string | 是 | `待排考` / `已排考` |

### leaves 请假单

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | `L0001` 起 |
| `studentId` | string | 是 | 指向 `students.id` |
| `studentName` | string | 是 | 冗余姓名 |
| `className` | string | 是 | 冗余班级 |
| `type` | string | 是 | `病假` / `事假` |
| `startDate` | date | 是 | 开始日期 |
| `endDate` | date | 是 | 结束日期，不得早于开始日期 |
| `days` | number | 是 | 天数，由起止日期算出 |
| `reason` | string | 是 | 请假事由 |
| `status` | string | 是 | `待审批` / `已通过` / `已驳回` / `已销假` |
| `approver` | string | 否 | 审批人姓名，未审批为空串 |
| `createdAt` | datetime | 是 | 提交时间 |

`已销假` 由页面写入，内核的审批接口只认通过和驳回两种结果。

### venues 场地

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | `V001` 起 |
| `name` | string | 是 | 场地名 |
| `type` | string | 是 | `教室` / `会议室` / `场馆` |
| `building` | string | 是 | 楼栋 |
| `floor` | string | 是 | 楼层 |
| `capacity` | number | 是 | 容纳人数，预约人数不得超过 |
| `equipment` | string[] | 否 | 设备数组，如 `['投影','空调']` |
| `openHours` | string | 是 | 开放时段，如 `08:00-22:00` |
| `status` | string | 是 | `可用` / `维护中`，维护中的不可预约 |

### bookings 场地预约单

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | `BK0001` 起 |
| `venueId` | string | 是 | 指向 `venues.id` |
| `venueName` | string | 是 | 冗余场地名 |
| `applicantId` | string | 是 | 指向 `users.id` |
| `applicantName` | string | 是 | 冗余姓名 |
| `applicantRole` | string | 是 | 申请人角色 |
| `date` | date | 是 | 使用日期，不能早于今天 |
| `startTime` | string | 是 | `HH:mm` |
| `endTime` | string | 是 | `HH:mm`，必须晚于开始时间 |
| `purpose` | string | 是 | 用途 |
| `attendees` | number | 是 | 人数，不得超过场地容量 |
| `contact` | string | 是 | 联系方式 |
| `status` | string | 是 | `待审批` / `已通过` / `已驳回` / `已取消` |
| `approver` | string | 否 | 审批人 |
| `remark` | string | 否 | 审批意见，驳回时必填 |
| `createdAt` | datetime | 是 | 提交时间 |

### books 图书

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | `B0001` 起 |
| `isbn` | string | 是 | 13 位 ISBN |
| `title` | string | 是 | 书名 |
| `author` | string | 是 | 作者 |
| `category` | string | 是 | `教材` / `科技` / `文学` / `历史` / `艺术` / `其他` |
| `publisher` | string | 否 | 出版社 |
| `total` | number | 是 | 馆藏册数 |
| `available` | number | 是 | 在架册数，0 ≤ available ≤ total |
| `location` | string | 否 | 馆藏位置，如 `A 区 3 排` |

借出时 `available` 减 1，归还时加 1（上限为 `total`）。`available === 0` 时借阅按钮应禁用。

### borrows 借阅记录

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | `BR0001` 起 |
| `bookId` | string | 是 | 指向 `books.id` |
| `bookTitle` | string | 是 | 冗余书名 |
| `userId` | string | 是 | 借阅人，指向 `users.id` |
| `userName` | string | 是 | 冗余姓名 |
| `userRole` | string | 是 | 借阅人角色 |
| `borrowDate` | date | 是 | 借出日期 |
| `dueDate` | date | 是 | 应还日期，借期 30 天 |
| `returnDate` | date | 否 | 归还日期，未归还为空串 |
| `status` | string | 是 | `借阅中` / `已归还` |
| `renewCount` | number | 是 | 已续借次数，最多 1 次 |

**「逾期」不是存储状态**，是列表按 `status === '借阅中' && dueDate < 今天` 现算出来的。数据库里只有借阅中和已归还两种。

### messages 通知

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | `M0001` 起 |
| `category` | string | 是 | `教学` / `系统` / `审批` / `活动` |
| `title` | string | 是 | 标题 |
| `content` | string | 是 | 正文，纯文本 |
| `senderName` | string | 是 | 发送人 |
| `senderRole` | string | 是 | 发送人角色 |
| `targetRoles` | string[] | 是 | 接收角色，`['all']` 表示全员 |
| `publishAt` | datetime | 是 | 发布时间 |
| `attachments` | object[] | 否 | `[{ name, size }]`，只存展示信息，没有真实文件 |
| `status` | string | 是 | `published` / `withdrawn` |
| `pinned` | boolean | 是 | 是否置顶 |

接收规则写在 `listMessages` 里：`targetRoles` 含当前角色或含 `all` 才可见；`admin` 例外，能看到全部，便于统计和撤回。已撤回（`withdrawn`）对任何人都不显示。

### receipts 已读回执

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | `R0001` 起 |
| `messageId` | string | 是 | 指向 `messages.id` |
| `userId` | string | 是 | 指向 `users.id` |
| `readAt` | datetime | 是 | 阅读时间 |

已读是「每人一条回执」，不是消息上的一个布尔值。所以同一条通知，老师读过、学生没读，两者的未读数不同。判断已读就是查有没有 `(messageId, userId)` 这条记录。

## 实体关系

```
users ──studentId──> students
users ──teacherId──> teachers

courses ──teacherId──> teachers
courses ──1:N──> offerings ──N:1──> teachers
                  offerings ──N:1──> students（按 className 关联班级，非外键）

students ──1:N──> selections ──N:1──> offerings
students ──1:N──> grades ──N:1──> courses
students ──1:N──> leaves

venues ──1:N──> bookings ──N:1──> users
books  ──1:N──> borrows  ──N:1──> users

messages ──1:N──> receipts ──N:1──> users
```

两点必须说清楚：

1. **没有物理外键，全部是字符串引用。** 删掉一个学生，他的成绩、请假单、选课记录都会变成孤儿数据，页面不会报错但会显示不存在的名字。演示够用，真实项目要靠数据库外键或事务保证。
2. **多处冗余存了名称字段**（`courseName`、`teacherName`、`venueName`、`bookTitle`），目的是列表一次查完直接渲染，不用前端做 join。代价是改名不同步：把「数据结构」改成「数据结构与算法」，只改 `courses.name` 的话，`offerings`、`grades`、`selections` 里还是旧名。改课程名要四处一起改。

## 枚举取值汇总

| 字段 | 可选值 |
|---|---|
| `users.role` | `admin`、`academic`、`counselor`、`teacher`、`student`、`librarian` |
| `students.gender` | `男`、`女` |
| `students.status` | `在读`、`休学`、`毕业` |
| `courses.type` | `必修`、`选修` |
| `offerings.weekday` | `周一` 至 `周五` |
| `offerings.timeSlot` | `第 1-2 节`、`第 3-4 节`、`第 5-6 节`、`第 7-8 节` |
| `exams.type` | 种子只用到 `期末考试`，字段本身不限值 |
| `exams.status` | `待排考`、`已排考` |
| `leaves.type` | `病假`、`事假` |
| `leaves.status` | `待审批`、`已通过`、`已驳回`、`已销假` |
| `venues.type` | `教室`、`会议室`、`场馆` |
| `venues.status` | `可用`、`维护中` |
| `bookings.status` | `待审批`、`已通过`、`已驳回`、`已取消` |
| `books.category` | `教材`、`科技`、`文学`、`历史`、`艺术`、`其他` |
| `borrows.status` | `借阅中`、`已归还`（逾期为派生值） |
| `messages.category` | `教学`、`系统`、`审批`、`活动` |
| `messages.status` | `published`、`withdrawn` |

## 主键生成规则

种子数据用可读编号（`S2024001`、`C001`、`BK0001`），新增记录分两种情况：

- **页面自己给 id**：学生新增时表单里的「学号」就是主键；课程新增不传 id。
- **内核自动生成**：`nextId(prefix, rows)` 取该表现有 id 中的最大数字加 1，补到 4 位，前缀是资源名前两位大写。

于是新增一门课会得到 `CO0009`，而种子里的课程是 `C001`。两种编号并存不影响功能（id 只用于定位），但列表里如果直接展示 id 会显得不一致。**需要对外展示编号时，请展示业务字段而不是 id**：课程展示 `code`，学生展示学号，预约展示 `BK` 编号。

## 接口约定

前后端共用同一套路由分发（`mock/core.js` 的 `handle`），真实接口只是把这层挂到 HTTP 上。

响应统一包一层：

```json
{ "code": 0, "data": {}, "message": "ok" }
```

`code` 为 0 表示成功，非 0 时 `message` 是可直接弹给用户看的中文提示。

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/{resource}` | 列表，返回 `{ list, total, page, pageSize }` |
| `GET` | `/api/{resource}/{id}` | 单条 |
| `POST` | `/api/{resource}` | 新增，返回新记录 |
| `PUT` | `/api/{resource}/{id}` | 更新，只改传入的字段 |
| `DELETE` | `/api/{resource}/{id}` | 删除 |

列表支持的查询参数：

| 参数 | 说明 |
|---|---|
| `page` | 页码，默认 1 |
| `pageSize` | 每页条数，传 0 或不传返回全部 |
| `keyword` | 关键字，在各实体的 `RESOURCES` 声明字段里模糊匹配 |
| 其他任意字段 | 等值过滤，如 `?className=计算机 2401&status=在读` |

`role`、`userId` 不做过滤，由接口自己消费（消息可见性、数据总览的未读数）。

列表默认按插入顺序倒序，新增的记录排在最前。

业务专用接口：

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/auth/login` | 登录，返回 `token` 和去掉密码的 `user` |
| `GET` | `/api/dashboard/stats` | 总览聚合，含卡片、成绩分段、热度 Top 6、预警 |
| `GET` | `/api/messages` | 按角色过滤后的通知列表，带 `read` 标记和 `unread` 计数 |
| `POST` | `/api/messages/{id}/read` | 标记单条已读，写回执 |
| `POST` | `/api/messages/read-all` | 全部已读 |
| `POST` | `/api/messages/publish` | 发布通知 |
| `POST` | `/api/messages/{id}/withdraw` | 撤回通知 |
| `GET` | `/api/messages/{id}/stats` | 单条通知的已读/未读人数 |
| `POST` | `/api/bookings` | 提交预约，含容量、时段冲突校验 |
| `POST` | `/api/bookings/{id}/approve` | 审批预约 |
| `POST` | `/api/bookings/{id}/cancel` | 取消预约，只能取消自己的 |
| `POST` | `/api/leaves/{id}/approve` | 审批请假 |
| `POST` | `/api/books/{id}/borrow` | 借书，扣减在架数 |
| `POST` | `/api/borrows/{id}/return` | 还书，回补在架数 |
| `POST` | `/api/borrows/{id}/renew` | 续借，最多 1 次，每次延 30 天 |

错误码约定：

| code | 含义 | 典型场景 |
|---|---|---|
| 0 | 成功 | — |
| 400 | 业务校验失败 | 缺字段、日期倒挂、人数超容量 |
| 401 | 未登录或账号密码错误 | 登录失败 |
| 403 | 越权 | 角色不匹配、取消别人的预约 |
| 404 | 资源或记录不存在 | id 打错、删了又查 |
| 409 | 冲突 | 预约时段刚被别人占用 |

## 业务约束清单

这些规则不是靠数据库约束，而是写在 `mock/core.js` 里，改代码时要一起维护：

- 登录：用户名存在 → 密码正确 → 所选角色与账号角色一致，三步依次校验。
- 选课：不能重复选同一个开课班；`enrolled >= capacity` 不能选；与已选课程同一 `weekday + timeSlot` 视为冲突。
- 退课：删记录的同时把 `enrolled` 减 1，最低到 0。
- 预约：场地必须存在且状态为可用；日期不能早于今天；当天的时间段不能早于当前时刻；开始时间必须早于结束时间；人数不超过容量；与已有预约（非已驳回、非已取消）同日同时段重叠则拒绝。
- 审批：只有 `待审批` 可审批，重复审批报错；驳回必须填意见。
- 借还：在架数为 0 不能借；只有 `借阅中` 能归还或续借；续借上限 1 次。
- 请假：天数由起止日期算出；只有 `待审批` 可审批。
- 消息：标题、正文、接收对象必填；撤回后对所有人不可见。

## 新增一个实体怎么做

以「奖学金 scholarship」为例，三步：

1. `seed.js` 里加数组 `scholarships: [...]`，每条带 `id`。
2. `core.js` 的 `RESOURCES` 里加一行 `scholarships: ['name', 'level']`，声明关键字搜索命中哪些字段。
3. 页面里 `api.list('scholarships')` 即可，增删改查自动可用。

漏掉第 2 步不会报错，但关键字搜索会退化成只匹配 `name`、`title`、`id` 三个默认字段。

## 已知取舍

- **密码明文存储**，登录返回时剔除。演示用，真实项目必须哈希加盐。
- **token 是拼出来的假字符串**（`mock-token-admin-U001`），服务端不校验签名，前端也没有真实鉴权。答辩若被问安全性，如实说明这是 Mock 层，真实实现要走 JWT 加服务端校验。
- **无并发控制**。两个人同时选最后一个名额，都会成功。`enrolled` 是读出来加一再写回，不是原子操作。
- **无分页压力测试**。数据量在百条以内，全部过滤在内存完成。
