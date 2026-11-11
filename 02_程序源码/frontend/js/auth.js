/**
 * 角色与权限定义 —— 全站唯一的权限真相来源
 * 登录页的角色卡、侧边菜单、路由守卫、按钮权限都读这里。
 *
 * 路由角色控制在 js/router.js 的 meta.roles；
 * 按钮级权限用 v-perm="'student:add'" 或 this.$can('student:add')。
 */
(function () {
  var cfg = window.APP_CONFIG;

  var ROLES = {
    admin: { key: 'admin', name: '管理员', desc: '全部功能与审批', home: '/dashboard' },
    academic: { key: 'academic', name: '教务管理员', desc: '学籍 / 排课 / 考务', home: '/dashboard' },
    counselor: { key: 'counselor', name: '辅导员', desc: '学工 / 请假审批', home: '/dashboard' },
    teacher: { key: 'teacher', name: '教师', desc: '教学 / 成绩 / 工作台', home: '/teacher/workbench' },
    student: { key: 'student', name: '学生', desc: '选课 / 成绩 / 门户', home: '/student/portal' },
    librarian: { key: 'librarian', name: '图书管理员', desc: '图书借阅 / 场馆审批', home: '/campus/library' }
  };

  var PERMISSIONS = {
    admin: ['*'],
    academic: [
      'student:add', 'student:edit', 'student:remove', 'student:export',
      'course:add', 'course:edit', 'exam:edit', 'grade:edit', 'grade:import',
      'venue:approve', 'message:publish'
    ],
    counselor: ['student:view', 'leave:approve', 'venue:apply', 'message:publish'],
    teacher: ['grade:edit', 'grade:export', 'venue:apply', 'message:publish', 'workbench:review',
      'book:borrow', 'book:return', 'book:renew'],
    student: ['course:select', 'leave:apply', 'venue:apply',
      'book:borrow', 'book:return', 'book:renew'],
    librarian: [
      'book:add', 'book:edit', 'book:borrow', 'book:return', 'book:renew',
      'venue:approve', 'message:publish'
    ]
  };

  function getToken() {
    return localStorage.getItem(cfg.STORAGE.TOKEN) || '';
  }
  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(cfg.STORAGE.USER) || 'null');
    } catch (e) {
      return null;
    }
  }
  function setSession(token, user) {
    localStorage.setItem(cfg.STORAGE.TOKEN, token);
    localStorage.setItem(cfg.STORAGE.USER, JSON.stringify(user));
  }
  function clearSession() {
    localStorage.removeItem(cfg.STORAGE.TOKEN);
    localStorage.removeItem(cfg.STORAGE.USER);
  }
  function can(code, user) {
    var current = user || getUser();
    if (!current) return false;
    var list = PERMISSIONS[current.role] || [];
    return list.indexOf('*') > -1 || list.indexOf(code) > -1;
  }
  function roleName(key) {
    return (ROLES[key] && ROLES[key].name) || key;
  }
  function homeOf(user) {
    var current = user || getUser();
    return (current && ROLES[current.role] && ROLES[current.role].home) || '/login';
  }

  window.Auth = {
    ROLES: ROLES,
    PERMISSIONS: PERMISSIONS,
    getToken: getToken,
    getUser: getUser,
    setSession: setSession,
    clearSession: clearSession,
    can: can,
    roleName: roleName,
    homeOf: homeOf
  };
})();
