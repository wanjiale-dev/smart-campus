/**
 * 页面 6：成绩管理页 ｜ 主责 C
 * 必做：成绩录入、批量保存、加权计算、成绩列表
 * 选做：Excel 导入、成绩分布分析、补考名单生成
 */
(function () {
  var GradesPage = {
    name: 'GradesPage',
    data: function () {
      return {
        loading: false,
        saving: false,
        rows: [],
        keyword: '',
        summaryVisible: false,
        summary: null
      };
    },
    computed: {
      user: function () { return this.$store.state.user || {}; },
      editable: function () { return this.$can('grade:edit'); },
      changed: function () { return this.rows.filter(function (r) { return r.__dirty; }); },
      weightedAvg: function () {
        var totalCredit = 0;
        var totalScore = 0;
        this.rows.forEach(function (r) {
          totalCredit += Number(r.credit || 0);
          totalScore += Number(r.total || 0) * Number(r.credit || 0);
        });
        return totalCredit ? (totalScore / totalCredit).toFixed(2) : '0.00';
      }
    },
    created: function () {
      this.load();
    },
    methods: {
      load: function () {
        var self = this;
        this.loading = true;
        var params = { pageSize: 0, keyword: this.keyword };
        // 学生只能看自己的成绩；教师/教务看全部（真实项目应由后端按角色过滤）
        if (this.user.role === 'student') params.studentId = this.user.studentId || 'S2024001';
        api.list('grades', params).then(function (res) {
          self.rows = res.list.map(function (row) { return Object.assign({}, row, { __dirty: false }); });
        }).catch(function (error) {
          self.$message.error(error.message);
        }).then(function () {
          self.loading = false;
        });
      },
      recalc: function (row) {
        row.total = Math.round(Number(row.usual || 0) * 0.4 + Number(row.final || 0) * 0.6);
        row.__dirty = true;
      },
      saveAll: function () {
        var self = this;
        if (!this.changed.length) return this.$message.info('没有需要保存的修改');
        this.saving = true;
        var tasks = this.changed.map(function (row) {
          return api.update('grades', row.id, { usual: row.usual, final: row.final, total: row.total });
        });
        Promise.all(tasks).then(function () {
          self.$message.success('已批量保存 ' + tasks.length + ' 条成绩');
          self.load();
        }).catch(function (error) {
          self.$message.error(error.message);
        }).then(function () {
          self.saving = false;
        });
      },
      showSummary: function () {
        var rows = this.rows;
        var failed = rows.filter(function (r) { return Number(r.total) < 60; });
        var avg = this.weightedAvg;
        this.summary = {
          count: rows.length,
          weightedAvg: avg,
          passRate: rows.length ? Math.round((rows.length - failed.length) / rows.length * 100) : 0,
          failed: failed
        };
        this.summaryVisible = true;
      },
      importExcel: function () {
        this.$message.info('Excel 导入为选做项：可用 xlsx 解析后在 js/pages/grades.js 中批量 api.create(\'grades\', ...)');
      }
    },
    template: [
      '<div class="page">',
      '  <page-header title="成绩管理页" owner="C 组员"',
      '    desc="平时分占 40%、期末占 60%，总评自动计算；加权平均分与补考名单都基于学分加权。"',
      '    :must="[\'成绩录入\', \'批量保存\', \'加权计算\', \'成绩列表\']"',
      '    :optional="[\'Excel 导入\', \'成绩分布\', \'补考名单\']">',
      '    <el-button v-perm="\'grade:import\'" icon="el-icon-upload2" @click="importExcel">Excel 导入</el-button>',
      '    <el-button icon="el-icon-data-analysis" @click="showSummary">加权统计</el-button>',
      '    <el-button v-if="editable" type="primary" icon="el-icon-check" :loading="saving" @click="saveAll">批量保存</el-button>',
      '  </page-header>',
      '  <div class="panel">',
      '    <div class="toolbar">',
      '      <el-input v-model="keyword" placeholder="学生 / 课程" clearable style="width:220px;" @keyup.enter.native="load"></el-input>',
      '      <el-button type="primary" icon="el-icon-search" @click="load">查询</el-button>',
      '      <el-tag type="info">共 {{ rows.length }} 条</el-tag>',
      '      <el-tag v-if="changed.length" type="warning">待保存 {{ changed.length }} 条</el-tag>',
      '      <span class="spacer"></span>',
      '      <span style="font-size:12px;color:#98a1b4;">当前角色：{{ $store.getters.roleName }}{{ editable ? \'（可录入）\' : \'（只读）\' }}</span>',
      '    </div>',
      '    <el-table :data="rows" v-loading="loading" size="medium" border>',
      '      <el-table-column prop="studentName" label="学生" width="110"></el-table-column>',
      '      <el-table-column prop="courseName" label="课程" width="150"></el-table-column>',
      '      <el-table-column prop="credit" label="学分" width="80"></el-table-column>',
      '      <el-table-column label="平时分（40%）" width="150">',
      '        <template slot-scope="s">',
      '          <el-input-number v-if="editable" v-model="s.row.usual" :min="0" :max="100" size="mini" controls-position="right" @change="recalc(s.row)"></el-input-number>',
      '          <span v-else>{{ s.row.usual }}</span>',
      '        </template>',
      '      </el-table-column>',
      '      <el-table-column label="期末分（60%）" width="150">',
      '        <template slot-scope="s">',
      '          <el-input-number v-if="editable" v-model="s.row.final" :min="0" :max="100" size="mini" controls-position="right" @change="recalc(s.row)"></el-input-number>',
      '          <span v-else>{{ s.row.final }}</span>',
      '        </template>',
      '      </el-table-column>',
      '      <el-table-column label="总评" width="100">',
      '        <template slot-scope="s">',
      '          <span :style="{ color: Number(s.row.total) < 60 ? \'#f56c6c\' : \'#12b886\', fontWeight: 600 }">{{ s.row.total }}</span>',
      '        </template>',
      '      </el-table-column>',
      '      <el-table-column label="结果" width="100">',
      '        <template slot-scope="s">',
      '          <el-tag size="mini" :type="Number(s.row.total) >= 60 ? \'success\' : \'danger\'">{{ Number(s.row.total) >= 60 ? \'及格\' : \'不及格\' }}</el-tag>',
      '        </template>',
      '      </el-table-column>',
      '      <el-table-column prop="term" label="学期" min-width="130"></el-table-column>',
      '    </el-table>',
      '    <div class="todo-note"><b>本页待完成：</b>成绩分布图（ECharts）、补考名单导出、Excel 解析导入。修改文件：<span class="mono">js/pages/grades.js</span></div>',
      '  </div>',
      '  <el-dialog title="成绩统计" :visible.sync="summaryVisible" width="520px">',
      '    <div v-if="summary">',
      '      <div class="stat-grid" style="grid-template-columns:repeat(3,1fr);">',
      '        <div class="stat-card"><div class="stat-label">成绩记录</div><div class="stat-value">{{ summary.count }}</div></div>',
      '        <div class="stat-card"><div class="stat-label">加权平均分</div><div class="stat-value">{{ summary.weightedAvg }}</div></div>',
      '        <div class="stat-card"><div class="stat-label">及格率</div><div class="stat-value">{{ summary.passRate }}%</div></div>',
      '      </div>',
      '      <div class="panel-title" style="margin-top:18px;">补考名单 <span class="tip">总评 &lt; 60 分</span></div>',
      '      <el-table :data="summary.failed" size="small" empty-text="没有不及格记录">',
      '        <el-table-column prop="studentName" label="学生" width="110"></el-table-column>',
      '        <el-table-column prop="courseName" label="课程"></el-table-column>',
      '        <el-table-column prop="total" label="总评" width="80"></el-table-column>',
      '      </el-table>',
      '    </div>',
      '  </el-dialog>',
      '</div>'
    ].join('')
  };

  window.Pages = window.Pages || {};
  window.Pages.Grades = GradesPage;
})();
