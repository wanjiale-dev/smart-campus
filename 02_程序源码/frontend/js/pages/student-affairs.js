/**
 * 页面 8：学工与请假页 ｜ 主责 D
 * 必做：请假申请、审批流、销假、奖惩记录
 * 选做：宿舍管理、审批超时提醒、统计报表
 */
(function () {
  var StudentAffairsPage = {
    name: 'StudentAffairsPage',
    data: function () {
      return {
        loading: false,
        tab: 'apply',
        rows: [],
        form: { type: '病假', startDate: '', endDate: '', reason: '' },
        rules: {
          startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
          endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
          reason: [{ required: true, message: '请填写请假事由', trigger: 'blur' }, { min: 5, message: '至少 5 个字', trigger: 'blur' }]
        },
        submitting: false
      };
    },
    computed: {
      user: function () { return this.$store.state.user || {}; },
      canApprove: function () { return this.$can('leave:approve'); },
      pendingRows: function () { return this.rows.filter(function (r) { return r.status === '待审批'; }); },
      myRows: function () {
        var self = this;
        return this.rows.filter(function (r) { return r.studentId === self.user.studentId; });
      }
    },
    created: function () {
      this.load();
    },
    methods: {
      load: function () {
        var self = this;
        this.loading = true;
        api.list('leaves', { pageSize: 0 }).then(function (res) {
          self.rows = res.list;
        }).catch(function (error) {
          self.$message.error(error.message);
        }).then(function () {
          self.loading = false;
        });
      },
      submit: function () {
        var self = this;
        this.$refs.form.validate(function (valid) {
          if (!valid) return;
          if (self.form.endDate < self.form.startDate) return self.$message.error('结束日期不能早于开始日期');
          self.submitting = true;
          var days = Math.round((new Date(self.form.endDate) - new Date(self.form.startDate)) / 86400000) + 1;
          api.create('leaves', {
            studentId: self.user.studentId || 'S2024001',
            studentName: self.user.name,
            className: '计算机 2401',
            type: self.form.type,
            startDate: self.form.startDate,
            endDate: self.form.endDate,
            days: days,
            reason: self.form.reason,
            status: '待审批',
            approver: '',
            createdAt: ''
          }).then(function () {
            self.$message.success('请假申请已提交，等待辅导员审批');
            self.form = { type: '病假', startDate: '', endDate: '', reason: '' };
            self.tab = 'list';
            self.load();
          }).catch(function (error) {
            self.$message.error(error.message);
          }).then(function () {
            self.submitting = false;
          });
        });
      },
      approve: function (row, status) {
        var self = this;
        var action = status === '已通过' ? '通过' : '驳回';
        this.$confirm('确定' + action + '「' + row.studentName + '」的' + row.type + '申请吗？', action + '确认', { type: 'warning' })
          .then(function () {
            return api.approveLeave(row.id, { status: status, approverName: self.user.name });
          })
          .then(function () {
            self.$message.success('已' + action);
            self.load();
          })
          .catch(function () {});
      },
      closeLeave: function (row) {
        var self = this;
        api.update('leaves', row.id, { status: '已销假' }).then(function () {
          self.$message.success('已销假');
          self.load();
        }).catch(function (error) {
          self.$message.error(error.message);
        });
      }
    },
    template: [
      '<div class="page">',
      '  <page-header title="学工与请假页" owner="D 组员"',
      '    desc="学生提交请假 → 辅导员审批 → 返校销假，一个完整审批流；奖惩记录与宿舍管理列为选做。"',
      '    :must="[\'请假申请\', \'审批流\', \'销假\', \'奖惩记录\']"',
      '    :optional="[\'宿舍管理\', \'超时提醒\', \'统计报表\']">',
      '    <el-tag type="warning">待审批 {{ pendingRows.length }}</el-tag>',
      '  </page-header>',
      '  <div class="panel">',
      '    <el-tabs v-model="tab">',
      '      <el-tab-pane label="请假申请" name="apply">',
      '        <el-form ref="form" :model="form" :rules="rules" label-width="90px" style="max-width:560px;">',
      '          <el-form-item label="请假类型">',
      '            <el-radio-group v-model="form.type">',
      '              <el-radio label="病假">病假</el-radio><el-radio label="事假">事假</el-radio>',
      '            </el-radio-group>',
      '          </el-form-item>',
      '          <el-form-item label="开始日期" prop="startDate">',
      '            <el-date-picker v-model="form.startDate" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" style="width:100%;"></el-date-picker>',
      '          </el-form-item>',
      '          <el-form-item label="结束日期" prop="endDate">',
      '            <el-date-picker v-model="form.endDate" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" style="width:100%;"></el-date-picker>',
      '          </el-form-item>',
      '          <el-form-item label="请假事由" prop="reason">',
      '            <el-input v-model="form.reason" type="textarea" :rows="4" placeholder="请说明请假原因，病假请注明就医情况"></el-input>',
      '          </el-form-item>',
      '          <el-form-item>',
      '            <el-button type="primary" :loading="submitting" @click="submit">提交申请</el-button>',
      '            <span style="margin-left:10px;color:#98a1b4;font-size:12px;">当前申请人：{{ user.name }}（{{ $store.getters.roleName }}）</span>',
      '          </el-form-item>',
      '        </el-form>',
      '      </el-tab-pane>',
      '      <el-tab-pane :label="\'请假记录（\' + pendingRows.length + \' 待审批）\'" name="list">',
      '        <el-table :data="rows" v-loading="loading" size="medium" border>',
      '          <el-table-column prop="studentName" label="学生" width="100"></el-table-column>',
      '          <el-table-column prop="className" label="班级" width="120"></el-table-column>',
      '          <el-table-column prop="type" label="类型" width="80"></el-table-column>',
      '          <el-table-column label="请假区间" width="200">',
      '            <template slot-scope="s">{{ s.row.startDate }} 至 {{ s.row.endDate }}（{{ s.row.days }} 天）</template>',
      '          </el-table-column>',
      '          <el-table-column prop="reason" label="事由" min-width="180"></el-table-column>',
      '          <el-table-column label="状态" width="100">',
      '            <template slot-scope="s">',
      '              <el-tag size="mini" :type="s.row.status === \'已通过\' ? \'success\' : (s.row.status === \'已驳回\' ? \'danger\' : \'warning\')">{{ s.row.status }}</el-tag>',
      '            </template>',
      '          </el-table-column>',
      '          <el-table-column prop="approver" label="审批人" width="90"></el-table-column>',
      '          <el-table-column label="操作" width="170" fixed="right">',
      '            <template slot-scope="s">',
      '              <template v-if="s.row.status === \'待审批\' && canApprove">',
      '                <el-button type="text" @click="approve(s.row, \'已通过\')">通过</el-button>',
      '                <el-button type="text" style="color:#f56c6c;" @click="approve(s.row, \'已驳回\')">驳回</el-button>',
      '              </template>',
      '              <el-button v-else-if="s.row.status === \'已通过\'" type="text" @click="closeLeave(s.row)">销假</el-button>',
      '              <span v-else style="color:#c0c6d4;">—</span>',
      '            </template>',
      '          </el-table-column>',
      '        </el-table>',
      '        <div class="todo-note"><b>本页待完成：</b>奖惩记录子页、审批超时提醒、宿舍管理（选做）。修改文件：<span class="mono">js/pages/student-affairs.js</span></div>',
      '      </el-tab-pane>',
      '    </el-tabs>',
      '  </div>',
      '</div>'
    ].join('')
  };

  window.Pages = window.Pages || {};
  window.Pages.StudentAffairs = StudentAffairsPage;
})();
