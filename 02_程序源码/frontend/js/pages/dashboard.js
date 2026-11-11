/**
 * 页面 2：数据总览页 ｜ 主责 A
 * 必做：在校人数、选课热度、成绩分布图表
 * 选做：异常预警列表、图表联动下钻、大屏切换
 */
(function () {
  var DashboardPage = {
    name: 'DashboardPage',
    data: function () {
      return {
        loading: false,
        stats: {
          cards: { students: 0, teachers: 0, courses: 0, selections: 0, pendingBookings: 0, unread: 0 },
          gradeBuckets: [],
          hotCourses: [],
          alerts: []
        }
      };
    },
    computed: {
      cards: function () {
        var c = this.stats.cards;
        return [
          { label: '在校学生', value: c.students, foot: '教师 ' + c.teachers + ' 人', icon: 'el-icon-user', color: '#3a63d6' },
          { label: '开设课程', value: c.courses, foot: '本学期开课计划', icon: 'el-icon-reading', color: '#12b886' },
          { label: '选课人次', value: c.selections, foot: '含必修与选修', icon: 'el-icon-s-order', color: '#f59f00' },
          { label: '待审批预约', value: c.pendingBookings, foot: '未读消息 ' + c.unread + ' 条', icon: 'el-icon-office-building', color: '#7c5cd6' }
        ];
      },
      user: function () { return this.$store.state.user || {}; }
    },
    mounted: function () {
      this.load();
      window.addEventListener('resize', this.resize);
    },
    beforeDestroy: function () {
      window.removeEventListener('resize', this.resize);
      if (this.gradeChart) this.gradeChart.dispose();
      if (this.hotChart) this.hotChart.dispose();
    },
    methods: {
      load: function () {
        var self = this;
        this.loading = true;
        api.stats(this.user.id).then(function (data) {
          self.stats = data;
          self.$nextTick(self.renderCharts);
        }).catch(function (error) {
          self.$message.error(error.message);
        }).then(function () {
          self.loading = false;
        });
      },
      resize: function () {
        if (this.gradeChart) this.gradeChart.resize();
        if (this.hotChart) this.hotChart.resize();
      },
      renderCharts: function () {
        var buckets = this.stats.gradeBuckets || [];
        if (this.$refs.gradeChart) {
          this.gradeChart = this.gradeChart || echarts.init(this.$refs.gradeChart);
          this.gradeChart.setOption({
            grid: { left: 40, right: 20, top: 30, bottom: 30 },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: buckets.map(function (b) { return b.label; }), axisLine: { lineStyle: { color: '#dfe5f0' } }, axisLabel: { color: '#7a8499', fontSize: 11 } },
            yAxis: { type: 'value', splitLine: { lineStyle: { color: '#eef2f8' } }, axisLabel: { color: '#98a1b4' } },
            series: [{
              type: 'bar',
              data: buckets.map(function (b) { return b.value; }),
              barWidth: 26,
              itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#5b8ff9' }, { offset: 1, color: '#a3c1ff' }]), borderRadius: [4, 4, 0, 0] }
            }]
          });
        }
        var hot = this.stats.hotCourses || [];
        if (this.$refs.hotChart) {
          this.hotChart = this.hotChart || echarts.init(this.$refs.hotChart);
          this.hotChart.setOption({
            grid: { left: 90, right: 30, top: 20, bottom: 20 },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            xAxis: { type: 'value', splitLine: { lineStyle: { color: '#eef2f8' } }, axisLabel: { color: '#98a1b4' } },
            yAxis: { type: 'category', data: hot.map(function (h) { return h.name; }).reverse(), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#5a6680', fontSize: 12 } },
            series: [{
              type: 'bar',
              data: hot.map(function (h) { return h.value; }).reverse(),
              barWidth: 14,
              itemStyle: { color: '#12b886', borderRadius: [0, 6, 6, 0] }
            }]
          });
        }
      },
      levelText: function (level) {
        return { warning: '待审批', danger: '预警', info: '提示' }[level] || '提示';
      },
      goAlert: function (row) {
        if (!row || !row.to) return;
        var role = this.user.role;
        var matched = this.$router.match(row.to).matched;
        var meta = (matched[matched.length - 1] || {}).meta || {};
        var roles = meta.roles || [];
        if (roles.length && roles.indexOf(role) === -1) {
          this.$message.info('该页面只对 ' + roles.map(function (r) { return Auth.roleName(r); }).join('、') + ' 开放，当前角色看不到');
          return;
        }
        this.$router.push(row.to);
      }
    },
    template: [
      '<div class="page" v-loading="loading">',
      '  <page-header title="数据总览页" owner="A 组员"',
      '    desc="全平台关键指标一屏掌握：在校规模、选课热度、成绩分布与异常预警。"',
      '    :must="[\'在校人数\', \'选课热度\', \'成绩分布图表\']"',
      '    :optional="[\'异常预警\', \'图表下钻\', \'大屏切换\']">',
      '    <el-button icon="el-icon-refresh" @click="load">刷新数据</el-button>',
      '  </page-header>',
      '  <div class="stat-grid">',
      '    <div class="stat-card" v-for="card in cards" :key="card.label">',
      '      <div class="stat-icon" :style="{ background: card.color }"><i :class="card.icon"></i></div>',
      '      <div class="stat-label">{{ card.label }}</div>',
      '      <div class="stat-value">{{ card.value }}</div>',
      '      <div class="stat-foot">{{ card.foot }}</div>',
      '    </div>',
      '  </div>',
      '  <div class="chart-grid" style="margin-top:14px;">',
      '    <div class="panel">',
      '      <div class="panel-title">成绩分布 <span class="tip">按总评成绩分段统计</span></div>',
      '      <div ref="gradeChart" class="chart-box"></div>',
      '    </div>',
      '    <div class="panel">',
      '      <div class="panel-title">选课热度 <span class="tip">开课班已选人数 Top 6</span></div>',
      '      <div ref="hotChart" class="chart-box"></div>',
      '    </div>',
      '  </div>',
      '  <div class="panel">',
      '    <div class="panel-title">异常与待办预警 <span class="tip">数据来自预约、请假与选课容量，点击行可跳转</span></div>',
      '    <el-table :data="stats.alerts" size="small" empty-text="暂无预警，一切正常"',
      '      :row-style="{ cursor: \'pointer\' }" @row-click="goAlert">',
      '      <el-table-column label="级别" width="100">',
      '        <template slot-scope="s"><el-tag :type="s.row.level" size="mini">{{ levelText(s.row.level) }}</el-tag></template>',
      '      </el-table-column>',
      '      <el-table-column prop="text" label="内容" min-width="320"></el-table-column>',
      '      <el-table-column prop="time" label="时间" width="160"></el-table-column>',
      '    </el-table>',
      '    <div class="todo-note">',
      '      <b>本页待完成：</b>图表点击下钻、大屏模式（选做）。预警行已可点击跳到对应业务页。',
      '      修改文件：<span class="mono">js/pages/dashboard.js</span>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('')
  };

  window.Pages = window.Pages || {};
  window.Pages.Dashboard = DashboardPage;
})();
