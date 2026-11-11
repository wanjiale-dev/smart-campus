# 智慧校园综合管理平台

Vue2 + Vue Router + Vuex + Element UI + axios + ECharts。不用打包，不用装依赖。

13 个页面已经按组员拆成各自独立的文件，登录、路由守卫、6 个角色的菜单和按钮权限都通了，可以直接分头改。

## 怎么跑

只想看界面：双击 `02_程序源码/frontend/index.html`，数据走浏览器本地 Mock（localStorage），刷新不丢。

要联调接口：

```bash
cd 02_程序源码
npm start          # 没装依赖也能直接跑
```

打开 <http://localhost:3000> 就行。

前端启动时会探一下 `/api/health`。通了走真实接口，顶栏显示「接口模式」；不通自动退回本地 Mock，顶栏显示「本地 Mock」。也可以手动指定，地址后面加 `?api=local` 或 `?api=remote`。

账号密码统一 `123456`：

| 角色 | 账号 | 登录后首页 |
|---|---|---|
| 管理员 | admin | 数据总览 |
| 教务管理员 | academic | 数据总览 |
| 辅导员 | counselor | 数据总览 |
| 教师 | teacher | 教师工作台 |
| 学生 | student | 学生端门户 |
| 图书管理员 | librarian | 图书借阅 |

验证码本地生成，4 位字符，点一下换一张，不分大小写。

## 目录

```
智慧校园综合管理平台/
├─ 01_项目文档与任务书/              # 选题、分工截图，只读，别改
├─ 02_程序源码/
│  ├─ frontend/                     # 前端，无构建
│  │  ├─ index.html                 # 入口
│  │  ├─ css/app.css
│  │  ├─ vendor/                    # vue / vue-router / vuex / element-ui / axios / echarts
│  │  └─ js/
│  │     ├─ config.js               # 接口地址、本地存储 key、测试账号
│  │     ├─ api.js                  # 统一请求层，remote / local 双模式
│  │     ├─ auth.js                 # 角色与权限，只在这一处定义
│  │     ├─ store.js                # Vuex：登录态、当前用户、未读数
│  │     ├─ router.js               # 路由表 + 登录 / 越权守卫
│  │     ├─ app.js
│  │     ├─ layout/AppLayout.js     # 侧边菜单 + 顶栏 + 内容区
│  │     ├─ components/page-header.js
│  │     ├─ mock/
│  │     │  ├─ seed.js              # 假数据，前后端共用
│  │     │  ├─ core.js              # Mock 业务内核（UMD，服务端 require 同一份）
│  │     │  └─ local-api.js         # 浏览器端适配，存 localStorage
│  │     └─ pages/                  # 每人只改自己的文件
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
│  │        ├─ library.js           # 王，六人版新增
│  │        ├─ campus-venue.js      # 王，拓展页
│  │        └─ message-center.js    # 万，拓展页
│  ├─ server/
│  │  ├─ app.js                     # Mock 后端 + 静态托管
│  │  └─ data/db.json               # 首次写操作后自动生成，不进仓库
│  └─ package.json
├─ 03_方案与交付文档/
│  ├─ 起步方案.md                    # 范围、节奏、分工、评分点
│  ├─ 组员上手指引.md                # 从注册 GitHub 到提 PR，新人先看这个
│  ├─ Mock数据结构说明.md            # 15 个实体的字段、关系、枚举和业务约束
│  └─ 页面原型.html                  # 13 屏低保真线框，双击打开
└─ 04_过程稿与归档/                  # 旧版本和临时脚本，留个底，不用管
   └─ 项目启动阶段-2026-11-11/
      ├─ 自测脚本/
      └─ vendor-src/
```

## 谁改哪个文件

| 组员 | 负责页面 | 文件（都在 `frontend/js/pages/` 下） |
|---|---|---|
| 吴 | 学生信息、课程排课 | `pages/students.js`、`pages/courses.js` |
| 万 | 登录、数据总览、消息中心 | `pages/login.js`、`pages/dashboard.js`、`pages/message-center.js` |
| 任 | 考试考务、学工请假 | `pages/exams.js`、`pages/student-affairs.js` |
| 王 | 图书借阅、场地预约 | `pages/library.js`、`pages/campus-venue.js` |
| 石 | 选课、成绩 | `pages/course-selection.js`、`pages/grades.js` |
| 高 | 教师工作台、学生门户 | `pages/teacher-workbench.js`、`pages/student-portal.js` |

公共文件 `router.js`、`auth.js`、`api.js`、`seed.js`、`app.css` 由万统一改。其他人要用，先在群里说一声，不然肯定撞车。

如果按 5 人做，去掉图书借阅页和图书管理员角色，其余页面按 PDF 的 A–E 合并，具体见 `03_方案与交付文档/起步方案.md` 的 §3.3。

每个页面头部有个 `<page-header>`，上面列了这个页面必做和选做的功能，改的时候对着看就行，不用翻 PDF。

## 页面原型

`03_方案与交付文档/页面原型.html`，双击打开，不用起服务。

