/**
 * 页面 11：校园场地预约页 ｜ 主责 E（新增拓展页）
 * 必做：资源列表与筛选、预约日历/时段、预约表单、我的预约、审批工作台、权限与异常
 * 选做：冲突可视化、周期预约、多级审批、扫码核销、利用率看板
 */
(function () {
  var CampusVenuePage = {
    name: 'CampusVenuePage',
    data: function () {
      return {
        loading: false,
        tab: 'venues',
        venues: [],
        bookings: [],
        query: { keyword: '', type: '', building: '' },
        dialogVisible: false,
        form: { venueId: '', date: '', startTime: '19:00', endTime: '21:00', purpose: '', attendees: 10, contact: '' },
        rules: {
          venueId: [{ required: true, message: '请选择场地', trigger: 'change' }],
          date: [{ required: true, message: '请选择日期', trigger: 'change' }],
          purpose: [{ required: true, message: '请填写用途', trigger: 'blur' }],
          attendees: [{ required: true, message: '请填写人数', trigger: 'blur' }]
        },
        timeOptions: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'],
        submitting: false
      };
    },
    computed: {
      user: function () { return this.$store.state.user || {}; },
      canApprove: function () { return this.$can('venue:approve'); },
      filteredVenues: function () {
        var q = this.query;
        var kw = (q.keyword || '').toLowerCase();
        return this.venues.filter(function (v) {
          if (q.type && v.type !== q.type) return false;
          if (q.building && v.building !== q.building) return false;
          if (kw && (v.name + v.building + (v.equipment || []).join('')).toLowerCase().indexOf(kw) === -1) return false;
          return true;
        });
      },
      buildings: function () {
        var list = [];
        this.venues.forEach(function (v) { if (list.indexOf(v.building) === -1) list.push(v.building); });
        return list;
      },
      myBookings: function () {
        var self = this;
        return this.bookings.filter(function (b) { return b.applicantId === self.user.id; });
      },
      pendingBookings: function () {
        return this.bookings.filter(function (b) { return b.status === '待审批'; });
      },
      selectedVenue: function () {
        var id = this.form.venueId;
        return this.venues.filter(function (v) { return v.id === id; })[0];
      },
      // 所选场地 + 日期的已有占用，用于把"冲突"提前告诉用户
      busySlots: function () {
        var f = this.form;
        return this.bookings.filter(function (b) {
          return b.venueId === f.venueId && b.date === f.date && ['待审批', '已通过'].indexOf(b.status) > -1;
        });
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
          api.list('venues', { pageSize: 0 }),
          api.list('bookings', { pageSize: 0 })
        ]).then(function (res) {
          self.venues = res[0].list;
          self.bookings = res[1].list;
        }).catch(function (error) {
          self.$message.error(error.message);
        }).then(function () {
          self.loading = false;
        });
      },
      openBooking: function (venue) {
        if (venue.status !== '可用') return this.$message.warning('该场地正在维护，暂不可预约');
        this.form = { venueId: venue.id, date: '', startTime: '19:00', endTime: '21:00', purpose: '', attendees: 10, contact: '' };
        this.dialogVisible = true;
      },
      submit: function () {
        var self = this;
        this.$refs.form.validate(function (valid) {
          if (!valid) return;
          self.submitting = true;
          api.createBooking({
            venueId: self.form.venueId,
            date: self.form.date,
            startTime: self.form.startTime,
            endTime: self.form.endTime,
            purpose: self.form.purpose,
            attendees: self.form.attendees,
            contact: self.form.contact,
            applicantId: self.user.id,
            applicantName: self.user.name,
            applicantRole: self.user.role
          }).then(function () {
            self.$message.success('预约申请已提交，等待管理员审批');
            self.dialogVisible = false;
            self.tab = 'mine';
            self.load();
          }).catch(function (error) {
            self.$message.error(error.message);
          }).then(function () {
            self.submitting = false;
          });
        });
      },
      cancel: function (row) {
        var self = this;
        this.$confirm('确定取消「' + row.venueName + ' ' + row.date + '」的预约吗？', '取消预约', { type: 'warning' })
          .then(function () {
            return api.cancelBooking(row.id, { applicantId: self.user.id, role: self.user.role });
          })
          .then(function () {
            self.$message.success('已取消，时段已释放');
            self.load();
          })
          .catch(function () {});
      },
      approve: function (row) {
        var self = this;
        this.$prompt('请输入审批意见（驳回时必填）', '审批：' + row.venueName, {
          inputPlaceholder: '如：场地已确认，请按时使用',
          distinguishCancelAndClose: true,
          confirmButtonText: '通过',
          cancelButtonText: '驳回'
        }).then(function (value) {
          return api.approveBooking(row.id, { status: '已通过', remark: value.value || '', approverName: self.user.name });
        }).then(function () {
          self.$message.success('已通过审批，申请人会收到站内消息');
          self.load();
        }).catch(function (action) {
          if (action !== 'cancel') return;
          self.$prompt('请填写驳回原因', '驳回预约', { inputPlaceholder: '驳回原因必填' }).then(function (value) {
            return api.approveBooking(row.id, { status: '已驳回', remark: value.value || '', approverName: self.user.name });
          }).then(function () {
            self.$message.success('已驳回');
            self.load();
          }).catch(function () {});
        });
      },
      statusType: function (status) {
        return { 待审批: 'warning', 已通过: 'success', 已驳回: 'danger', 已取消: 'info' }[status] || 'info';
      }
    },
    template: [
      '<div class="page">',
      '  <page-header title="校园场地预约页" owner="E 组员"',
      '    desc="把「课程/考场占用」变成可申请的时段：教师、学生、社团按时间段预约教室/会议室/场馆，管理员审批。"',
      '    :must="[\'资源列表\', \'时段选择\', \'预约表单\', \'我的预约\', \'审批工作台\', \'权限控制\']"',
      '    :optional="[\'冲突可视化\', \'周期预约\', \'多级审批\', \'扫码核销\', \'利用率看板\']">',
      '    <el-button icon="el-icon-refresh" @click="load">刷新</el-button>',
      '  </page-header>',
      '  <div class="panel">',
      '    <el-tabs v-model="tab">',
      '      <el-tab-pane label="场地资源" name="venues">',
      '        <div class="toolbar">',
      '          <el-input v-model="query.keyword" placeholder="场地名称 / 楼栋 / 设备" clearable style="width:220px;"></el-input>',
      '          <el-select v-model="query.type" placeholder="全部类型" clearable style="width:130px;">',
      '            <el-option label="教室" value="教室"></el-option><el-option label="会议室" value="会议室"></el-option><el-option label="场馆" value="场馆"></el-option>',
      '          </el-select>',
      '          <el-select v-model="query.building" placeholder="全部楼栋" clearable style="width:140px;">',
      '            <el-option v-for="b in buildings" :key="b" :label="b" :value="b"></el-option>',
      '          </el-select>',
      '        </div>',
      '        <el-table :data="filteredVenues" v-loading="loading" size="medium" border empty-text="没有符合条件的场地">',
      '          <el-table-column prop="name" label="场地" width="160"></el-table-column>',
      '          <el-table-column prop="type" label="类型" width="90"></el-table-column>',
      '          <el-table-column label="位置" width="150">',
      '            <template slot-scope="s">{{ s.row.building }} {{ s.row.floor }}</template>',
      '          </el-table-column>',
      '          <el-table-column prop="capacity" label="容量" width="80"></el-table-column>',
      '          <el-table-column label="设备" min-width="180">',
      '            <template slot-scope="s">',
      '              <el-tag v-for="e in s.row.equipment" :key="e" size="mini" type="info" style="margin-right:4px;">{{ e }}</el-tag>',
      '            </template>',
      '          </el-table-column>',
      '          <el-table-column prop="openHours" label="开放时段" width="130"></el-table-column>',
      '          <el-table-column label="状态" width="90">',
      '            <template slot-scope="s">',
      '              <el-tag size="mini" :type="s.row.status === \'可用\' ? \'success\' : \'info\'">{{ s.row.status }}</el-tag>',
      '            </template>',
      '          </el-table-column>',
      '          <el-table-column label="操作" width="110" fixed="right">',
      '            <template slot-scope="s">',
      '              <el-button type="text" :disabled="s.row.status !== \'可用\'" @click="openBooking(s.row)">预约</el-button>',
      '            </template>',
      '          </el-table-column>',
      '        </el-table>',
      '      </el-tab-pane>',
      '      <el-tab-pane :label="\'我的预约（\' + myBookings.length + \'）\'" name="mine">',
      '        <el-table :data="myBookings" v-loading="loading" size="medium" border empty-text="还没有预约记录">',
      '          <el-table-column prop="venueName" label="场地" width="150"></el-table-column>',
      '          <el-table-column prop="date" label="日期" width="120"></el-table-column>',
      '          <el-table-column label="时段" width="140">',
      '            <template slot-scope="s">{{ s.row.startTime }} - {{ s.row.endTime }}</template>',
      '          </el-table-column>',
      '          <el-table-column prop="purpose" label="用途" min-width="160"></el-table-column>',
      '          <el-table-column prop="attendees" label="人数" width="80"></el-table-column>',
      '          <el-table-column label="状态" width="100">',
      '            <template slot-scope="s"><el-tag size="mini" :type="statusType(s.row.status)">{{ s.row.status }}</el-tag></template>',
      '          </el-table-column>',
      '          <el-table-column prop="remark" label="审批意见" min-width="150"></el-table-column>',
      '          <el-table-column label="操作" width="100" fixed="right">',
      '            <template slot-scope="s">',
      '              <el-button v-if="[\'待审批\',\'已通过\'].indexOf(s.row.status) > -1" type="text" style="color:#f56c6c;" @click="cancel(s.row)">取消</el-button>',
      '              <span v-else style="color:#c0c6d4;">—</span>',
      '            </template>',
      '          </el-table-column>',
      '        </el-table>',
      '      </el-tab-pane>',
      '      <el-tab-pane v-if="canApprove" :label="\'审批工作台（\' + pendingBookings.length + \'）\'" name="approve">',
      '        <el-table :data="pendingBookings" v-loading="loading" size="medium" border empty-text="没有待审批的预约">',
      '          <el-table-column prop="applicantName" label="申请人" width="110"></el-table-column>',
      '          <el-table-column prop="venueName" label="场地" width="150"></el-table-column>',
      '          <el-table-column prop="date" label="日期" width="120"></el-table-column>',
      '          <el-table-column label="时段" width="140">',
      '            <template slot-scope="s">{{ s.row.startTime }} - {{ s.row.endTime }}</template>',
      '          </el-table-column>',
      '          <el-table-column prop="purpose" label="用途" min-width="150"></el-table-column>',
      '          <el-table-column prop="attendees" label="人数" width="80"></el-table-column>',
      '          <el-table-column label="操作" width="100" fixed="right">',
      '            <template slot-scope="s"><el-button type="text" @click="approve(s.row)">审批</el-button></template>',
      '          </el-table-column>',
      '        </el-table>',
      '        <div class="todo-note">审批通过后会自动给申请人发一条审批类站内消息，可在消息中心看到联动效果。</div>',
      '      </el-tab-pane>',
      '    </el-tabs>',
      '  </div>',
      '  <el-dialog title="提交场地预约" :visible.sync="dialogVisible" width="520px">',
      '    <el-form ref="form" :model="form" :rules="rules" label-width="86px">',
      '      <el-form-item label="场地" prop="venueId">',
      '        <el-select v-model="form.venueId" style="width:100%;">',
      '          <el-option v-for="v in venues" :key="v.id" :label="v.name + \'（\' + v.building + \'，\' + v.capacity + \' 人）\'" :value="v.id" :disabled="v.status !== \'可用\'"></el-option>',
      '        </el-select>',
      '      </el-form-item>',
      '      <el-form-item label="日期" prop="date">',
      '        <el-date-picker v-model="form.date" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" style="width:100%;"></el-date-picker>',
      '      </el-form-item>',
      '      <el-form-item label="时间段">',
      '        <div style="display:flex;gap:8px;align-items:center;">',
      '          <el-select v-model="form.startTime" style="width:120px;">',
      '            <el-option v-for="t in timeOptions" :key="t" :label="t" :value="t"></el-option>',
      '          </el-select>',
      '          <span>至</span>',
      '          <el-select v-model="form.endTime" style="width:120px;">',
      '            <el-option v-for="t in timeOptions" :key="t" :label="t" :value="t"></el-option>',
      '          </el-select>',
      '        </div>',
      '        <div v-if="busySlots.length" style="color:#e6a23c;font-size:12px;margin-top:4px;">',
      '          该场地当天已有占用：<span v-for="b in busySlots" :key="b.id">{{ b.startTime }}-{{ b.endTime }}（{{ b.status }}）；</span>',
      '        </div>',
      '      </el-form-item>',
      '      <el-form-item label="用途" prop="purpose">',
      '        <el-input v-model="form.purpose" placeholder="如：社团例会 / 临时补课 / 教研活动"></el-input>',
      '      </el-form-item>',
      '      <el-form-item label="人数" prop="attendees">',
      '        <el-input-number v-model="form.attendees" :min="1" :max="500"></el-input-number>',
      '        <span v-if="selectedVenue" style="margin-left:8px;color:#98a1b4;font-size:12px;">容量上限 {{ selectedVenue.capacity }} 人</span>',
      '      </el-form-item>',
      '      <el-form-item label="联系方式">',
      '        <el-input v-model="form.contact" placeholder="手机号，便于管理员联系"></el-input>',
      '      </el-form-item>',
      '    </el-form>',
      '    <span slot="footer">',
      '      <el-button @click="dialogVisible = false">取消</el-button>',
      '      <el-button type="primary" :loading="submitting" @click="submit">提交申请</el-button>',
      '    </span>',
      '  </el-dialog>',
      '</div>'
    ].join('')
  };

  window.Pages = window.Pages || {};
  window.Pages.CampusVenue = CampusVenuePage;
})();
