/**
 * 应用入口：注册全局能力 → 探测接口模式 → 挂载
 */
(function () {
  Vue.use(ELEMENT, { size: 'small' });
  Vue.config.productionTip = false;

  // 按钮级权限指令：<el-button v-perm="'student:add'">新增</el-button>
  Vue.directive('perm', {
    inserted: function (el, binding) {
      if (!Auth.can(binding.value)) {
        el.parentNode && el.parentNode.removeChild(el);
      }
    }
  });

  // 模板里用 this.$can('student:add') 判断
  Vue.prototype.$can = function (code) {
    return Auth.can(code, this.$store ? this.$store.state.user : null);
  };
  Vue.prototype.$roleName = Auth.roleName;

  api.detect().then(function (mode) {
    store.commit('SET_API_MODE', mode);
    if (mode === 'local' && location.protocol === 'file:') {
      console.info('[智慧校园] 本地 Mock 模式：未启动后端，数据来自 js/mock/seed.js');
    }
    new Vue({
      router: router,
      store: store,
      template: '<router-view />'
    }).$mount('#app');
  });
})();
