/**
 * 页面 4：课程与排课管理页 ｜ 主责 B
 * 必做：课程库、开课计划、教室与教师占用查看
 * 选做：排课冲突检测、拖拽调课、课表导出
 */
(function () {
  var CoursesPage = {
    name: 'CoursesPage',
    data: function () {
      return {
        tab: 'plan',
        loading: false,
        courses: [],
        offerings: [],
        conflictResult: null,
        dialogVisible: false,
        form: { code: '', name: '', credit: 2, type: '必修', dept: '计算机学院', teacherId: 'T001' },
        rules: {
          code: [{ required: true, message: '请输入课程代码', trigger: 'blur' }],
          name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
          credit: [{ required: true, message: '请输入学分', trigger: 'blur' }]
        }
      };
    },
    computed: {
      totalEnrolled: function () {
        return this.offerings.reduce(function (sum, o) { return sum + Number(o.enrolled || 0); }, 0);
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
          api.list('courses', { pageSize: 0 }),
          api.list('offerings', { pageSize: 0 })
        ]).then(function (res) {
          self.courses = res[0].list;
          self.offerings = res[1].list;
        }).catch(function (error) {
          self.$message.error(error.message);
        }).then(function () {
          self.loading = false;
        });
      },
      occupancy: function (row) {
        return Math.round((row.enrolled / row.capacity) * 100);
      },
      // 同类课程同一教室、同一时段出现多条，即视为排课冲突
      detectConflict: function () {
        var seen = {};
        var conflicts = [];
        this.offerings.forEach(function (row) {
          var key = row.room + '|' + row.weekday + '|' + row.timeSlot;
          if (seen[key]) {
            conflicts.push(row.courseName + '（' + row.className + '）与 ' + seen[key] + ' 在 ' + row.weekday + ' ' + row.timeSlot + ' 占用 ' + row.room);
          } else {
            seen[key] = row.courseName;
          }
        });
        this.conflictResult = conflicts;
        if (conflicts.length) {
          this.$alert(conflicts.join('<br />'), '检测到 ' + conflicts.length + ' 处排课冲突', { dangerouslyUseHTMLString: true, type: 'warning' });
        } else {
          this.$message.success('排课检测通过：当前没有教室 / 时段冲突');
        }
      },
      openCreate: function () {
        this.form = { code: '', name: '', credit: 2, type: '必修', dept: '计算机学院', teacherId: 'T001' };
        this.dialogVisible = true;
      },
      save: function () {
        var self = this;
        this.$refs.form.validate(function (valid) {
          if (!valid) return;
          api.create('courses', self.form).then(function () {
            self.$message.success('课程已加入课程库');
            self.dialogVisible = false;
            self.load();
          }).catch(function (error) {
            self.$message.error(error.message);
          });
        });
      },
      exportTimetable: function () {
        this.$message.success('已生成课表导出任务（选做项，可在此接入后端导出接口）');
      }
    },
    template: [
      '<div class="page">',
      '  <page-header title="课程与排课管理页" owner="B 组员"',
      '    desc="课程库维护开课计划，开课计划决定教室与教师占用，是选课、考试、场地预约的数据基础。"',
      '    :must="[\'课程库\', \'开课计划\', \'教室与教师占用\']"',
      '    :optional="[\'排课冲突检测\', \'拖拽调课\', \'课表导出\']">',
      '    <el-button icon="el-icon-warning-outline" @click="detectConflict">排课冲突检测</el-button>',
      '    <el-button v-perm="\'course:add\'" type="primary" icon="el-icon-plus" @click="openCreate">新增课程</el-button>',
      '  </page-header>',
      '  <div class="panel">',
      '    <el-tabs v-model="tab">',
      '      <el-tab-pane label="开课计划与占用" name="plan">',
      '        <div class="toolbar">',
      '          <el-tag type="info">本学期开课 {{ offerings.length }} 个班</el-tag>',
      '          <el-tag type="success">选课合计 {{ totalEnrolled }} 人次</el-tag>',
      '          <span class="spacer"></span>',
      '          <el-button size="small" icon="el-icon-download" @click="exportTimetable">导出课表</el-button>',
      '        </div>',
      '        <el-table :data="offerings" v-loading="loading" size="medium" border>',
      '          <el-table-column prop="courseName" label="课程" width="140"></el-table-column>',
      '          <el-table-column prop="className" label="教学班" width="120"></el-table-column>',
      '          <el-table-column prop="teacherName" label="任课教师" width="100"></el-table-column>',
      '          <el-table-column label="时间" width="160">',
      '            <template slot-scope="s">{{ s.row.weekday }} {{ s.row.timeSlot }}</template>',
      '          </el-table-column>',
      '          <el-table-column prop="room" label="教室" width="100"></el-table-column>',
      '          <el-table-column label="容量占用" min-width="200">',
      '            <template slot-scope="s">',
      '              <div style="display:flex;align-items:center;gap:10px;">',
      '                <el-progress :percentage="occupancy(s.row)" :stroke-width="8" :show-text="false" style="flex:1;"',
      '                  :color="occupancy(s.row) >= 90 ? \'#f56c6c\' : \'#3a63d6\'"></el-progress>',
      '                <span style="font-size:12px;color:#7a8499;">{{ s.row.enrolled }}/{{ s.row.capacity }}</span>',
      '              </div>',
      '            </template>',
      '          </el-table-column>',
      '          <el-table-column label="状态" width="100">',
      '            <template slot-scope="s">',
      '              <el-tag size="mini" :type="occupancy(s.row) >= 90 ? \'danger\' : \'success\'">{{ occupancy(s.row) >= 90 ? \'接近满员\' : \'正常\' }}</el-tag>',
      '            </template>',
      '          </el-table-column>',
      '        </el-table>',
      '      </el-tab-pane>',
      '      <el-tab-pane label="课程库" name="library">',
      '        <el-table :data="courses" v-loading="loading" size="medium" border>',
      '          <el-table-column prop="code" label="课程代码" width="130"></el-table-column>',
      '          <el-table-column prop="name" label="课程名称" width="160"></el-table-column>',
      '          <el-table-column prop="credit" label="学分" width="80"></el-table-column>',
      '          <el-table-column prop="type" label="类型" width="90">',
      '            <template slot-scope="s"><el-tag size="mini" :type="s.row.type === \'必修\' ? \'danger\' : \'warning\'">{{ s.row.type }}</el-tag></template>',
      '          </el-table-column>',
      '          <el-table-column prop="dept" label="开课学院" min-width="140"></el-table-column>',
      '          <el-table-column prop="teacherId" label="默认教师" width="110"></el-table-column>',
      '        </el-table>',
      '      </el-tab-pane>',
      '    </el-tabs>',
      '    <div class="todo-note"><b>本页待完成：</b>开课计划新增与编辑、教师占用日历、拖拽调课与课表导出。修改文件：<span class="mono">js/pages/courses.js</span></div>',
      '  </div>',
      '  <el-dialog title="新增课程" :visible.sync="dialogVisible" width="480px">',
      '    <el-form ref="form" :model="form" :rules="rules" label-width="90px">',
      '      <el-form-item label="课程代码" prop="code"><el-input v-model="form.code" placeholder="CS2005"></el-input></el-form-item>',
      '      <el-form-item label="课程名称" prop="name"><el-input v-model="form.name"></el-input></el-form-item>',
      '      <el-form-item label="学分" prop="credit"><el-input-number v-model="form.credit" :min="0.5" :max="10" :step="0.5"></el-input-number></el-form-item>',
      '      <el-form-item label="类型"><el-radio-group v-model="form.type"><el-radio label="必修">必修</el-radio><el-radio label="选修">选修</el-radio></el-radio-group></el-form-item>',
      '      <el-form-item label="开课学院"><el-input v-model="form.dept"></el-input></el-form-item>',
      '    </el-form>',
      '    <span slot="footer"><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="save">保存</el-button></span>',
      '  </el-dialog>',
      '</div>'
    ].join('')
  };

  window.Pages = window.Pages || {};
  window.Pages.Courses = CoursesPage;
})();
