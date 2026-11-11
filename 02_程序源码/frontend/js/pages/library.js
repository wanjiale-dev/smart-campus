/**
 * 页面 13：图书借阅页 ｜ 主责 王（六人版新增）
 * 必做：馆藏检索、借阅办理、借阅记录、归还/续借、逾期提醒、权限控制
 * 选做：预约到书、罚款计算、借阅排行、扫码借还、馆藏盘点
 *
 * 权限说明：
 * - 学生 / 教师：可检索馆藏、借阅、归还/续借自己的记录
 * - 图书管理员：额外可新增图书、查看全部借阅记录、代办归还与续借
 * - 教务 / 辅导员：路由 meta.roles 未放行，访问 /campus/library 会被守卫拦到 403
 */
(function () {
  function todayText() {
    var d = new Date();
    function p(n) { return n < 10 ? '0' + n : '' + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  var LibraryPage = {
    name: 'LibraryPage',
    data: function () {
      return {
        loading: false,
        tab: 'catalog',
        books: [],
        borrows: [],
        query: { keyword: '', category: '', onlyAvailable: false },
        recordQuery: { status: '' },
        dialogVisible: false,
        submitting: false,
        form: { title: '', author: '', isbn: '', category: '教材', publisher: '', total: 1, location: '' },
        rules: {
          title: [{ required: true, message: '请输入书名', trigger: 'blur' }],
          author: [{ required: true, message: '请输入作者', trigger: 'blur' }],
          total: [{ required: true, message: '请填写馆藏册数', trigger: 'blur' }]
        }
      };
    },
    computed: {
      user: function () { return this.$store.state.user || {}; },
      isManager: function () {
        return this.user.role === 'admin' || this.user.role === 'librarian';
      },
      categories: function () {
        var list = [];
        this.books.forEach(function (b) {
          if (list.indexOf(b.category) === -1) list.push(b.category);
        });
        return list;
      },
      filteredBooks: function () {
        var q = this.query;
        var kw = (q.keyword || '').toLowerCase();
        return this.books.filter(function (b) {
          if (q.category && b.category !== q.category) return false;
          if (q.onlyAvailable && Number(b.available) <= 0) return false;
          if (kw && (b.title + b.author + b.isbn + (b.publisher || '')).toLowerCase().indexOf(kw) === -1) return false;
          return true;
        });
      },
      myBorrows: function () {
        var self = this;
        return this.borrows.filter(function (r) { return r.userId === self.user.id; });
      },
      visibleBorrows: function () {
        var self = this;
        var list = this.isManager ? this.borrows : this.myBorrows;
        if (this.isManager && this.recordQuery.status) {
          list = list.filter(function (r) { return self.statusText(r) === self.recordQuery.status; });
        }
        return list;
      },
      borrowedIds: function () {
        var self = this;
        return this.borrows.filter(function (r) {
          return r.userId === self.user.id && r.status === '借阅中';
        }).map(function (r) { return r.bookId; });
      },
      overdueCount: function () {
        var self = this;
        return this.visibleBorrows.filter(function (r) {
          return self.statusText(r) === '逾期';
        }).length;
      },
      cards: function () {
        var totalCopies = 0;
        var availableCopies = 0;
        this.books.forEach(function (b) {
          totalCopies += Number(b.total || 0);
          availableCopies += Number(b.available || 0);
        });
        var borrowing = this.borrows.filter(function (r) { return r.status === '借阅中'; }).length;
        var today = todayText();
        var overdue = this.borrows.filter(function (r) {
          return r.status === '借阅中' && r.dueDate < today;
        }).length;
        return [
          { label: '馆藏总册数', value: totalCopies, foot: '共 ' + this.books.length + ' 种图书', icon: 'el-icon-notebook-2', color: '#3a63d6' },
          { label: '在架可借', value: availableCopies, foot: '可直接办理借阅', icon: 'el-icon-reading', color: '#12b886' },
          { label: '借阅中', value: borrowing, foot: '我的借阅 ' + this.myBorrows.filter(function (r) { return r.status === '借阅中'; }).length + ' 本', icon: 'el-icon-time', color: '#f59f00' },
          { label: '逾期未还', value: overdue, foot: overdue ? '请尽快归还或续借' : '暂无逾期记录', icon: 'el-icon-warning-outline', color: '#f56c6c' }
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
          api.list('books', { pageSize: 0 }),
          api.list('borrows', { pageSize: 0 })
        ]).then(function (res) {
          self.books = res[0].list;
          self.borrows = res[1].list;
        }).catch(function (error) {
          self.$message.error(error.message);
        }).then(function () {
          self.loading = false;
        });
      },
      statusText: function (row) {
        if (row.status === '借阅中' && row.dueDate < todayText()) return '逾期';
        return row.status;
      },
      statusType: function (row) {
        return { 借阅中: 'warning', 逾期: 'danger', 已归还: 'success' }[this.statusText(row)] || 'info';
      },
      canOperate: function (row) {
        return row.status === '借阅中' && (this.isManager || row.userId === this.user.id);
      },
      borrow: function (row) {
        var self = this;
        this.$confirm('确认借阅《' + row.title + '》？借期 ' + 30 + ' 天。', '借阅确认', { type: 'info' })
          .then(function () {
            return api.borrowBook(row.id, {
              userId: self.user.id,
              userName: self.user.name,
              userRole: self.user.role
            });
          })
          .then(function (record) {
            self.$message.success('借阅成功，请于 ' + record.dueDate + ' 前归还');
            self.tab = 'records';
            self.load();
          })
          .catch(function (error) {
            if (error && error.message) self.$message.error(error.message);
          });
      },
      returnBook: function (row) {
        var self = this;
        this.$confirm('确认归还《' + row.bookTitle + '》吗？', '归还确认', { type: 'warning' })
          .then(function () {
            return api.returnBook(row.id);
          })
          .then(function () {
            self.$message.success('归还成功，馆藏已恢复可借');
            self.load();
          })
          .catch(function (error) {
            if (error && error.message) self.$message.error(error.message);
          });
      },
      renew: function (row) {
        var self = this;
        this.$confirm('每本图书限续借 1 次，确认续借《' + row.bookTitle + '》？', '续借确认', { type: 'info' })
          .then(function () {
            return api.renewBorrow(row.id);
          })
          .then(function (record) {
            self.$message.success('续借成功，应还日期延至 ' + record.dueDate);
            self.load();
          })
          .catch(function (error) {
            if (error && error.message) self.$message.error(error.message);
          });
      },
      openAdd: function () {
        this.form = { title: '', author: '', isbn: '', category: '教材', publisher: '', total: 1, location: '' };
        this.dialogVisible = true;
        this.$nextTick(function () {
          if (this.$refs.bookForm) this.$refs.bookForm.clearValidate();
        });
      },
      submitBook: function () {
        var self = this;
        this.$refs.bookForm.validate(function (valid) {
          if (!valid) return;
          self.submitting = true;
          api.create('books', {
            title: self.form.title,
            author: self.form.author,
            isbn: self.form.isbn,
            category: self.form.category,
            publisher: self.form.publisher,
            total: Number(self.form.total),
            available: Number(self.form.total),
            location: self.form.location
          }).then(function () {
            self.$message.success('图书已入库');
            self.dialogVisible = false;
            self.load();
          }).catch(function (error) {
            self.$message.error(error.message);
          }).then(function () {
            self.submitting = false;
          });
        });
      }
    },
    template: [
      '<div class="page">',
      '  <page-header title="图书借阅页" owner="王（六人版）"',
      '    desc="把图书馆借还搬进平台：学生/教师自助检索与借阅，图书管理员负责馆藏维护、代办归还与续借。"',
      '    :must="[\'馆藏检索\', \'借阅办理\', \'借阅记录\', \'归还与续借\', \'逾期提醒\', \'权限控制\']"',
      '    :optional="[\'预约到书\', \'罚款计算\', \'借阅排行\', \'扫码借还\', \'馆藏盘点\']">',
      '    <el-button v-perm="\'book:add\'" type="primary" icon="el-icon-plus" @click="openAdd">新增图书</el-button>',
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
      '  <div class="panel" style="margin-top:14px;">',
      '    <el-tabs v-model="tab">',
      '      <el-tab-pane label="馆藏检索" name="catalog">',
      '        <div class="toolbar">',
      '          <el-input v-model="query.keyword" placeholder="书名 / 作者 / ISBN / 出版社" clearable style="width:260px;"></el-input>',
      '          <el-select v-model="query.category" placeholder="全部分类" clearable style="width:130px;">',
      '            <el-option v-for="c in categories" :key="c" :label="c" :value="c"></el-option>',
      '          </el-select>',
      '          <el-checkbox v-model="query.onlyAvailable" style="margin-left:4px;">只看可借</el-checkbox>',
      '        </div>',
      '        <el-table :data="filteredBooks" v-loading="loading" size="medium" border empty-text="没有符合条件的图书">',
      '          <el-table-column prop="title" label="书名" min-width="200"></el-table-column>',
      '          <el-table-column prop="author" label="作者" width="150"></el-table-column>',
      '          <el-table-column prop="isbn" label="ISBN" width="140"></el-table-column>',
      '          <el-table-column label="分类" width="90">',
      '            <template slot-scope="s"><el-tag size="mini" type="info">{{ s.row.category }}</el-tag></template>',
      '          </el-table-column>',
      '          <el-table-column prop="publisher" label="出版社" min-width="150"></el-table-column>',
      '          <el-table-column prop="location" label="馆藏位置" width="110"></el-table-column>',
      '          <el-table-column label="在架 / 馆藏" width="110">',
      '            <template slot-scope="s">{{ s.row.available }} / {{ s.row.total }}</template>',
      '          </el-table-column>',
      '          <el-table-column label="状态" width="90">',
      '            <template slot-scope="s">',
      '              <el-tag size="mini" :type="Number(s.row.available) > 0 ? \'success\' : \'info\'">{{ Number(s.row.available) > 0 ? \'可借\' : \'已借完\' }}</el-tag>',
      '            </template>',
      '          </el-table-column>',
      '          <el-table-column label="操作" width="100" fixed="right">',
      '            <template slot-scope="s">',
      '              <el-button v-if="borrowedIds.indexOf(s.row.id) > -1" type="text" disabled>已借阅</el-button>',
      '              <el-button v-else type="text" :disabled="Number(s.row.available) <= 0" @click="borrow(s.row)">借阅</el-button>',
      '            </template>',
      '          </el-table-column>',
      '        </el-table>',
      '      </el-tab-pane>',
      '      <el-tab-pane :label="\'借阅记录（\' + visibleBorrows.length + \'）\'" name="records">',
      '        <div class="toolbar">',
      '          <el-select v-if="isManager" v-model="recordQuery.status" placeholder="全部状态" clearable style="width:130px;">',
      '            <el-option label="借阅中" value="借阅中"></el-option>',
      '            <el-option label="已归还" value="已归还"></el-option>',
      '            <el-option label="逾期" value="逾期"></el-option>',
      '          </el-select>',
      '          <span class="tip">',
      '            {{ isManager ? \'图书管理员可查看全部读者的借阅记录，并代办归还/续借\' : \'这里只显示你自己的借阅记录\' }}',
      '          </span>',
      '        </div>',
      '        <el-table :data="visibleBorrows" v-loading="loading" size="medium" border empty-text="暂无借阅记录">',
      '          <el-table-column prop="bookTitle" label="图书" min-width="200"></el-table-column>',
      '          <el-table-column v-if="isManager" prop="userName" label="读者" width="100"></el-table-column>',
      '          <el-table-column prop="borrowDate" label="借出日期" width="110"></el-table-column>',
      '          <el-table-column prop="dueDate" label="应还日期" width="110"></el-table-column>',
      '          <el-table-column label="归还日期" width="110">',
      '            <template slot-scope="s">{{ s.row.returnDate || \'—\' }}</template>',
      '          </el-table-column>',
      '          <el-table-column label="状态" width="90">',
      '            <template slot-scope="s"><el-tag size="mini" :type="statusType(s.row)">{{ statusText(s.row) }}</el-tag></template>',
      '          </el-table-column>',
      '          <el-table-column label="续借次数" width="90">',
      '            <template slot-scope="s">{{ s.row.renewCount || 0 }} / 1</template>',
      '          </el-table-column>',
      '          <el-table-column label="操作" width="150" fixed="right">',
      '            <template slot-scope="s">',
      '              <template v-if="canOperate(s.row)">',
      '                <el-button type="text" @click="returnBook(s.row)">归还</el-button>',
      '                <el-button type="text" :disabled="Number(s.row.renewCount || 0) >= 1" @click="renew(s.row)">续借</el-button>',
      '              </template>',
      '              <span v-else style="color:#c0c6d4;">—</span>',
      '            </template>',
      '          </el-table-column>',
      '        </el-table>',
      '        <div class="todo-note">业务规则：借期 30 天，每人最多同时借阅 3 本，同一本书未归还不可重复借阅，每本限续借 1 次；逾期记录标红提醒。</div>',
      '      </el-tab-pane>',
      '    </el-tabs>',
      '  </div>',
      '  <el-dialog title="新增图书" :visible.sync="dialogVisible" width="520px">',
      '    <el-form ref="bookForm" :model="form" :rules="rules" label-width="86px">',
      '      <el-form-item label="书名" prop="title">',
      '        <el-input v-model="form.title" placeholder="如：深入理解计算机系统"></el-input>',
      '      </el-form-item>',
      '      <el-form-item label="作者" prop="author">',
      '        <el-input v-model="form.author" placeholder="作者 / 编者"></el-input>',
      '      </el-form-item>',
      '      <el-form-item label="ISBN">',
      '        <el-input v-model="form.isbn" placeholder="13 位 ISBN"></el-input>',
      '      </el-form-item>',
      '      <el-form-item label="分类">',
      '        <el-select v-model="form.category" style="width:100%;">',
      '          <el-option label="教材" value="教材"></el-option><el-option label="科技" value="科技"></el-option>',
      '          <el-option label="文学" value="文学"></el-option><el-option label="历史" value="历史"></el-option>',
      '          <el-option label="艺术" value="艺术"></el-option><el-option label="其他" value="其他"></el-option>',
      '        </el-select>',
      '      </el-form-item>',
      '      <el-form-item label="出版社">',
      '        <el-input v-model="form.publisher" placeholder="出版社名称"></el-input>',
      '      </el-form-item>',
      '      <el-form-item label="馆藏册数" prop="total">',
      '        <el-input-number v-model="form.total" :min="1" :max="999"></el-input-number>',
      '        <span style="margin-left:8px;color:#98a1b4;font-size:12px;">入库后可借数量等于馆藏册数</span>',
      '      </el-form-item>',
      '      <el-form-item label="馆藏位置">',
      '        <el-input v-model="form.location" placeholder="如：A 区 3 排"></el-input>',
      '      </el-form-item>',
      '    </el-form>',
      '    <span slot="footer">',
      '      <el-button @click="dialogVisible = false">取消</el-button>',
      '      <el-button type="primary" :loading="submitting" @click="submitBook">确认入库</el-button>',
      '    </span>',
      '  </el-dialog>',
      '</div>'
    ].join('')
  };

  window.Pages = window.Pages || {};
  window.Pages.Library = LibraryPage;
})();
