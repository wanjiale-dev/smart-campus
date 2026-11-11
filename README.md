# 智慧校园综合管理平台 · 起步骨架

Vue2 + Vue Router + Vuex + Element UI + axios + ECharts，零构建、零依赖安装。
13 个页面已按组员分文件，登录、路由守卫、6 角色菜单与按钮权限已跑通，可以直接在此并行开发。

---

## 一、30 秒跑起来

### 方式 A：只看界面（不需要 Node）

双击 `02_程序源码/frontend/index.html`，浏览器打开即可。数据来自浏览器本地 Mock（localStorage），刷新不丢。

### 方式 B：带接口联调（推荐）

```bash
cd 02_程序源码
npm start          # 等价于 node server/app.js，无需 npm install
```

然后打开 <http://localhost:3000>。
前端会自动探测 `http://localhost:3000/api/health`：探测成功走真实接口（顶栏显示「接口模式」），失败自动回落本地 Mock（顶栏显示「本地 Mock」）。
也可用 `index.html?api=local` / `?api=remote` 强制指定模式。

### 测试账号（密码统一 `123456`）

| 角色 | 账号 | 登录后首页 |
|---|---|---|
| 管理员 | admin | 数据总览 |
| 教务管理员 | academic | 数据总览 |
| 辅导员 | counselor | 数据总览 |
| 教师 | teacher | 教师工作台 |
| 学生 | student | 学生端门户 |
| 图书管理员 | librarian | 图书借阅 |

验证码是本地生成的 4 位字符，点验证码框可刷新，不区分大小写。

---

## 二、目录结构

```
智慧校园综合管理平台/
├─ README.md                        # 本文件：启动、目录、分工
├─ 01_项目文档与任务书/              # 选题、分工截图（只读材料，不改）
│  ├─ 项目选题.pdf
│  ├─ 分工截图-六人版.jpg
│  └─ 分工截图-联调对接点.png
├─ 02_程序源码/                      # ★ 开发只进这个文件夹
│  ├─ frontend/                     # 前端（无构建，双击可用）
│  │  ├─ index.html                 # ★ 唯一入口
│  │  ├─ css/app.css                # 全局布局与视觉基调
│  │  ├─ vendor/                    # vue / vue-router / vuex / element-ui / axios / echarts
│  │  └─ js/
│  │     ├─ config.js               # 全局配置（接口地址、本地存储 key、测试账号）
│  │     ├─ api.js                  # ★ 统一请求层（remote / local 双模式）
│  │     ├─ auth.js                 # ★ 角色与权限唯一来源
│  │     ├─ store.js                # Vuex：登录态、当前用户、未读数
│  │     ├─ router.js               # ★ 路由表 + 登录/越权守卫
│  │     ├─ app.js                  # 启动入口
│  │     ├─ layout/AppLayout.js     # 侧边菜单 + 顶栏 + 内容区
│  │     ├─ components/page-header.js
│  │     ├─ mock/
│  │     │  ├─ seed.js              # ★ 全站假数据（前后端共用）
│  │     │  ├─ core.js              # Mock 业务内核（UMD，服务端 require 同一份）
│  │     │  └─ local-api.js         # 浏览器端适配（localStorage 持久化）
│  │     └─ pages/                  # ★ 每人只改自己的文件
│  │        ├─ login.js             # 万
│  │        ├─ dashboard.js         # 万
│  │        ├─ students.js          # 吴
│  │        ├─ courses.js           # 吴
│  │        ├─ course-selection.js  # 石
│  │        ├─ grades.js            # 石
│  │        ├─ exams.js             # 任
│  │        ├─ student-affairs.js   # 任
│  │        ├─ teacher-workbench.js # 高
│  │        ├─ student-portal.js    # 高
│  │        ├─ library.js           # 王（六人版新增）
│  │        ├─ campus-venue.js      # 王（拓展页）
│  │        └─ message-center.js    # 万（拓展页）
│  ├─ server/
│  │  ├─ app.js                     # 零依赖 Mock 后端 + 静态托管
│  │  └─ data/db.json               # 首次写操作后自动生成，删掉即恢复 seed
│  └─ package.json
├─ 03_方案与交付文档/
│  └─ 起步方案.md                    # 范围切分、节奏、分工、评分对齐
└─ 04_过程稿与归档/                  # 旧版本与临时脚本，留档可追溯，不用改
   └─ 项目启动阶段-2026-11-11/
      ├─ 自测脚本/                  # 页面模板编译检查、登录态 harness
      └─ vendor-src/                # 依赖本地化时的 npm 源与 lock 文件
```

