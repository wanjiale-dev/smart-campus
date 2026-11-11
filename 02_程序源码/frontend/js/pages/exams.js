/**
 * 页面 7：考试与考务页 ｜ 主责 D
 * 必做：考试计划、考场安排、监考分配
 * 选做：准考证生成、座位表打印、成绩与考试关联
 */
(function () {
  var ExamsPage = {
    name: 'ExamsPage',
    data: function () {
      return {
        loading: false,
        rows: [],
        dialogVisible: false,
        current: { id: '', courseName: '', invigilator: '', room: '' }
      };
    },
    computed: {
      canEdit: function () { return this.$can('exam:edit'); },
      planned: function () { return this.rows.filter(function (r) { return r.status === '已排考'; }).length; },
      pending: function () { return this.rows.filter(function (r) { return r.status !== '已排考'; }).length; }
    },
    created: function () {
      this.load();
    },
    methods: {
      load: function () {
        var self = this;
        this.loading = true;
        api.list('exams', { pageSize: 0 }).then(function (res) {
          self.rows = res.list;
        }).catch(function (error) {
          self.$message.error(error.message);
        }).then(function () {
          self.loading = false;
        });
      },
      openAssign: function (row) {
        this.current = Object.assign({}, row);
        this.dialogVisible = true;
      },
      saveAssign: function () {
        var self = this;
        if (!this.current.invigilator) return this.$message.warning('请填写监考教师');
        api.update('exams', this.current.id, {
          invigilator: this.current.invigilator,
          room: this.current.room,
          status: '已排考'
        }).then(function () {
          self.$message.success('监考已分配');
          self.dialogVisible = false;
          self.load();
        }).catch(function (error) {
          self.$message.error(error.message);
        });
      },
      printTicket: function (row) {
        this.$message.info('准考证 / 座位表为选做项：可在本页接入打印视图（window.print + 专用 CSS）');
      }
    },
    template: [
      '<div class="page">',
      '  <page-header title="考试与考务页" owner="D 组员"',
      '    desc="考试计划 → 考场安排 → 监考分配，一条链路覆盖考务排布；考场与课程排课的占用关系由 B 组提供。"',
      '    :must="[\'考试计划\', \'考场安排\', \'监考分配\']"',
      '    :optional="[\'准考证生成\', \'座位表打印\', \'成绩关联\']">',
      '    <el-tag type="success">已排考 {{ planned }}</el-tag>',
      '    <el-tag type="warning" style="margin-left:8px;">待排考 {{ pending }}</el-tag>',
      '  </page-header>',
      '  <div class="panel">',
      '    <el-table :data="rows" v-loading="loading" size="medium" border>',
      '      <el-table-column prop="courseName" label="考试课程" width="150"></el-table-column>',
      '      <el-table-column prop="className" label="班级" width="120"></el-table-column>',
      '      <el-table-column prop="type" label="类型" width="100"></el-table-column>',
      '      <el-table-column prop="date" label="考试日期" width="130"></el-table-column>',
      '      <el-table-column prop="time" label="时间" width="130"></el-table-column>',
      '      <el-table-column prop="room" label="考场" width="100"></el-table-column>',
      '      <el-table-column label="监考" min-width="150">',
      '        <template slot-scope="s">',
      '          <span :style="{ color: s.row.invigilator === \'待分配\' ? \'#f56c6c\' : \'#465577\' }">{{ s.row.invigilator }}</span>',
      '        </template>',
      '      </el-table-column>',
      '      <el-table-column label="状态" width="100">',
      '        <template slot-scope="s"><el-tag size="mini" :type="s.row.status === \'已排考\' ? \'success\' : \'warning\'">{{ s.row.status }}</el-tag></template>',
      '      </el-table-column>',
      '      <el-table-column label="操作" width="180" fixed="right">',
      '        <template slot-scope="s">',
      '          <el-button v-perm="\'exam:edit\'" type="text" @click="openAssign(s.row)">监考分配</el-button>',
      '          <el-button type="text" @click="printTicket(s.row)">准考证</el-button>',
      '        </template>',
      '      </el-table-column>',
      '    </el-table>',
      '    <div class="todo-note"><b>本页待完成：</b>考试计划的新建/编辑、准考证与座位表打印模板、成绩与考试关联。修改文件：<span class="mono">js/pages/exams.js</span></div>',
      '  </div>',
      '  <el-dialog title="监考与考场分配" :visible.sync="dialogVisible" width="460px">',
      '    <el-form label-width="90px">',
      '      <el-form-item label="考试课程"><el-input :value="current.courseName" disabled></el-input></el-form-item>',
      '      <el-form-item label="考场"><el-input v-model="current.room"></el-input></el-form-item>',
      '      <el-form-item label="监考教师">',
      '        <el-input v-model="current.invigilator" placeholder="多位教师用 / 分隔"></el-input>',
      '      </el-form-item>',
      '    </el-form>',
      '    <span slot="footer"><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="saveAssign">保存</el-button></span>',
      '  </el-dialog>',
      '</div>'
    ].join('')
  };

  window.Pages = window.Pages || {};
  window.Pages.Exams = ExamsPage;
})();
