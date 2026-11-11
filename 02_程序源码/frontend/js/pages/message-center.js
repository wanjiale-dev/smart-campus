/**
 * 页面 12：校园消息中心 ｜ 主责 A（新增拓展页）
 * 必做：分类与列表、消息详情、已读管理、发布通知、权限控制、异常反馈
 * 选做：富文本正文、定时发布/撤回、阅读统计/催读、订阅免打扰
 */
(function () {
  var MessageCenterPage = {
    name: 'MessageCenterPage',
    data: function () {
      return {
        loading: false,
        category: '全部',
        categories: ['全部', '系统', '教学', '审批', '活动'],
        keyword: '',
        rows: [],
        total: 0,
        unread: 0,
        page: 1,
        pageSize: 8,
        drawerVisible: false,
        current: null,
        publishVisible: false,
        publishing: false,
        publishForm: { category: '教学', title: '', content: '', targetRoles: ['student'], pinned: false },
        publishRules: {
          title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
          content: [{ required: true, message: '请输入正文', trigger: 'blur' }]
        },
        roleOptions: [
          { value: 'student', label: '学生' },
          { value: 'teacher', label: '教师' },
          { value: 'counselor', label: '辅导员' },
          { value: 'academic', label: '教务管理员' },
          { value: 'admin', label: '管理员' }
        ]
      };
    },
    computed: {
      user: function () { return this.$store.state.user || {}; },
      canPublish: function () { return this.$can('message:publish'); }
    },
    created: function () {
      this.load();
    },
    methods: {
      load: function () {
        var self = this;
        this.loading = true;
        api.messages({
          userId: this.user.id,
          role: this.user.role,
          category: this.category,
          keyword: this.keyword,
          page: this.page,
          pageSize: this.pageSize
        }).then(function (res) {
          self.rows = res.list;
          self.total = res.total;
          self.unread = res.unread;
          self.$store.commit('SET_UNREAD', res.unread);
        }).catch(function (error) {
          self.$message.error(error.message);
        }).then(function () {
          self.loading = false;
        });
      },
      switchCategory: function (name) {
        this.category = name;
        this.page = 1;
        this.load();
      },
      open: function (row) {
        var self = this;
        this.current = row;
        this.drawerVisible = true;
        if (!row.read) {
          api.readMessage(row.id, this.user.id).then(function () {
            row.read = true;
            self.unread = Math.max(self.unread - 1, 0);
            self.$store.commit('SET_UNREAD', self.unread);
          }).catch(function () {});
        }
      },
      readAll: function () {
        var self = this;
        this.$confirm('确定把当前角色能看到的全部消息标记为已读吗？', '全部已读', { type: 'info' })
          .then(function () {
            return api.readAll(self.user.id, self.user.role);
          })
          .then(function () {
            self.$message.success('已全部标记为已读');
            self.load();
          })
          .catch(function () {});
      },
      openPublish: function () {
        this.publishForm = { category: '教学', title: '', content: '', targetRoles: ['student'], pinned: false };
        this.publishVisible = true;
      },
      publish: function () {
        var self = this;
        this.$refs.publishForm.validate(function (valid) {
          if (!valid) return;
          if (!self.publishForm.targetRoles.length) return self.$message.warning('请至少选择一个接收角色');
          self.publishing = true;
          api.publishMessage({
            category: self.publishForm.category,
            title: self.publishForm.title,
            content: self.publishForm.content,
            targetRoles: self.publishForm.targetRoles,
            pinned: self.publishForm.pinned,
            senderName: self.user.name,
            senderRole: self.user.role
          }).then(function () {
            self.$message.success('发布成功');
            self.publishVisible = false;
            self.load();
          }).catch(function (error) {
            self.$message.error(error.message);
          }).then(function () {
            self.publishing = false;
          });
        });
      },
      withdraw: function (row) {
        var self = this;
        this.$confirm('撤回后接收人将看不到这条消息，确定撤回吗？', '撤回消息', { type: 'warning' })
          .then(function () { return api.withdrawMessage(row.id); })
          .then(function () {
            self.$message.success('已撤回');
            self.drawerVisible = false;
            self.load();
          })
          .catch(function () {});
      },
      roleLabel: function (role) {
        return Auth.roleName(role);
      },
      download: function (file) {
        this.$message.info('附件下载为演示占位：' + file.name + '（' + file.size + '）');
      }
    },
    template: [
      '<div class="page">',
      '  <page-header title="校园消息中心" owner="A 组员"',
      '    desc="统一承接系统通知、教学通知、审批提醒与活动消息；按角色定向发布，管理已读未读与附件。顶部铃铛角标与本页数据联动。"',
      '    :must="[\'分类与列表\', \'消息详情\', \'已读管理\', \'发布通知\', \'权限控制\', \'异常反馈\']"',
      '    :optional="[\'富文本\', \'定时/撤回\', \'阅读统计\', \'订阅免打扰\']">',
      '    <el-button v-perm="\'message:publish\'" type="primary" icon="el-icon-edit" @click="openPublish">发布通知</el-button>',
      '    <el-button icon="el-icon-check" @click="readAll">全部已读</el-button>',
      '  </page-header>',
      '  <div class="panel">',
      '    <div class="toolbar">',
      '      <el-radio-group v-model="category" size="small" @change="switchCategory">',
      '        <el-radio-button v-for="c in categories" :key="c" :label="c">{{ c }}</el-radio-button>',
      '      </el-radio-group>',
      '      <span class="spacer"></span>',
      '      <el-input v-model="keyword" placeholder="搜索标题 / 正文" clearable style="width:220px;" @keyup.enter.native="load"></el-input>',
      '      <el-button icon="el-icon-search" @click="load">搜索</el-button>',
      '    </div>',
      '    <el-table :data="rows" v-loading="loading" size="medium" border empty-text="暂无消息">',
      '      <el-table-column label="状态" width="80">',
      '        <template slot-scope="s">',
      '          <el-tag size="mini" :type="s.row.read ? \'info\' : \'danger\'">{{ s.row.read ? \'已读\' : \'未读\' }}</el-tag>',
      '        </template>',
      '      </el-table-column>',
      '      <el-table-column label="分类" width="90">',
      '        <template slot-scope="s"><el-tag size="mini" type="warning">{{ s.row.category }}</el-tag></template>',
      '      </el-table-column>',
      '      <el-table-column label="标题" min-width="300">',
      '        <template slot-scope="s">',
      '          <span :style="{ fontWeight: s.row.read ? 400 : 600, color: s.row.read ? \'#5a6680\' : \'#222b3d\' }"',
      '                style="cursor:pointer;" @click="open(s.row)">',
      '            <i v-if="s.row.pinned" class="el-icon-top" style="color:#f56c6c;"></i>',
      '            {{ s.row.title }}',
      '          </span>',
      '          <i v-if="s.row.attachments && s.row.attachments.length" class="el-icon-paperclip" style="color:#98a1b4;margin-left:6px;"></i>',
      '        </template>',
      '      </el-table-column>',
      '      <el-table-column prop="senderName" label="发送人" width="100"></el-table-column>',
      '      <el-table-column prop="publishAt" label="发布时间" width="150"></el-table-column>',
      '      <el-table-column label="操作" width="140" fixed="right">',
      '        <template slot-scope="s">',
      '          <el-button type="text" @click="open(s.row)">查看</el-button>',
      '          <el-button v-if="user.role === \'admin\'" type="text" style="color:#f56c6c;" @click="withdraw(s.row)">撤回</el-button>',
      '        </template>',
      '      </el-table-column>',
      '    </el-table>',
      '    <el-pagination style="margin-top:14px;text-align:right;" background layout="total, prev, pager, next"',
      '      :total="total" :current-page.sync="page" :page-size="pageSize" @current-change="load"></el-pagination>',
      '    <div class="todo-note"><b>本页待完成：</b>富文本正文、定时发布、已读名单与催读（选做）。修改文件：<span class="mono">js/pages/message-center.js</span></div>',
      '  </div>',
      '  <el-drawer title="消息详情" :visible.sync="drawerVisible" size="480px" v-if="current">',
      '    <div style="padding:0 22px 22px;">',
      '      <h3 style="margin:6px 0 10px;font-size:17px;">{{ current.title }}</h3>',
      '      <div style="font-size:12px;color:#98a1b4;margin-bottom:16px;">',
      '        <el-tag size="mini" type="warning" style="margin-right:8px;">{{ current.category }}</el-tag>',
      '        {{ current.senderName }} · {{ current.publishAt }}',
      '      </div>',
      '      <p style="font-size:13px;line-height:2;color:#3d4759;white-space:pre-wrap;">{{ current.content }}</p>',
      '      <div v-if="current.attachments && current.attachments.length" style="margin-top:18px;">',
      '        <div class="panel-title" style="font-size:13px;">附件</div>',
      '        <div v-for="file in current.attachments" :key="file.name" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #eef2f8;border-radius:6px;margin-bottom:8px;">',
      '          <i class="el-icon-document" style="color:#3a63d6;"></i>',
      '          <span style="flex:1;font-size:13px;">{{ file.name }}</span>',
      '          <span style="font-size:12px;color:#98a1b4;">{{ file.size }}</span>',
      '          <el-button type="text" @click="download(file)">下载</el-button>',
      '        </div>',
      '      </div>',
      '      <div style="margin-top:20px;font-size:12px;color:#98a1b4;">',
      '        接收角色：<el-tag v-for="r in current.targetRoles" :key="r" size="mini" type="info" style="margin-right:4px;">{{ r === \'all\' ? \'全部角色\' : roleLabel(r) }}</el-tag>',
      '      </div>',
      '    </div>',
      '  </el-drawer>',
      '  <el-dialog title="发布通知" :visible.sync="publishVisible" width="560px">',
      '    <el-form ref="publishForm" :model="publishForm" :rules="publishRules" label-width="90px">',
      '      <el-form-item label="分类">',
      '        <el-select v-model="publishForm.category" style="width:160px;">',
      '          <el-option v-for="c in [\'系统\',\'教学\',\'审批\',\'活动\']" :key="c" :label="c" :value="c"></el-option>',
      '        </el-select>',
      '      </el-form-item>',
      '      <el-form-item label="接收角色">',
      '        <el-checkbox-group v-model="publishForm.targetRoles">',
      '          <el-checkbox v-for="r in roleOptions" :key="r.value" :label="r.value">{{ r.label }}</el-checkbox>',
      '        </el-checkbox-group>',
      '      </el-form-item>',
      '      <el-form-item label="标题" prop="title"><el-input v-model="publishForm.title" placeholder="请输入通知标题"></el-input></el-form-item>',
      '      <el-form-item label="正文" prop="content"><el-input v-model="publishForm.content" type="textarea" :rows="5" placeholder="请输入通知内容"></el-input></el-form-item>',
      '      <el-form-item label="置顶"><el-switch v-model="publishForm.pinned"></el-switch></el-form-item>',
      '    </el-form>',
      '    <span slot="footer">',
      '      <el-button @click="publishVisible = false">取消</el-button>',
      '      <el-button type="primary" :loading="publishing" @click="publish">发布</el-button>',
      '    </span>',
      '  </el-dialog>',
      '</div>'
    ].join('')
  };

  window.Pages = window.Pages || {};
  window.Pages.MessageCenter = MessageCenterPage;
})();
