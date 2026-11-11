/**
 * 页面 9：教师工作台页 ｜ 主责 E
 * 必做：我的课表、待批作业、成绩提交状态
 * 选做：作业在线批改、消息通知、快捷跳转
 */
(function () {
  var WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'];
  var SLOTS = ['第 1-2 节', '第 3-4 节', '第 5-6 节', '第 7-8 节'];

  var TeacherWorkbenchPage = {
    name: 'TeacherWorkbenchPage',
    data: function () {
      return {
        loading: false,
        offerings: [],
        weekdays: WEEKDAYS,
        slots: SLOTS,
        homeworks: [
          { id: 'H1', course: '数据结构', title: '实验三：二叉树遍历', submitted: 46, total: 52, deadline: '本周五 18:00' },
          { id: 'H2', course: '数据库原理', title: '课程设计开题报告', submitted: 39, total: 45, deadline: '下周一 12:00' }
        ],
        notices: []
      };
    },
    computed: {
      user: function () { return this.$store.state.user || {}; },
      teacherId: function () { return this.user.teacherId || 'T001'; },
      myCourses: function () {
        var self = this;
        return this.offerings.filter(function (o) { return o.teacherId === self.teacherId; });
      },
      totalStudents: function () {
        return this.myCourses.reduce(function (sum, o) { return sum + Number(o.enrolled || 0); }, 0);
      },
      cards: function () {
        return [
          { label: '本学期课程', value: this.myCourses.length, foot: '任教班级 ' + new Set(this.myCourses.map(function (o) { return o.className; })).size + ' 个', icon: 'el-icon-reading', color: '#3a63d6' },
          { label: '授课学生', value: this.totalStudents, foot: '含合班人数', icon: 'el-icon-user', color: '#12b886' },
          { label: '待批作业', value: this.homeworks.length, foot: '最近截止：本周五', icon: 'el-icon-edit-outline', color: '#f59f00' },
          { label: '成绩待提交', value: this.myCourses.length, foot: '提交截止：本月 25 日', icon: 'el-icon-tickets', color: '#7c5cd6' }
        ];
      }
    },
    created: function () {
      this.load();
    },
    methods: {
      load: function () {
        var self = this;
        this.loading = true;
        Promise.all([
          api.list('offerings', { teacherId: this.teacherId, pageSize: 0 }),
          api.messages({ userId: this.user.id, role: this.user.role, pageSize: 3 })
        ]).then(function (res) {
          self.offerings = res[0].list;
          self.notices = res[1].list;
        }).catch(function (error) {
          self.$message.error(error.message);
        }).then(function () {
          self.loading = false;
        });
      },
      cell: function (weekday, slot) {
        return this.myCourses.filter(function (o) { return o.weekday === weekday && o.timeSlot === slot; });
      },
      go: function (path) {
        this.$router.push(path).catch(function () {});
      }
    },
    template: [
      '<div class="page" v-loading="loading">',
      '  <page-header title="教师工作台页" owner="E 组员"',
      '    desc="以教师视角聚合课表、作业与成绩提交状态；数据来自排课、成绩与消息模块，属于「轻业务、重聚合」页面。"',
      '    :must="[\'我的课表\', \'待批作业\', \'成绩提交状态\']"',
      '    :optional="[\'在线批改\', \'消息通知\', \'快捷跳转\']">',
      '    <el-button icon="el-icon-refresh" @click="load">刷新</el-button>',
      '  </page-header>',
      '  <div class="stat-grid">',
      '    <div class="stat-card" v-for="card in cards" :key="card.label">',
      '      <div class="stat-icon" :style="{ background: card.color }"><i :class="card.icon"></i></div>',
      '      <div class="stat-label">{{ card.label }}</div>',
      '      <div class="stat-value">{{ card.value }}</div>',
      '      <div class="stat-foot">{{ card.foot }}</div>',
      '    </div>',
      '  </div>',
      '  <div class="chart-grid" style="margin-top:14px;grid-template-columns:1.4fr 1fr;">',
      '    <div class="panel">',
      '      <div class="panel-title">我的课表 <span class="tip">数据来源：课程与排课管理页</span></div>',
      '      <el-table :data="slots" size="small" border>',
      '        <el-table-column prop="0" label="节次" width="96">',
      '          <template slot-scope="s">{{ s.row }}</template>',
      '        </el-table-column>',
      '        <el-table-column v-for="day in weekdays" :key="day" :label="day" min-width="120">',
      '          <template slot-scope="s">',
      '            <div v-for="item in cell(day, s.row)" :key="item.id" style="background:#eef3ff;border-radius:6px;padding:6px 8px;margin:2px 0;">',
      '              <div style="font-size:12px;font-weight:600;color:#2b4b8f;">{{ item.courseName }}</div>',
      '              <div style="font-size:11px;color:#7a8499;">{{ item.className }} · {{ item.room }}</div>',
      '            </div>',
      '          </template>',
      '        </el-table-column>',
      '      </el-table>',
      '    </div>',
      '    <div class="panel">',
      '      <div class="panel-title">最新通知 <span class="tip">与消息中心共用数据</span></div>',
      '      <div v-if="!notices.length" class="empty-hint">暂无通知</div>',
      '      <div v-for="msg in notices" :key="msg.id" style="padding:10px 0;border-bottom:1px solid #f0f3f9;">',
      '        <div style="font-size:13px;font-weight:600;color:#2b3a55;">',
      '          <el-tag size="mini" :type="msg.read ? \'info\' : \'danger\'" style="margin-right:6px;">{{ msg.read ? \'已读\' : \'未读\' }}</el-tag>',
      '          {{ msg.title }}',
      '        </div>',
      '        <div style="font-size:12px;color:#98a1b4;margin-top:4px;">{{ msg.senderName }} · {{ msg.publishAt }}</div>',
      '      </div>',
      '      <el-button type="text" style="margin-top:8px;" @click="go(\'/message/center\')">查看全部消息 →</el-button>',
      '    </div>',
      '  </div>',
      '  <div class="panel">',
      '    <div class="panel-title">待批作业与成绩提交</div>',
      '    <el-table :data="homeworks" size="small" border>',
      '      <el-table-column prop="course" label="课程" width="140"></el-table-column>',
      '      <el-table-column prop="title" label="作业" min-width="220"></el-table-column>',
      '      <el-table-column label="提交进度" width="200">',
      '        <template slot-scope="s">',
      '          <el-progress :percentage="Math.round(s.row.submitted / s.row.total * 100)" :stroke-width="8"></el-progress>',
      '        </template>',
      '      </el-table-column>',
      '      <el-table-column prop="deadline" label="截止时间" width="150"></el-table-column>',
      '      <el-table-column label="操作" width="100">',
      '        <template slot-scope="s"><el-button type="text" @click="$message.info(\'在线批改为选做项\')">批改</el-button></template>',
      '      </el-table-column>',
      '    </el-table>',
      '    <div class="todo-note">',
      '      <b>本页待完成：</b>作业在线批改、快捷跳转（成绩录入 / 选课名单）、成绩提交状态按课程展示。',
      '      修改文件：<span class="mono">js/pages/teacher-workbench.js</span>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('')
  };

  window.Pages = window.Pages || {};
  window.Pages.TeacherWorkbench = TeacherWorkbenchPage;
})();
