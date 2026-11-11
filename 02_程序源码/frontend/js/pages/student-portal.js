/**
 * 页面 10：学生端门户页 ｜ 主责 E
 * 必做：我的课表、成绩查询、选课入口、通知公告
 * 选做：收藏课程、评价教师、移动端适配
 */
(function () {
  var StudentPortalPage = {
    name: 'StudentPortalPage',
    data: function () {
      return {
        loading: false,
        offerings: [],
        grades: [],
        notices: [],
        className: '计算机 2401'
      };
    },
    computed: {
      user: function () { return this.$store.state.user || {}; },
      studentId: function () { return this.user.studentId || 'S2024001'; },
      myTimetable: function () {
        var self = this;
        return this.offerings.filter(function (o) { return o.className === self.className; });
      },
      weightedAvg: function () {
        var credit = 0;
        var score = 0;
        this.grades.forEach(function (g) {
          credit += Number(g.credit || 0);
          score += Number(g.total || 0) * Number(g.credit || 0);
        });
        return credit ? (score / credit).toFixed(1) : '—';
      },
      failedCount: function () {
        return this.grades.filter(function (g) { return Number(g.total) < 60; }).length;
      },
      weekRows: function () {
        var map = {};
        this.myTimetable.forEach(function (o) {
          var key = o.weekday + ' ' + o.timeSlot;
          map[key] = o;
        });
        return map;
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
          api.list('offerings', { pageSize: 0 }),
          api.list('grades', { studentId: this.studentId, pageSize: 0 }),
          api.messages({ userId: this.user.id, role: this.user.role, pageSize: 4 })
        ]).then(function (res) {
          self.offerings = res[0].list;
          self.grades = res[1].list;
          self.notices = res[2].list;
        }).catch(function (error) {
          self.$message.error(error.message);
        }).then(function () {
          self.loading = false;
        });
      },
      go: function (path) {
        this.$router.push(path).catch(function () {});
      }
    },
    template: [
      '<div class="page" v-loading="loading">',
      '  <page-header title="学生端门户页" owner="E 组员"',
      '    desc="学生视角的一站式入口：课表、成绩、选课与通知公告，全员数据的下游汇聚点。"',
      '    :must="[\'我的课表\', \'成绩查询\', \'选课入口\', \'通知公告\']"',
      '    :optional="[\'收藏课程\', \'评价教师\', \'移动端适配\']">',
      '    <el-button icon="el-icon-refresh" @click="load">刷新</el-button>',
      '  </page-header>',
      '  <div class="stat-grid">',
      '    <div class="stat-card">',
      '      <div class="stat-icon" style="background:#3a63d6;"><i class="el-icon-reading"></i></div>',
      '      <div class="stat-label">本学期课程</div><div class="stat-value">{{ myTimetable.length }}</div>',
      '      <div class="stat-foot">{{ className }}</div>',
      '    </div>',
      '    <div class="stat-card">',
      '      <div class="stat-icon" style="background:#12b886;"><i class="el-icon-data-line"></i></div>',
      '      <div class="stat-label">加权平均分</div><div class="stat-value">{{ weightedAvg }}</div>',
      '      <div class="stat-foot">按学分加权</div>',
      '    </div>',
      '    <div class="stat-card">',
      '      <div class="stat-icon" style="background:#f56c6c;"><i class="el-icon-warning-outline"></i></div>',
      '      <div class="stat-label">不及格科目</div><div class="stat-value">{{ failedCount }}</div>',
      '      <div class="stat-foot">可申请补考</div>',
      '    </div>',
      '    <div class="stat-card">',
      '      <div class="stat-icon" style="background:#f59f00;"><i class="el-icon-bell"></i></div>',
      '      <div class="stat-label">未读通知</div><div class="stat-value">{{ notices.filter(function(n){return !n.read;}).length }}</div>',
      '      <div class="stat-foot">点击铃铛查看</div>',
      '    </div>',
      '  </div>',
      '  <div class="chart-grid" style="margin-top:14px;grid-template-columns:1.3fr 1fr;">',
      '    <div class="panel">',
      '      <div class="panel-title">我的课表 <span class="tip">{{ className }}</span></div>',
      '      <el-descriptions :column="1" size="small" border>',
      '        <el-descriptions-item v-for="day in [\'周一\',\'周二\',\'周三\',\'周四\',\'周五\']" :key="day" :label="day">',
      '          <div v-if="!Object.keys(weekRows).some(function(k){return k.indexOf(day) === 0;})" style="color:#c0c6d4;font-size:12px;">无课</div>',
      '          <div v-for="(item, key) in weekRows" :key="key" v-if="key.indexOf(day) === 0" style="font-size:12px;color:#465577;margin:2px 0;">',
      '            <b>{{ item.timeSlot }}</b> {{ item.courseName }} · {{ item.teacherName }} · {{ item.room }}',
      '          </div>',
      '        </el-descriptions-item>',
      '      </el-descriptions>',
      '    </div>',
      '    <div class="panel">',
      '      <div class="panel-title">快捷入口</div>',
      '      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">',
      '        <el-button icon="el-icon-s-order" @click="go(\'/course-selection\')">选课管理</el-button>',
      '        <el-button icon="el-icon-tickets" @click="go(\'/grades\')">成绩查询</el-button>',
      '        <el-button icon="el-icon-office-building" @click="go(\'/campus/venue\')">场地预约</el-button>',
      '        <el-button icon="el-icon-chat-dot-round" @click="go(\'/message/center\')">消息中心</el-button>',
      '      </div>',
      '      <div class="panel-title" style="margin-top:20px;">通知公告</div>',
      '      <div v-if="!notices.length" class="empty-hint">暂无通知</div>',
      '      <div v-for="msg in notices" :key="msg.id" style="padding:8px 0;border-bottom:1px solid #f0f3f9;cursor:pointer;" @click="go(\'/message/center\')">',
      '        <div style="font-size:13px;color:#2b3a55;">{{ msg.title }}</div>',
      '        <div style="font-size:11px;color:#98a1b4;margin-top:3px;">{{ msg.senderName }} · {{ msg.publishAt }}</div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '  <div class="panel">',
      '    <div class="panel-title">我的成绩</div>',
      '    <el-table :data="grades" size="small" border empty-text="暂无成绩记录">',
      '      <el-table-column prop="courseName" label="课程" width="160"></el-table-column>',
      '      <el-table-column prop="credit" label="学分" width="80"></el-table-column>',
      '      <el-table-column prop="usual" label="平时分" width="90"></el-table-column>',
      '      <el-table-column prop="final" label="期末分" width="90"></el-table-column>',
      '      <el-table-column label="总评" width="90">',
      '        <template slot-scope="s"><b :style="{color: Number(s.row.total) < 60 ? \'#f56c6c\' : \'#12b886\'}">{{ s.row.total }}</b></template>',
      '      </el-table-column>',
      '      <el-table-column prop="term" label="学期" min-width="130"></el-table-column>',
      '    </el-table>',
      '    <div class="todo-note"><b>本页待完成：</b>收藏课程、评价教师、移动端适配。修改文件：<span class="mono">js/pages/student-portal.js</span></div>',
      '  </div>',
      '</div>'
    ].join('')
  };

  window.Pages = window.Pages || {};
  window.Pages.StudentPortal = StudentPortalPage;
})();
