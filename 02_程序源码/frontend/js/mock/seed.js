/**
 * 演示种子数据（前后端共用）
 * - 浏览器端由 index.html 直接加载
 * - Node 服务端用 vm 读取同一个文件，保证接口返回与前端本地 mock 完全一致
 * 组员新增实体时：在这里加数组，再到 js/mock/core.js 的 RESOURCES 里登记关键字字段即可。
 */
(function () {
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function day(offset) {
    var d = new Date();
    d.setDate(d.getDate() + offset);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function stamp(offset, time) {
    return day(offset) + ' ' + (time || '09:00');
  }

  window.MOCK_SEED = {
    /* 登录账号：密码统一 123456，角色必须与账号一致 */
    users: [
      { id: 'U001', username: 'admin', password: '123456', name: '张明', role: 'admin', dept: '信息中心', title: '系统管理员' },
      { id: 'U002', username: 'academic', password: '123456', name: '李静', role: 'academic', dept: '教务处', title: '教务管理员' },
      { id: 'U003', username: 'counselor', password: '123456', name: '王强', role: 'counselor', dept: '学生工作处', title: '辅导员' },
      { id: 'U004', username: 'teacher', password: '123456', name: '陈立', role: 'teacher', dept: '计算机学院', title: '副教授', teacherId: 'T001' },
      { id: 'U005', username: 'student', password: '123456', name: '赵敏', role: 'student', dept: '计算机学院', title: '2024 级学生', studentId: 'S2024001' },
      { id: 'U006', username: 'librarian', password: '123456', name: '王琳', role: 'librarian', dept: '图书馆', title: '图书管理员' }
    ],

    /* 学生信息管理页（B） */
    students: [
      { id: 'S2024001', name: '赵敏', gender: '女', grade: '2024', className: '计算机 2401', major: '计算机科学与技术', phone: '13800000001', email: 'zhaomin@campus.edu.cn', status: '在读' },
      { id: 'S2024002', name: '钱伟', gender: '男', grade: '2024', className: '计算机 2401', major: '计算机科学与技术', phone: '13800000002', email: 'qianwei@campus.edu.cn', status: '在读' },
      { id: 'S2024003', name: '孙悦', gender: '女', grade: '2024', className: '计算机 2401', major: '计算机科学与技术', phone: '13800000003', email: 'sunyue@campus.edu.cn', status: '在读' },
      { id: 'S2024004', name: '李浩', gender: '男', grade: '2024', className: '计算机 2402', major: '计算机科学与技术', phone: '13800000004', email: 'lihao@campus.edu.cn', status: '在读' },
      { id: 'S2024005', name: '周雪', gender: '女', grade: '2024', className: '计算机 2402', major: '计算机科学与技术', phone: '13800000005', email: 'zhouxue@campus.edu.cn', status: '在读' },
      { id: 'S2024006', name: '吴磊', gender: '男', grade: '2024', className: '计算机 2402', major: '计算机科学与技术', phone: '13800000006', email: 'wulei@campus.edu.cn', status: '休学' },
      { id: 'S2024007', name: '郑爽', gender: '女', grade: '2024', className: '软件 2401', major: '软件工程', phone: '13800000007', email: 'zhengshuang@campus.edu.cn', status: '在读' },
      { id: 'S2024008', name: '王芳', gender: '女', grade: '2024', className: '软件 2401', major: '软件工程', phone: '13800000008', email: 'wangfang@campus.edu.cn', status: '在读' },
      { id: 'S2024009', name: '冯涛', gender: '男', grade: '2024', className: '软件 2401', major: '软件工程', phone: '13800000009', email: 'fengtao@campus.edu.cn', status: '在读' },
      { id: 'S2024010', name: '陈晨', gender: '女', grade: '2024', className: '软件 2402', major: '软件工程', phone: '13800000010', email: 'chenchen@campus.edu.cn', status: '在读' }
    ],

    teachers: [
      { id: 'T001', name: '陈立', title: '副教授', dept: '计算机学院', phone: '13900000001' },
      { id: 'T002', name: '周雯', title: '讲师', dept: '计算机学院', phone: '13900000002' },
      { id: 'T003', name: '刘海', title: '教授', dept: '数学学院', phone: '13900000003' },
      { id: 'T004', name: '孙倩', title: '讲师', dept: '外国语学院', phone: '13900000004' },
      { id: 'T005', name: '高鹏', title: '讲师', dept: '体育学院', phone: '13900000005' }
    ],

    /* 课程与排课管理页（B）：courses 为课程库，offerings 为开课计划/排课结果 */
    courses: [
      { id: 'C001', code: 'MATH1001', name: '高等数学', credit: 4, type: '必修', dept: '数学学院', teacherId: 'T003' },
      { id: 'C002', code: 'CS2001', name: '数据结构', credit: 3.5, type: '必修', dept: '计算机学院', teacherId: 'T001' },
      { id: 'C003', code: 'CS2002', name: '计算机网络', credit: 3, type: '必修', dept: '计算机学院', teacherId: 'T002' },
      { id: 'C004', code: 'CS2003', name: '数据库原理', credit: 3, type: '必修', dept: '计算机学院', teacherId: 'T001' },
      { id: 'C005', code: 'CS3001', name: '人工智能导论', credit: 2, type: '选修', dept: '计算机学院', teacherId: 'T002' },
      { id: 'C006', code: 'ENG1001', name: '大学英语', credit: 3, type: '必修', dept: '外国语学院', teacherId: 'T004' },
      { id: 'C007', code: 'CS2004', name: '软件工程', credit: 2.5, type: '必修', dept: '计算机学院', teacherId: 'T002' },
      { id: 'C008', code: 'PE1001', name: '大学体育', credit: 1, type: '必修', dept: '体育学院', teacherId: 'T005' }
    ],

    offerings: [
      { id: 'O0001', courseId: 'C002', courseName: '数据结构', teacherId: 'T001', teacherName: '陈立', className: '计算机 2401', weekday: '周一', timeSlot: '第 1-2 节', room: 'A301', capacity: 60, enrolled: 52 },
      { id: 'O0002', courseId: 'C003', courseName: '计算机网络', teacherId: 'T002', teacherName: '周雯', className: '计算机 2401', weekday: '周二', timeSlot: '第 3-4 节', room: 'A302', capacity: 60, enrolled: 48 },
      { id: 'O0003', courseId: 'C004', courseName: '数据库原理', teacherId: 'T001', teacherName: '陈立', className: '计算机 2402', weekday: '周三', timeSlot: '第 1-2 节', room: 'A301', capacity: 60, enrolled: 45 },
      { id: 'O0004', courseId: 'C001', courseName: '高等数学', teacherId: 'T003', teacherName: '刘海', className: '计算机 2401', weekday: '周一', timeSlot: '第 3-4 节', room: 'B201', capacity: 90, enrolled: 88 },
      { id: 'O0005', courseId: 'C006', courseName: '大学英语', teacherId: 'T004', teacherName: '孙倩', className: '软件 2401', weekday: '周四', timeSlot: '第 1-2 节', room: 'C101', capacity: 45, enrolled: 41 },
      { id: 'O0006', courseId: 'C005', courseName: '人工智能导论', teacherId: 'T002', teacherName: '周雯', className: '软件 2401', weekday: '周五', timeSlot: '第 5-6 节', room: 'A401', capacity: 50, enrolled: 49 },
      { id: 'O0007', courseId: 'C007', courseName: '软件工程', teacherId: 'T002', teacherName: '周雯', className: '软件 2401', weekday: '周二', timeSlot: '第 1-2 节', room: 'A303', capacity: 50, enrolled: 38 },
      { id: 'O0008', courseId: 'C008', courseName: '大学体育', teacherId: 'T005', teacherName: '高鹏', className: '计算机 2402', weekday: '周五', timeSlot: '第 3-4 节', room: '体育馆', capacity: 80, enrolled: 60 }
    ],

    /* 选课记录（C 组员使用）：一条记录 = 某个学生选了某个开课班 */
    selections: [],

    /* 成绩管理页（C） */
    grades: [
      { id: 'G0001', studentId: 'S2024001', studentName: '赵敏', courseId: 'C002', courseName: '数据结构', credit: 3.5, usual: 88, final: 92, total: 90, term: '2026-2027-1' },
      { id: 'G0002', studentId: 'S2024001', studentName: '赵敏', courseId: 'C003', courseName: '计算机网络', credit: 3, usual: 85, final: 88, total: 87, term: '2026-2027-1' },
      { id: 'G0003', studentId: 'S2024002', studentName: '钱伟', courseId: 'C002', courseName: '数据结构', credit: 3.5, usual: 72, final: 65, total: 68, term: '2026-2027-1' },
      { id: 'G0004', studentId: 'S2024002', studentName: '钱伟', courseId: 'C001', courseName: '高等数学', credit: 4, usual: 80, final: 76, total: 78, term: '2026-2027-1' },
      { id: 'G0005', studentId: 'S2024003', studentName: '孙悦', courseId: 'C005', courseName: '人工智能导论', credit: 2, usual: 94, final: 96, total: 95, term: '2026-2027-1' },
      { id: 'G0006', studentId: 'S2024004', studentName: '李浩', courseId: 'C002', courseName: '数据结构', credit: 3.5, usual: 56, final: 48, total: 52, term: '2026-2027-1' },
      { id: 'G0007', studentId: 'S2024005', studentName: '周雪', courseId: 'C006', courseName: '大学英语', credit: 3, usual: 90, final: 86, total: 88, term: '2026-2027-1' },
      { id: 'G0008', studentId: 'S2024007', studentName: '郑爽', courseId: 'C007', courseName: '软件工程', credit: 2.5, usual: 78, final: 82, total: 80, term: '2026-2027-1' }
    ],

    /* 考试与考务页（D） */
    exams: [
      { id: 'E0001', courseName: '数据结构', className: '计算机 2401', date: day(21), time: '09:00-11:00', room: 'A301', invigilator: '陈立 / 周雯', type: '期末考试', status: '已排考' },
      { id: 'E0002', courseName: '高等数学', className: '计算机 2401', date: day(22), time: '14:00-16:00', room: 'B201', invigilator: '刘海', type: '期末考试', status: '已排考' },
      { id: 'E0003', courseName: '计算机网络', className: '计算机 2401', date: day(23), time: '09:00-11:00', room: 'A302', invigilator: '待分配', type: '期末考试', status: '待排考' },
      { id: 'E0004', courseName: '软件工程', className: '软件 2401', date: day(24), time: '14:00-16:00', room: 'A303', invigilator: '周雯', type: '期末考试', status: '已排考' }
    ],

    /* 学工与请假页（D） */
    leaves: [
      { id: 'L0001', studentId: 'S2024002', studentName: '钱伟', className: '计算机 2401', type: '病假', startDate: day(-2), endDate: day(-1), days: 2, reason: '发烧就医，附医院证明', status: '已通过', approver: '王强', createdAt: stamp(-3, '10:20') },
      { id: 'L0002', studentId: 'S2024004', studentName: '李浩', className: '计算机 2402', type: '事假', startDate: day(1), endDate: day(1), days: 1, reason: '参加校外竞赛', status: '待审批', approver: '', createdAt: stamp(-1, '16:40') },
      { id: 'L0003', studentId: 'S2024005', studentName: '周雪', className: '计算机 2402', type: '病假', startDate: day(0), endDate: day(2), days: 3, reason: '住院观察', status: '待审批', approver: '', createdAt: stamp(0, '08:15') },
      { id: 'L0004', studentId: 'S2024007', studentName: '郑爽', className: '软件 2401', type: '事假', startDate: day(-7), endDate: day(-6), days: 2, reason: '家中有事', status: '已驳回', approver: '王强', createdAt: stamp(-8, '09:05') }
    ],

    /* 校园场地预约页（E）：venue 场地，booking 预约单 */
    venues: [
      { id: 'V001', name: 'A301 教室', type: '教室', building: 'A 栋', floor: '3 层', capacity: 60, equipment: ['投影', '空调'], openHours: '08:00-22:00', status: '可用' },
      { id: 'V002', name: 'A302 教室', type: '教室', building: 'A 栋', floor: '3 层', capacity: 60, equipment: ['投影'], openHours: '08:00-22:00', status: '可用' },
      { id: 'V003', name: 'B201 阶梯教室', type: '教室', building: 'B 栋', floor: '2 层', capacity: 90, equipment: ['投影', '音响', '空调'], openHours: '08:00-21:00', status: '可用' },
      { id: 'V004', name: '第一会议室', type: '会议室', building: '行政楼', floor: '5 层', capacity: 30, equipment: ['大屏', '视频会议'], openHours: '08:30-18:00', status: '可用' },
      { id: 'V005', name: '体育馆', type: '场馆', building: '体育中心', floor: '1 层', capacity: 200, equipment: ['灯光', '音响'], openHours: '07:00-22:00', status: '可用' },
      { id: 'V006', name: '语音室 C101', type: '教室', building: 'C 栋', floor: '1 层', capacity: 45, equipment: ['耳机', '投影'], openHours: '08:00-18:00', status: '维护中' }
    ],

    bookings: [
      { id: 'BK0001', venueId: 'V001', venueName: 'A301 教室', applicantId: 'S2024001', applicantName: '赵敏', applicantRole: 'student', date: day(2), startTime: '19:00', endTime: '21:00', purpose: '社团例会', attendees: 20, contact: '13800000001', status: '已通过', approver: '张明', remark: '注意保持教室卫生', createdAt: stamp(-1, '20:10') },
      { id: 'BK0002', venueId: 'V004', venueName: '第一会议室', applicantId: 'U002', applicantName: '李静', applicantRole: 'academic', date: day(3), startTime: '14:00', endTime: '16:00', purpose: '教学研讨会', attendees: 25, contact: '13700000002', status: '待审批', approver: '', remark: '', createdAt: stamp(0, '09:30') },
      { id: 'BK0003', venueId: 'V002', venueName: 'A302 教室', applicantId: 'U004', applicantName: '陈立', applicantRole: 'teacher', date: day(4), startTime: '10:00', endTime: '12:00', purpose: '课程补课', attendees: 40, contact: '13900000001', status: '待审批', approver: '', remark: '', createdAt: stamp(0, '11:05') }
    ],

    /* 图书借阅页（王）：books 馆藏，borrows 借阅记录 */
    books: [
      { id: 'B0001', isbn: '9787111544937', title: '深入理解计算机系统', author: 'Randal E. Bryant', category: '教材', publisher: '机械工业出版社', total: 6, available: 4, location: 'A 区 3 排' },
      { id: 'B0002', isbn: '9787302147514', title: '数据结构（C 语言版）', author: '严蔚敏', category: '教材', publisher: '清华大学出版社', total: 8, available: 2, location: 'A 区 1 排' },
      { id: 'B0003', isbn: '9787115461476', title: '人工智能：一种现代的方法', author: 'Stuart Russell', category: '科技', publisher: '人民邮电出版社', total: 4, available: 0, location: 'B 区 2 排' },
      { id: 'B0004', isbn: '9787506365437', title: '活着', author: '余华', category: '文学', publisher: '作家出版社', total: 10, available: 7, location: 'C 区 4 排' },
      { id: 'B0005', isbn: '9787508647357', title: '人类简史', author: '尤瓦尔·赫拉利', category: '历史', publisher: '中信出版社', total: 5, available: 3, location: 'C 区 1 排' },
      { id: 'B0006', isbn: '9787121302954', title: '计算机网络（第 8 版）', author: '谢希仁', category: '教材', publisher: '电子工业出版社', total: 7, available: 5, location: 'A 区 2 排' },
      { id: 'B0007', isbn: '9787544299077', title: '设计中的设计', author: '原研哉', category: '艺术', publisher: '山东人民出版社', total: 3, available: 1, location: 'D 区 2 排' },
      { id: 'B0008', isbn: '9787530216781', title: '平凡的世界', author: '路遥', category: '文学', publisher: '北京十月文艺出版社', total: 6, available: 4, location: 'C 区 5 排' }
    ],

    borrows: [
      { id: 'BR0001', bookId: 'B0001', bookTitle: '深入理解计算机系统', userId: 'U005', userName: '赵敏', userRole: 'student', borrowDate: day(-12), dueDate: day(18), returnDate: '', status: '借阅中', renewCount: 0 },
      { id: 'BR0002', bookId: 'B0002', bookTitle: '数据结构（C 语言版）', userId: 'U004', userName: '陈立', userRole: 'teacher', borrowDate: day(-40), dueDate: day(-10), returnDate: '', status: '借阅中', renewCount: 1 },
      { id: 'BR0003', bookId: 'B0004', bookTitle: '活着', userId: 'U005', userName: '赵敏', userRole: 'student', borrowDate: day(-60), dueDate: day(-30), returnDate: day(-35), status: '已归还', renewCount: 0 }
    ],

    /* 消息中心（A） */
    messages: [
      { id: 'M0001', category: '教学', title: '2026-2027 学年第一学期期末考试安排', content: '各位老师、同学：本学期期末考试将于第 17-18 教学周进行，请任课教师于考前一周完成试卷提交与考场确认，学生可在「考试与考务」页面查看个人考试安排。', senderName: '李静', senderRole: 'academic', targetRoles: ['teacher', 'student'], publishAt: stamp(-1, '09:00'), attachments: [{ name: '期末考试安排.pdf', size: '1.2 MB' }], status: 'published', pinned: true },
      { id: 'M0002', category: '系统', title: '系统维护通知：本周六 00:00-02:00 暂停服务', content: '为提升系统稳定性，信息中心将于本周六凌晨进行数据库升级，期间平台暂停访问，请提前保存工作内容。', senderName: '张明', senderRole: 'admin', targetRoles: ['all'], publishAt: stamp(-2, '17:30'), attachments: [], status: 'published', pinned: false },
      { id: 'M0003', category: '审批', title: '场地预约审批结果：A301 教室', content: '你提交的 A301 教室预约（19:00-21:00，社团例会）已通过审批，请按时使用并遵守场地管理规定。', senderName: '张明', senderRole: 'admin', targetRoles: ['student'], publishAt: stamp(-1, '20:30'), attachments: [], status: 'published', pinned: false },
      { id: 'M0004', category: '活动', title: '校园歌手大赛开始报名', content: '第十届校园歌手大赛即日起开放报名，报名截止至下周五，欢迎各年级同学踊跃参加。', senderName: '王强', senderRole: 'counselor', targetRoles: ['student', 'teacher'], publishAt: stamp(-3, '14:00'), attachments: [], status: 'published', pinned: false },
      { id: 'M0005', category: '教学', title: '成绩录入截止提醒（教师）', content: '请各位任课教师于本月 25 日前完成成绩录入与提交，逾期系统将关闭录入入口。', senderName: '李静', senderRole: 'academic', targetRoles: ['teacher'], publishAt: stamp(0, '08:40'), attachments: [], status: 'published', pinned: false }
    ],

    receipts: [
      { id: 'R0001', messageId: 'M0002', userId: 'U001', readAt: stamp(-2, '18:00') }
    ]
  };
})();
