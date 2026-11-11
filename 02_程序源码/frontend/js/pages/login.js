/**
 * 页面 1：登录与角色选择页 ｜ 主责 A
 * 必做：多角色登录、验证码、动态菜单与守卫
 * 选做：单点登录模拟、登录日志、密码找回
 */
(function () {
  var CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  var LoginPage = {
    name: 'LoginPage',
    data: function () {
      return {
        form: { role: 'student', username: 'student', password: '123456', captcha: '' },
        rules: {
          username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
          password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
          captcha: [{ validator: this.validateCaptcha, trigger: 'blur' }]
        },
        captchaCode: '',
        loading: false,
        roles: []
      };
    },
    created: function () {
      var self = this;
      this.roles = Object.keys(Auth.ROLES).map(function (key) {
        return { key: key, name: Auth.ROLES[key].name, desc: Auth.ROLES[key].desc };
      });
      if (this.$route.query.role && Auth.ROLES[this.$route.query.role]) {
        this.pickRole(this.$route.query.role);
      }
      this.refreshCaptcha();
      this.$nextTick(function () { self.form.captcha = ''; });
    },
    methods: {
      pickRole: function (role) {
        this.form.role = role;
        var account = (window.APP_CONFIG.DEMO_ACCOUNTS || []).filter(function (a) { return a.role === role; })[0];
        if (account) {
          this.form.username = account.username;
          this.form.password = account.password;
        }
      },
      refreshCaptcha: function () {
        var code = '';
        for (var i = 0; i < 4; i++) {
          code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
        }
        this.captchaCode = code;
        this.form.captcha = '';
      },
      validateCaptcha: function (rule, value, callback) {
        if (!value) return callback(new Error('请输入验证码'));
        if (String(value).toUpperCase() !== this.captchaCode) return callback(new Error('验证码不正确'));
        callback();
      },
      submit: function () {
        var self = this;
        this.$refs.form.validate(function (valid) {
          if (!valid) return;
          self.loading = true;
          self.$store.dispatch('login', self.form).then(function (user) {
            self.$message.success('欢迎回来，' + user.name);
            self.$store.dispatch('refreshUnread');
            var redirect = self.$route.query.redirect || Auth.homeOf(user);
            // 跳转前校验角色：学生从 /dashboard 的 redirect 进来时，不能直接跳到无权限页
            var resolved = self.$router.resolve(redirect);
            var roles = resolved.route.meta && resolved.route.meta.roles;
            if (roles && roles.length && roles.indexOf(user.role) === -1) {
              redirect = Auth.homeOf(user);
            }
            self.$router.replace(redirect).catch(function () {});
          }).catch(function (error) {
            self.$message.error(error.message);
            self.refreshCaptcha();
          }).then(function () {
            self.loading = false;
          });
        });
      }
    },
    template: [
      '<div class="login-page">',
      '  <div class="login-brand">',
      '    <div>',
      '      <div class="brand-badge"><i class="el-icon-school"></i> SMART CAMPUS</div>',
      '      <h1>智慧校园<br />综合管理平台</h1>',
      '      <p class="slogan">覆盖学籍、排课、选课、成绩、考务、学工、图书借阅与校园服务的统一管理平台。六种角色，一套权限体系，一份数据贯穿教务主线。</p>',
      '      <div class="feature-list">',
      '        <div class="feature-item"><strong>13</strong> 个核心页面</div>',
      '        <div class="feature-item"><strong>6</strong> 种角色权限</div>',
      '        <div class="feature-item"><strong>1.5</strong> 周迭代交付</div>',
      '      </div>',
      '    </div>',
      '    <div class="brand-foot">前端全栈课程综合实训 · 项目三 · Vue2 + Element UI + ECharts</div>',
      '  </div>',
      '  <div class="login-panel">',
      '    <h2>账号登录</h2>',
      '    <div class="sub">请选择角色并输入账号密码，不同角色看到的菜单不同</div>',
      '    <div class="role-grid">',
      '      <div v-for="role in roles" :key="role.key" class="role-card" :class="{ active: form.role === role.key }" @click="pickRole(role.key)">',
      '        <div class="role-name">{{ role.name }}</div>',
      '        <div class="role-desc">{{ role.desc }}</div>',
      '      </div>',
      '    </div>',
      '    <el-form ref="form" :model="form" :rules="rules" size="medium" @keyup.enter.native="submit">',
      '      <el-form-item prop="username">',
      '        <el-input v-model="form.username" prefix-icon="el-icon-user" placeholder="请输入账号"></el-input>',
      '      </el-form-item>',
      '      <el-form-item prop="password">',
      '        <el-input v-model="form.password" type="password" show-password prefix-icon="el-icon-lock" placeholder="请输入密码"></el-input>',
      '      </el-form-item>',
      '      <el-form-item prop="captcha">',
      '        <div class="captcha-row">',
      '          <el-input v-model="form.captcha" prefix-icon="el-icon-key" placeholder="请输入右侧验证码"></el-input>',
      '          <div class="captcha-box" title="点击刷新" @click="refreshCaptcha">{{ captchaCode }}</div>',
      '        </div>',
      '      </el-form-item>',
      '      <el-button type="primary" style="width:100%;" :loading="loading" @click="submit">登 录</el-button>',
      '    </el-form>',
      '    <div class="login-tips">',
      '      测试账号：<code>admin / academic / counselor / teacher / student / librarian</code>，密码统一 <code>123456</code><br />',
      '      未启动后端时会自动进入本地 Mock 模式，数据存在浏览器 localStorage。',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('')
  };

  window.Pages = window.Pages || {};
  window.Pages.Login = LoginPage;
})();