13 屏按侧边菜单分组，左边点着切，也支持 `#dashboard` 这种直达链接。每屏标了对应的页面文件、主责组员，以及任务书要求的必做、选做项。表里的数据取自 `seed.js`，和跑起来的界面一致。

要交给老师或者打印，先点右上角「全部展开」再打印，单页模式只会打印当前这一屏。

## 常见改动

**加一个实体或接口**

在 `js/mock/seed.js` 加数组，比如 `scholarships: []`；在 `js/mock/core.js` 的 `RESOURCES` 里补上要参与关键字搜索的字段；页面里用 `api.list('scholarships', { pageSize: 0 })` 取。服务端不用动，`server/app.js` 直接 require 同一份 `core.js`。

**加一个页面**

建 `js/pages/xxx.js`，照抄一个现有页面的骨架，注册成 `window.Pages.Xxx`；在 `index.html` 里加一行 `<script src="js/pages/xxx.js"></script>`，位置放在 `router.js` 前面；再到 `js/router.js` 的 `/` children 下加一条，写 `meta.title`、`icon`、`group`、`roles`。菜单会自己出来，按角色过滤。

**调权限**

只改 `js/auth.js`，`ROLES` 加角色，`PERMISSIONS` 加按钮权限码。路由级的权限加在该路由的 `meta.roles` 里，守卫自动生效。按钮上写 `v-perm="'student:add'"`。

## 接口约定

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
| messages / receipts | targetRoles、publishAt、attachments；已读就是 receipts 里有记录 | 万 |

返回统一是 `{ code: 0, data, message }`。`code` 不为 0 时 `data` 是 null，前端直接 `$message.error`。

字段定义、枚举取值和业务约束在 `03_方案与交付文档/Mock数据结构说明.md`，上面那张表只是索引，写页面前按那份文档对字段。

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

除了 health 和 login，`/api/*` 都要带 `Authorization: Bearer <token>`，不带返回 401，前端会自动退回登录页。

## 演示顺序

1. 学生登录，看课表成绩，选课，预约场地，提示待审批
2. 管理员登录，场地审批通过，消息中心收到通知，铃铛出角标
3. 教师登录，工作台看课表，成绩录入和批量保存，出加权统计和补考名单
4. 图书管理员登录，检索图书，只看可借，借阅，续借（限一次），归还，逾期记录标红
5. 教务登录，学生管理增删改查加照片上传，排课冲突检测
6. 学生手动输 `/#/exams`、教务输 `/#/campus/library`，被守卫拦到 403

## 常见问题

**端口被占用**：`PORT=3001 npm start`。PowerShell 下写 `$env:PORT=3001; npm start`。

**想回到初始数据**：顶栏头像菜单里点「重置演示数据」，或者删掉 `02_程序源码/server/data/db.json`。

**改了代码没生效**：没有构建步骤，刷新浏览器就行，`Ctrl+F5` 强制刷新。

**双击打开和 localhost 有什么区别**：双击时没有后端，走本地 Mock，增删改都在 localStorage 里，演示够用；要联调就用 `npm start`。

**能不能把 vendor 换成 CDN**：`vendor/` 里都是各库官方 dist 文件，保持离线可用，别换。

## Git 协作

第一次接手的先看 [组员上手指引](03_方案与交付文档/组员上手指引.md)，注册账号、装 Git、提 PR 都在里面，还有常见报错对照。

拉代码：

```bash
git clone https://github.com/wanjiale-dev/smart-campus.git
cd smart-campus/02_程序源码
npm start
```

每人一条自己的分支，名字用自己负责的模块：

```bash
git checkout -b feature/students     # 吴，学生信息
git checkout -b feature/courses      # 吴，课程排课
git checkout -b feature/exams        # 任，考试考务
git checkout -b feature/library      # 王，图书借阅
git checkout -b feature/grades       # 石，成绩
git checkout -b feature/portal       # 高，学生门户
```

`main` 开了保护，推不上去，得开 Pull Request。也不允许强制推送和删分支。PR 不要求别人批准，自己提自己合，不会卡住。万是管理员，紧急情况能直接推。

日常就三步：

```bash
git pull
git add -A
git commit -m "feat(students): 学生列表增加班级筛选"
git push
```

提交信息写 `类型(模块): 说明`，类型用 `feat`、`fix`、`style`、`docs`。

容易冲突的几处：两个人同时改 `router.js`、`seed.js`、`app.css` 一定冲，这几份归万改；`index.html` 加脚本只在末尾加自己那一行，别动别人的；`db.json` 已经在 `.gitignore` 里，正常不会出现。

真冲突了，打开文件搜 `<<<<<<<`，留下要的，把标记和多余那份删掉，然后 `git add` 再 `git commit`。

`node_modules/`、`db.json`、系统临时文件都不进仓库，`.gitignore` 里配好了，不用手动处理。仓库加了 `.gitattributes` 统一用 LF，Windows 和 macOS 混着用也不会整个文件飘红。
