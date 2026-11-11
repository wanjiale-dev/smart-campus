/**
 * 主框架布局：侧边菜单 + 顶栏 + 内容区
 * 所有业务页面都是它的子路由，页面里不需要再写布局。
 */
(function () {
  var AppLayout = {
    name: 'AppLayout',
    data: function () {
      return { collapsed: false };
    },
    computed: {
      user: function () { return this.$store.state.user || {}; },
      roleName: function () { return this.$store.getters.roleName; },
      unread: function () { return this.$store.state.unread; },
      apiMode: function () { return this.$store.state.apiMode; },
      menuGroups: function () {
        var role = this.user.role;
        var order = ['总览', '教务管理', '学生事务', '校园服务', '消息'];
        var children = this.$router.options.routes.filter(function (r) { return r.path === '/'; })[0].children;
        var groups = {};
        children.forEach(function (route) {
          var meta = route.meta || {};
          if (meta.hidden || !meta.group) return;
          if (meta.roles && meta.roles.indexOf(role) === -1) return;
          if (!groups[meta.group]) groups[meta.group] = [];
          groups[meta.group].push({
            path: '/' + route.path,
            title: meta.title,
            icon: meta.icon
          });
        });
        return order.filter(function (name) { return groups[name]; }).map(function (name) {
          return { name: name, items: groups[name] };
        });
      },
      currentTitle: function () {
        return (this.$route.meta && this.$route.meta.title) || '';
      },
      currentGroup: function () {
        return (this.$route.meta && this.$route.meta.group) || '';
      }
    },
    created: function () {
      this.$store.dispatch('refreshUnread');
    },
    methods: {
      toggle: function () { this.collapsed = !this.collapsed; },
      goMessage: function () { this.$router.push('/message/center').catch(function () {}); },
      onCommand: function (command) {
        var self = this;
        if (command === 'logout') {
          this.$store.dispatch('logout').then(function () {
            self.$router.replace('/login');
          });
        } else if (command === 'switch') {
          this.$store.dispatch('logout').then(function () {
            self.$router.replace('/login');
          });
        } else if (command === 'reset') {
          this.$confirm('将清空本地新增/修改的记录，恢复到初始演示数据，是否继续？', '重置演示数据', { type: 'warning' })
            .then(function () {
              return api.resetMock();
            })
            .then(function () {
              self.$message.success('演示数据已重置');
              setTimeout(function () { location.reload(); }, 400);
            })
            .catch(function () {});
        }
      }
    },
    template: [
      '<div class="app-shell">',
      '  <aside class="app-aside" :class="{ collapsed: collapsed }">',
      '    <div class="aside-logo">',
      '      <span class="logo-dot">智</span>',
      '      <span v-show="!collapsed">智慧校园平台</span>',
      '    </div>',
      '    <div class="aside-menu-wrap">',
      '      <el-menu :default-active="$route.path" :collapse="collapsed" router',
      '               background-color="transparent" text-color="#c3cddf" active-text-color="#ffffff">',
      '        <template v-for="group in menuGroups">',
      '          <div class="aside-group-title" v-show="!collapsed" :key="\'g-\' + group.name">{{ group.name }}</div>',
      '          <el-menu-item v-for="item in group.items" :key="item.path" :index="item.path">',
      '            <i :class="item.icon"></i>',
      '            <span slot="title">{{ item.title }}</span>',
      '          </el-menu-item>',
      '        </template>',
      '      </el-menu>',
      '    </div>',
      '  </aside>',
      '  <div class="app-main-wrap">',
      '    <header class="app-header">',
      '      <i class="header-collapse" :class="collapsed ? \'el-icon-s-unfold\' : \'el-icon-s-fold\'" @click="toggle"></i>',
      '      <div class="header-crumb">',
      '        <span v-if="currentGroup">{{ currentGroup }} / </span>',
      '        <span class="current">{{ currentTitle }}</span>',
      '      </div>',
      '      <div class="header-right">',
      '        <el-tag class="header-mode" size="mini" :type="apiMode === \'remote\' ? \'success\' : \'info\'">',
      '          {{ apiMode === \'remote\' ? \'接口模式\' : \'本地 Mock\' }}',
      '        </el-tag>',
      '        <div class="header-bell" @click="goMessage">',
      '          <i class="el-icon-bell"></i>',
      '          <span class="dot" v-if="unread > 0">{{ unread > 99 ? \'99+\' : unread }}</span>',
      '        </div>',
      '        <el-dropdown trigger="click" @command="onCommand">',
      '          <span style="cursor:pointer;display:flex;align-items:center;gap:8px;">',
      '            <el-avatar :size="28" style="background:#3a63d6;">{{ (user.name || \'?\').slice(0, 1) }}</el-avatar>',
      '            <span style="font-size:13px;">{{ user.name }}</span>',
      '            <el-tag size="mini" type="info">{{ roleName }}</el-tag>',
      '            <i class="el-icon-arrow-down" style="color:#98a1b4;"></i>',
      '          </span>',
      '          <el-dropdown-menu slot="dropdown">',
      '            <el-dropdown-item command="switch">切换角色</el-dropdown-item>',
      '            <el-dropdown-item command="reset">重置演示数据</el-dropdown-item>',
      '            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>',
      '          </el-dropdown-menu>',
      '        </el-dropdown>',
      '      </div>',
      '    </header>',
      '    <main class="app-content">',
      '      <router-view />',
      '    </main>',
      '  </div>',
      '</div>'
    ].join('')
  };

  window.AppLayout = AppLayout;
})();
