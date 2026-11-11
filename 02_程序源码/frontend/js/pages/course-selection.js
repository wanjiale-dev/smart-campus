/**
 * 页面 5：选课管理页 ｜ 主责 C
 * 必做：选课规则、课程列表、选课与退课、容量显示
 * 选做：候补队列、时间窗控制、选课结果冲突提示
 */
(function () {
  var CourseSelectionPage = {
    name: 'CourseSelectionPage',
    data: function () {
      return {
        loading: false,
        offerings: [],
        mySelections: [],
        keyword: ''
      };
    },
    computed: {
      user: function () { return this.$store.state.user || {}; },
      studentId: function () { return this.user.studentId || 'S2024001'; },
      canSelect: function () { return this.$can('course:select'); },
      filteredOfferings: function () {
        var kw = this.keyword.trim().toLowerCase();
        if (!kw) return this.offerings;
        return this.offerings.filter(function (o) {
          return (o.courseName + o.teacherName + o.room).toLowerCase().indexOf(kw) > -1;
        });
      },
      selectedSeats: function () {
        return this.mySelections.reduce(function (sum, s) { return sum + Number(s.credit || 0); }, 0);
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
          api.list('selections', { studentId: this.studentId, pageSize: 0 })
        ]).then(function (res) {
          self.offerings = res[0].list;
          self.mySelections = res[1].list;
        }).catch(function (error) {
          self.$message.error(error.message);
        }).then(function () {
          self.loading = false;
        });
      },
      isSelected: function (offering) {
        return this.mySelections.some(function (s) { return s.offeringId === offering.id; });
      },
      mySelection: function (offering) {
        return this.mySelections.filter(function (s) { return s.offeringId === offering.id; })[0];
      },
      conflict: function (offering) {
        return this.mySelections.filter(function (s) {
          return s.offeringId !== offering.id && s.weekday === offering.weekday && s.timeSlot === offering.timeSlot;
        })[0];
      },
      select: function (offering) {
        var self = this;
        if (this.isSelected(offering)) return this.$message.info('你已经选过这门课了');
        if (offering.enrolled >= offering.capacity) return this.$message.warning('该教学班已满，可等待候补（选做）');
        var conflict = this.conflict(offering);
        if (conflict) {
          return this.$message.warning('时间冲突：与「' + conflict.courseName + '」同为 ' + offering.weekday + ' ' + offering.timeSlot);
        }
        api.create('selections', {
          studentId: this.studentId,
          studentName: this.user.name,
          offeringId: offering.id,
          courseId: offering.courseId,
          courseName: offering.courseName,
          teacherName: offering.teacherName,
          weekday: offering.weekday,
          timeSlot: offering.timeSlot,
          room: offering.room,
          credit: 0
        }).then(function () {
          return api.update('offerings', offering.id, { enrolled: offering.enrolled + 1 });
        }).then(function () {
          self.$message.success('选课成功：' + offering.courseName);
          self.load();
        }).catch(function (error) {
          self.$message.error(error.message);
        });
      },
      drop: function (offering) {
        var self = this;
        var record = this.mySelection(offering);
        if (!record) return;
        this.$confirm('确定退选「' + offering.courseName + '」吗？', '退课确认', { type: 'warning' })
          .then(function () { return api.remove('selections', record.id); })
          .then(function () { return api.update('offerings', offering.id, { enrolled: Math.max(offering.enrolled - 1, 0) }); })
          .then(function () {
            self.$message.success('已退课');
            self.load();
          })
          .catch(function () {});
      }
    },
    template: [
      '<div class="page">',
      '  <page-header title="选课管理页" owner="C 组员"',
      '    desc="选课规则集中在本页：容量、时间冲突、退课限制。学生只看可选课程，教务可查看全部选课情况。"',
      '    :must="[\'选课规则\', \'课程列表\', \'选课与退课\', \'容量显示\']"',
      '    :optional="[\'候补队列\', \'时间窗控制\', \'冲突提示\']">',
      '    <el-tag type="info">当前身份：{{ $store.getters.roleName }}</el-tag>',
      '  </page-header>',
      '  <div class="panel">',
      '    <div class="toolbar">',
      '      <el-input v-model="keyword" placeholder="搜索课程 / 教师 / 教室" clearable style="width:240px;" prefix-icon="el-icon-search"></el-input>',
      '      <el-tag type="success">已选 {{ mySelections.length }} 门</el-tag>',
      '      <span class="spacer"></span>',
      '      <span style="font-size:12px;color:#98a1b4;">选课时间窗：第 1-2 教学周（规则示例）</span>',
      '    </div>',
      '    <el-table :data="filteredOfferings" v-loading="loading" size="medium" border>',
      '      <el-table-column prop="courseName" label="课程" width="150"></el-table-column>',
      '      <el-table-column prop="teacherName" label="教师" width="100"></el-table-column>',
      '      <el-table-column prop="className" label="教学班" width="120"></el-table-column>',
      '      <el-table-column label="上课时间" width="160">',
      '        <template slot-scope="s">{{ s.row.weekday }} {{ s.row.timeSlot }}</template>',
      '      </el-table-column>',
      '      <el-table-column prop="room" label="教室" width="90"></el-table-column>',
      '      <el-table-column label="容量" width="150">',
      '        <template slot-scope="s">',
      '          <span :style="{ color: s.row.enrolled >= s.row.capacity ? \'#f56c6c\' : \'#5a6680\' }">',
      '            {{ s.row.enrolled }} / {{ s.row.capacity }}',
      '          </span>',
      '          <el-tag v-if="s.row.enrolled >= s.row.capacity" size="mini" type="danger" style="margin-left:6px;">已满</el-tag>',
      '        </template>',
      '      </el-table-column>',
      '      <el-table-column label="操作" width="110" fixed="right">',
      '        <template slot-scope="s">',
      '          <el-button v-if="isSelected(s.row)" type="text" style="color:#f56c6c;" @click="drop(s.row)">退课</el-button>',
      '          <el-button v-else type="text" :disabled="!canSelect" @click="select(s.row)">选课</el-button>',
      '        </template>',
      '      </el-table-column>',
      '    </el-table>',
      '    <div class="todo-note"><b>本页待完成：</b>候补队列、选课时间窗开关、选课结果（抽签/先到先得）规则说明。修改文件：<span class="mono">js/pages/course-selection.js</span></div>',
      '  </div>',
      '  <div class="panel">',
      '    <div class="panel-title">我的选课 <span class="tip">退课后容量立即释放</span></div>',
      '    <el-table :data="mySelections" size="small" empty-text="还没有选课，去上方课程列表选择吧">',
      '      <el-table-column prop="courseName" label="课程" width="150"></el-table-column>',
      '      <el-table-column prop="teacherName" label="教师" width="100"></el-table-column>',
      '      <el-table-column label="时间" width="160"><template slot-scope="s">{{ s.row.weekday }} {{ s.row.timeSlot }}</template></el-table-column>',
      '      <el-table-column prop="room" label="教室" width="90"></el-table-column>',
      '    </el-table>',
      '  </div>',
      '</div>'
    ].join('')
  };

  window.Pages = window.Pages || {};
  window.Pages.CourseSelection = CourseSelectionPage;
})();
