/* 全局配置：所有可调参数集中在这里，组员不要散落硬编码 */
window.APP_CONFIG = {
  APP_NAME: '智慧校园综合管理平台',
  SUB_TITLE: 'Smart Campus Management Platform',
  API_BASE: 'http://localhost:3000/api',
  HEALTH_TIMEOUT: 1200,
  STORAGE: {
    TOKEN: 'campus_token',
    USER: 'campus_user',
    MOCK_DB: 'campus_mock_db'
  },
  // 登录页展示的测试账号，方便组内演示；正式答辩前可删掉
  DEMO_ACCOUNTS: [
    { role: 'admin', username: 'admin', password: '123456', desc: '全部权限' },
    { role: 'academic', username: 'academic', password: '123456', desc: '教务主线' },
    { role: 'counselor', username: 'counselor', password: '123456', desc: '学工审批' },
    { role: 'teacher', username: 'teacher', password: '123456', desc: '教学与成绩' },
    { role: 'student', username: 'student', password: '123456', desc: '选课与查询' },
    { role: 'librarian', username: 'librarian', password: '123456', desc: '借还与场馆审批' }
  ]
};