---

## 三、每个人改哪些文件

| 组员 | 主责页面 | 只改这些 | 一般不用动 |
|---|---|---|---|
| 吴 | 学生信息、课程排课 | `pages/students.js`、`pages/courses.js` | — |
| 万（组长） | 登录、数据总览、消息中心 | `pages/login.js`、`pages/dashboard.js`、`pages/message-center.js` | — |
| 任 | 考试考务、学工请假 | `pages/exams.js`、`pages/student-affairs.js` | — |
| 王 | 图书借阅、场地预约 | `pages/library.js`、`pages/campus-venue.js` | — |
| 石 | 选课、成绩 | `pages/course-selection.js`、`pages/grades.js` | — |
| 高 | 教师工作台、学生门户 | `pages/teacher-workbench.js`、`pages/student-portal.js` | — |

公共文件（`router.js`、`auth.js`、`api.js`、`seed.js`、`app.css`）**由万统一改**，其他人提交前先在群里说一声，避免互相覆盖。

> 5 人缩减方案：去掉图书借阅页与图书管理员角色，其余页面按 PDF 的 A–E 分工合并，详见 `03_方案与交付文档/起步方案.md` §3.3。

每个页面头部都用 `<page-header>` 标了「必做 / 选做」清单，打开页面就能对照 PDF 要求，不用翻文档。

---

## 四、三种常见改动怎么做

### 1. 加一个接口 / 实体

1. `js/mock/seed.js` 加数组（如 `scholarships: []`）；
2. `js/mock/core.js` 的 `RESOURCES` 里加关键字搜索字段；
3. 页面里 `api.list('scholarships', { pageSize: 0 })`。
   服务端不用改：`server/app.js` 直接复用 `core.js`。

### 2. 加一个新页面

1. 建 `js/pages/xxx.js`，照抄一个现有页面的骨架，注册到 `window.Pages.Xxx`；
2. `index.html` 加一行 `<script src="js/pages/xxx.js"></script>`（放在 `router.js` 之前）；
3. `js/router.js` 的 `/` children 里加一条，写 `meta.title/icon/group/roles`；
4. 菜单会自动出现（按角色过滤）。

### 3. 调权限

只改 `js/auth.js`：`ROLES` 加角色、`PERMISSIONS` 加按钮权限码。
路由级权限在该路由的 `meta.roles` 里加角色即可，守卫自动生效；按钮用 `v-perm="'student:add'"`。

---

## 五、接口与数据约定

| 资源 | 关键字段 | 页面 |
|---|---|---|
| students | id, name, gender, className, major, grade, phone, email, status | 吴 |
| teachers / courses / offerings | offerings 含 weekday、timeSlot、room、capacity、enrolled | 吴 |
| selections | studentId, offeringId, courseName, weekday, timeSlot | 石 |
| grades | studentId, courseName, credit, usual, final, total | 石 |
| exams | courseName, date, time, room, invigilator, status | 任 |
| leaves | studentId, type, startDate, endDate, days, reason, status, approver | 任 |
| books / borrows | books 含 isbn、total、available、location；borrows 含 bookId、userId、dueDate、renewCount、status | 王 |
| venues / bookings | bookings 含 date、startTime、endTime、status、approver | 王 |
| messages / receipts | targetRoles、publishAt、attachments；已读 = receipts 里有记录 | 万 |

返回统一为 `{ code: 0, data, message }`，`code !== 0` 时 `data` 为 null，前端统一 `$message.error`。

主要接口：

```
GET  /api/health
POST /api/auth/login
GET  /api/dashboard/stats
GET  /api/messages?userId&role&category&keyword&page&pageSize
POST /api/messages/:id/read | /api/messages/read-all | /api/messages/publish
POST /api/bookings | /api/bookings/:id/approve | /api/bookings/:id/cancel
POST /api/leaves/:id/approve
POST /api/books/:id/borrow | /api/borrows/:id/return | /api/borrows/:id/renew
GET|POST|PUT|DELETE /api/:resource[/:id]      # 通用 CRUD
POST /api/admin/reset
```

`/api/*`（除 health、login）需要请求头 `Authorization: Bearer <token>`，缺失返回 401，前端会自动退回登录页。

