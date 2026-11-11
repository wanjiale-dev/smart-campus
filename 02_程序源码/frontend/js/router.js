/**
 * 路由表：13 个核心页面 + 登录 + 403/404
 * meta 字段说明：
 *   title  菜单与面包屑名称
 *   icon   侧边菜单图标（Element UI 图标类名）
 *   group  菜单分组
 *   roles  允许访问的角色（路由守卫会拦截越权访问）
 *   hidden 不在菜单中显示
 */
(function () {
  var Forbidden = {
    template: [
      '<div style="padding:80px 0;text-align:center;">',
      '  <h2 style="font-size:22px;color:#222b3d;">403 无访问权限</h2>',
      '  <p style="color:#8a93a6;margin:12px 0 24px;">当前角色没有该页面的访问权限，请切换角色后重试。</p>',
      '  <el-button type="primary" @click="$router.replace(Auth.homeOf())">回到我的首页</el-button>',
      '</div>'
    ].join('')
  };

  var NotFound = {
    template: [
      '<div style="padding:80px 0;text-align:center;">',
      '  <h2 style="font-size:22px;color:#222b3d;">404 页面不存在</h2>',
      '  <p style="color:#8a93a6;margin:12px 0 24px;">地址可能已变更，请从左侧菜单进入。</p>',
      '  <el-button type="primary" @click="$router.replace(Auth.homeOf())">回到我的首页</el-button>',
      '</div>'
    ].join('')
  };

  var ALL = ['admin', 'academic', 'counselor', 'teacher', 'student', 'librarian'];

  var routes = [
    { path: '/login', name: 'login', component: window.Pages.Login, meta: { title: '登录', public: true, hidden: true } },
    { path: '/403', name: 'forbidden', component: Forbidden, meta: { title: '无权限', public: true, hidden: true } },
    { path: '/404', name: 'notFound', component: NotFound, meta: { title: '页面不存在', public: true, hidden: true } },
    {
      path: '/',
      component: window.AppLayout,
      // 各角色首页不同（教师 → 工作台、学生 → 门户、图书管理员 → 借阅），登录后落到各自的主页
      redirect: function () { return Auth.homeOf(); },
      children: [
        { path: 'dashboard', name: 'dashboard', component: window.Pages.Dashboard,
          meta: { title: '数据总览', icon: 'el-icon-data-line', group: '总览', roles: ['admin', 'academic', 'counselor'] } },

        { path: 'students', name: 'students', component: window.Pages.Students,
          meta: { title: '学生信息管理', icon: 'el-icon-user', group: '教务管理', roles: ['admin', 'academic', 'counselor'] } },
        { path: 'courses', name: 'courses', component: window.Pages.Courses,
          meta: { title: '课程与排课', icon: 'el-icon-reading', group: '教务管理', roles: ['admin', 'academic', 'teacher'] } },
        { path: 'course-selection', name: 'courseSelection', component: window.Pages.CourseSelection,
          meta: { title: '选课管理', icon: 'el-icon-s-order', group: '教务管理', roles: ['admin', 'academic', 'student'] } },
        { path: 'grades', name: 'grades', component: window.Pages.Grades,
          meta: { title: '成绩管理', icon: 'el-icon-tickets', group: '教务管理', roles: ['admin', 'academic', 'teacher', 'student'] } },
        { path: 'exams', name: 'exams', component: window.Pages.Exams,
          meta: { title: '考试与考务', icon: 'el-icon-date', group: '教务管理', roles: ['admin', 'academic', 'teacher'] } },

        { path: 'student-affairs', name: 'studentAffairs', component: window.Pages.StudentAffairs,
          meta: { title: '学工与请假', icon: 'el-icon-document', group: '学生事务', roles: ['admin', 'academic', 'counselor'] } },
        { path: 'teacher/workbench', name: 'teacherWorkbench', component: window.Pages.TeacherWorkbench,
          meta: { title: '教师工作台', icon: 'el-icon-s-home', group: '学生事务', roles: ['admin', 'teacher'] } },
        { path: 'student/portal', name: 'studentPortal', component: window.Pages.StudentPortal,
          meta: { title: '学生端门户', icon: 'el-icon-s-custom', group: '学生事务', roles: ['admin', 'student'] } },

        { path: 'campus/library', name: 'campusLibrary', component: window.Pages.Library,
          meta: { title: '图书借阅', icon: 'el-icon-notebook-2', group: '校园服务', roles: ['admin', 'librarian', 'teacher', 'student'] } },
        { path: 'campus/venue', name: 'campusVenue', component: window.Pages.CampusVenue,
          meta: { title: '场地预约', icon: 'el-icon-office-building', group: '校园服务', roles: ALL } },

        { path: 'message/center', name: 'messageCenter', component: window.Pages.MessageCenter,
          meta: { title: '消息中心', icon: 'el-icon-chat-dot-round', group: '消息', roles: ALL } }
      ]
    },
    { path: '*', redirect: '/404' }
  ];

  var router = new VueRouter({
    mode: 'hash',
    routes: routes
  });

  router.beforeEach(function (to, from, next) {
    var token = Auth.getToken();
    var user = Auth.getUser();

    if (to.meta && to.meta.public) {
      if (to.path === '/login' && token && user) {
        return next(Auth.homeOf(user));
      }
      return next();
    }

    if (!token || !user) {
      return next({ path: '/login', query: { redirect: to.fullPath } });
    }

    var roles = to.meta && to.meta.roles;
    if (roles && roles.length && roles.indexOf(user.role) === -1) {
      return next('/403');
    }
    next();
  });

  router.afterEach(function (to) {
    document.title = (to.meta && to.meta.title ? to.meta.title + ' · ' : '') + window.APP_CONFIG.APP_NAME;
  });

  window.router = router;
})();
