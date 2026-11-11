/**
 * 页面 3：学生信息管理页 ｜ 主责 B
 * 必做：学生列表、增删改查、照片上传、分页筛选
 * 选做：批量导入导出、学籍状态流转、高级检索
 */
(function () {
  var CLASS_OPTIONS = ['计算机 2401', '计算机 2402', '软件 2401', '软件 2402'];

  function emptyForm() {
    return { id: '', name: '', gender: '男', grade: '2024', className: '计算机 2401', major: '计算机科学与技术', phone: '', email: '', status: '在读', photo: '' };
  }

  var StudentsPage = {
    name: 'StudentsPage',
    data: function () {
      return {
        loading: false,
        rows: [],
        total: 0,
        query: { keyword: '', className: '', status: '', page: 1, pageSize: 8 },
        classOptions: CLASS_OPTIONS,
        dialogVisible: false,
        editing: false,
        form: emptyForm(),
        rules: {
          id: [{ required: true, message: '请输入学号', trigger: 'blur' }, { pattern: /^S\d{7}$/, message: '格式如 S2024001', trigger: 'blur' }],
          name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
          className: [{ required: true, message: '请选择班级', trigger: 'change' }],
          phone: [{ pattern: /^1\d{10}$/, message: '请输入 11 位手机号', trigger: 'blur' }],
          email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
        }
      };
    },
    created: function () {
      this.load();
    },
    methods: {
      load: function () {
        var self = this;
        this.loading = true;
        api.list('students', this.query).then(function (res) {
          self.rows = res.list;
          self.total = res.total;
        }).catch(function (error) {
          self.$message.error(error.message);
        }).then(function () {
          self.loading = false;
        });
      },
      search: function () {
        this.query.page = 1;
        this.load();
      },
      reset: function () {
        this.query = { keyword: '', className: '', status: '', page: 1, pageSize: 8 };
        this.load();
      },
      openCreate: function () {
        this.editing = false;
        this.form = emptyForm();
        this.dialogVisible = true;
      },
      openEdit: function (row) {
        this.editing = true;
        this.form = Object.assign({}, emptyForm(), row);
        this.dialogVisible = true;
      },
      save: function () {
        var self = this;
        this.$refs.form.validate(function (valid) {
          if (!valid) return;
          var payload = Object.assign({}, self.form);
          var request = self.editing ? api.update('students', payload.id, payload) : api.create('students', payload);
          request.then(function () {
            self.$message.success(self.editing ? '保存成功' : '新增成功');
            self.dialogVisible = false;
            self.load();
          }).catch(function (error) {
            self.$message.error(error.message);
          });
        });
      },
      remove: function (row) {
        var self = this;
        this.$confirm('确定删除学生「' + row.name + '」吗？', '删除确认', { type: 'warning' })
          .then(function () {
            return api.remove('students', row.id);
          })
          .then(function () {
            self.$message.success('已删除');
            self.load();
          })
          .catch(function () {});
      },
      onPhotoChange: function (file) {
        var isImage = /^image\//.test(file.raw.type);
        var isLt2M = file.raw.size / 1024 / 1024 < 2;
        if (!isImage) return this.$message.error('照片只能是 JPG / PNG 等图片格式');
        if (!isLt2M) return this.$message.error('照片大小不能超过 2MB');
        this.form.photo = URL.createObjectURL(file.raw);
        this.$message.success('照片已选择（演示环境不真正上传服务器）');
      },
      exportCsv: function () {
        var header = '学号,姓名,性别,班级,专业,手机,状态\n';
        var body = this.rows.map(function (r) {
          return [r.id, r.name, r.gender, r.className, r.major, r.phone, r.status].join(',');
        }).join('\n');
        var blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = '学生名单.csv';
        link.click();
      }
    },
    template: [
      '<div class="page">',
      '  <page-header title="学生信息管理页" owner="B 组员"',
      '    desc="维护全校学生基础档案，是学籍、选课、成绩、请假等模块的数据源头。"',
      '    :must="[\'学生列表\', \'增删改查\', \'照片上传\', \'分页筛选\']"',
      '    :optional="[\'批量导入导出\', \'学籍状态流转\', \'高级检索\']">',
      '    <el-button v-perm="\'student:export\'" icon="el-icon-download" @click="exportCsv">导出当前页</el-button>',
      '    <el-button v-perm="\'student:add\'" type="primary" icon="el-icon-plus" @click="openCreate">新增学生</el-button>',
      '  </page-header>',
      '  <div class="panel">',
      '    <div class="toolbar">',
      '      <el-input v-model="query.keyword" placeholder="学号 / 姓名 / 手机号" clearable style="width:230px;" @keyup.enter.native="search"></el-input>',
      '      <el-select v-model="query.className" placeholder="全部班级" clearable style="width:150px;">',
      '        <el-option v-for="c in classOptions" :key="c" :label="c" :value="c"></el-option>',
      '      </el-select>',
      '      <el-select v-model="query.status" placeholder="全部状态" clearable style="width:130px;">',
      '        <el-option label="在读" value="在读"></el-option>',
      '        <el-option label="休学" value="休学"></el-option>',
      '        <el-option label="毕业" value="毕业"></el-option>',
      '      </el-select>',
      '      <el-button type="primary" icon="el-icon-search" @click="search">查询</el-button>',
      '      <el-button @click="reset">重置</el-button>',
      '    </div>',
      '    <el-table :data="rows" v-loading="loading" size="medium" border stripe>',
      '      <el-table-column prop="id" label="学号" width="120"></el-table-column>',
      '      <el-table-column label="姓名" width="150">',
      '        <template slot-scope="s">',
      '          <div style="display:flex;align-items:center;gap:8px;">',
      '            <el-avatar :size="26" :src="s.row.photo" style="background:#dbe6ff;color:#3a63d6;">{{ s.row.name.slice(0,1) }}</el-avatar>',
      '            <span>{{ s.row.name }}</span>',
      '          </div>',
      '        </template>',
      '      </el-table-column>',
      '      <el-table-column prop="gender" label="性别" width="70"></el-table-column>',
      '      <el-table-column prop="className" label="班级" width="120"></el-table-column>',
      '      <el-table-column prop="major" label="专业" min-width="170"></el-table-column>',
      '      <el-table-column prop="phone" label="手机号" width="130"></el-table-column>',
      '      <el-table-column label="状态" width="90">',
      '        <template slot-scope="s"><el-tag size="mini" :type="s.row.status === \'在读\' ? \'success\' : \'info\'">{{ s.row.status }}</el-tag></template>',
      '      </el-table-column>',
      '      <el-table-column label="操作" width="150" fixed="right">',
      '        <template slot-scope="s">',
      '          <el-button v-perm="\'student:edit\'" type="text" @click="openEdit(s.row)">编辑</el-button>',
      '          <el-button v-perm="\'student:remove\'" type="text" style="color:#f56c6c;" @click="remove(s.row)">删除</el-button>',
      '        </template>',
      '      </el-table-column>',
      '    </el-table>',
      '    <el-pagination style="margin-top:14px;text-align:right;" background layout="total, sizes, prev, pager, next"',
      '      :total="total" :current-page.sync="query.page" :page-size.sync="query.pageSize"',
      '      :page-sizes="[8, 10, 20]" @current-change="load" @size-change="search"></el-pagination>',
      '    <div class="todo-note"><b>本页待完成：</b>批量导入（Excel 解析）、学籍状态流转记录、高级检索条件组合。修改文件：<span class="mono">js/pages/students.js</span></div>',
      '  </div>',
      '  <el-dialog :title="editing ? \'编辑学生\' : \'新增学生\'" :visible.sync="dialogVisible" width="560px">',
      '    <el-form ref="form" :model="form" :rules="rules" label-width="80px">',
      '      <el-row :gutter="12">',
      '        <el-col :span="12"><el-form-item label="学号" prop="id"><el-input v-model="form.id" :disabled="editing" placeholder="S2024011"></el-input></el-form-item></el-col>',
      '        <el-col :span="12"><el-form-item label="姓名" prop="name"><el-input v-model="form.name"></el-input></el-form-item></el-col>',
      '        <el-col :span="12"><el-form-item label="性别"><el-radio-group v-model="form.gender"><el-radio label="男">男</el-radio><el-radio label="女">女</el-radio></el-radio-group></el-form-item></el-col>',
      '        <el-col :span="12"><el-form-item label="班级" prop="className"><el-select v-model="form.className" style="width:100%;"><el-option v-for="c in classOptions" :key="c" :label="c" :value="c"></el-option></el-select></el-form-item></el-col>',
      '        <el-col :span="12"><el-form-item label="专业"><el-input v-model="form.major"></el-input></el-form-item></el-col>',
      '        <el-col :span="12"><el-form-item label="状态"><el-select v-model="form.status" style="width:100%;"><el-option label="在读" value="在读"></el-option><el-option label="休学" value="休学"></el-option><el-option label="毕业" value="毕业"></el-option></el-select></el-form-item></el-col>',
      '        <el-col :span="12"><el-form-item label="手机号" prop="phone"><el-input v-model="form.phone"></el-input></el-form-item></el-col>',
      '        <el-col :span="12"><el-form-item label="邮箱" prop="email"><el-input v-model="form.email"></el-input></el-form-item></el-col>',
      '      </el-row>',
      '      <el-form-item label="学生照片">',
      '        <div style="display:flex;align-items:center;gap:12px;">',
      '          <el-avatar :size="52" :src="form.photo" style="background:#dbe6ff;color:#3a63d6;">{{ form.name ? form.name.slice(0,1) : \'?\' }}</el-avatar>',
      '          <el-upload action="#" :auto-upload="false" :show-file-list="false" :on-change="onPhotoChange" accept="image/*">',
      '            <el-button size="small" icon="el-icon-upload2">选择照片</el-button>',
      '          </el-upload>',
      '          <span style="color:#98a1b4;font-size:12px;">JPG/PNG，≤ 2MB</span>',
      '        </div>',
      '      </el-form-item>',
      '    </el-form>',
      '    <span slot="footer">',
      '      <el-button @click="dialogVisible = false">取消</el-button>',
      '      <el-button type="primary" @click="save">保存</el-button>',
      '    </span>',
      '  </el-dialog>',
      '</div>'
    ].join('')
  };

  window.Pages = window.Pages || {};
  window.Pages.Students = StudentsPage;
})();