---

## 六、5 分钟演示顺序（建议）

1. 学生登录 → 门户看课表/成绩 → 选课 → 预约场地（提交成功，提示待审批）。
2. 管理员登录 → 场地审批通过 → 消息中心看到审批通知、铃铛角标。
3. 教师登录 → 工作台看课表 → 成绩录入/批量保存 → 加权统计与补考名单。
4. 图书管理员登录 → 图书借阅检索/只看可借 → 借阅 → 续借（限 1 次）→ 归还；逾期记录标红。
5. 教务登录 → 学生管理增删改查 + 照片上传 → 排课冲突检测。
6. 学生直接输入 `/#/exams`、教务输入 `/#/campus/library` → 被守卫拦到 403（讲权限设计）。

---

## 七、常见问题

- **端口被占用**：`PORT=3001 npm start`（Windows PowerShell：`$env:PORT=3001; npm start`）。
- **想回到初始数据**：顶栏头像菜单 →「重置演示数据」；或删除 `02_程序源码/server/data/db.json`。
- **改了代码没生效**：无构建，直接刷新浏览器（`Ctrl+F5`）。
- **双击打开和 localhost 有什么区别**：双击时没有后端，自动用本地 Mock，功能（含新增/删除）都在 localStorage 里，适合演示；联调请用 `npm start`。
- **不想用本地 vendor**：`vendor/` 里的就是各库官方 dist 文件，保持离线可用，不要改成 CDN 链接。

---

## 八、Git 协作流程

> 组员第一次接手，先看 [`03_方案与交付文档/组员上手指引.md`](03_方案与交付文档/组员上手指引.md)，里面有从注册 GitHub 到提 PR 的完整步骤和常见报错对照。本节是精简版。

### 1. 第一次拉代码

```bash
git clone <仓库地址> 智慧校园综合管理平台
cd 智慧校园综合管理平台/02_程序源码
npm start
```

不需要 `npm install`。`vendor/` 里已经是各库的 dist 文件，前后端都是零依赖。

### 2. 每人一条自己的分支，不要直接推 main

分支名就用自己负责的模块：

```bash
git checkout -b feature/students     # 吴：学生信息
git checkout -b feature/courses      # 吴：课程排课
git checkout -b feature/exams        # 任：考试考务
git checkout -b feature/library      # 王：图书借阅
git checkout -b feature/grades       # 石：成绩
git checkout -b feature/portal       # 高：学生门户
```

`main` 分支已开启保护规则：**任何人都不能直接推**，必须开 Pull Request；同时禁止强制推送和删除分支。PR 不强制要求他人批准，改完自己就能合并，不会卡流程。组长（万）有管理员权限可绕过，仅用于紧急修复。

### 3. 日常三步

```bash
git pull                  # 先拉，避免冲突堆积
git add -A
git commit -m "feat(students): 学生列表增加班级筛选"
git push
```

提交信息建议 `类型(模块): 说明`，类型用 `feat` / `fix` / `style` / `docs`。例如：
`feat(grades): 成绩表增加加权平均分`、`fix(library): 续借次数判断少算一次`。

### 4. 冲突最多的地方，提前避开

| 情况 | 怎么处理 |
|---|---|
| 两个人改了同一个页面的不同部分 | Git 自动合并，冲突概率低 |
| 两个人改了 `router.js` / `seed.js` / `app.css` | **一定会冲突**。这几份由万统一改，其他人提需求 |
| `server/data/db.json` 出现冲突 | 这个文件已加进 `.gitignore`，正常不会出现；若已被跟踪，`git rm --cached` 后提交 |
| 改了 `index.html` 加脚本 | 只在文件末尾按顺序加自己那一行，不要动别人的 |

冲突了不要慌，打开文件搜 `<<<<<<<`，保留要的内容、删掉标记和多余分支，然后 `git add` + `git commit` 即可。

### 5. 哪些东西不进仓库

已在 `.gitignore` 里排除，不用手动处理：

- `node_modules/`（102MB 的依赖包，组员本地跑 `npm install` 自己生成）
- `02_程序源码/server/data/db.json`（运行时数据，删掉会自动恢复初始 seed）
- 系统与编辑器临时文件（`.DS_Store`、`Thumbs.db`、`.idea/` 等）

`.gitattributes` 已统一换行符为 LF，Windows 和 macOS 组员混用时不会产生整文件 diff。
