/**
 * Vuex：登录态、当前用户、未读消息数、接口模式
 * 页面要读用户信息统一用 this.$store.state.user，不要在组件里再读 localStorage。
 */
(function () {
  var state = {
    token: Auth.getToken(),
    user: Auth.getUser(),
    unread: 0,
    apiMode: 'local'
  };

  var store = new Vuex.Store({
    state: state,
    getters: {
      role: function (s) { return s.user ? s.user.role : ''; },
      isLogin: function (s) { return !!s.token; },
      displayName: function (s) { return s.user ? s.user.name : ''; },
      roleName: function (s) { return s.user ? Auth.roleName(s.user.role) : ''; }
    },
    mutations: {
      SET_AUTH: function (s, payload) {
        s.token = payload.token;
        s.user = payload.user;
      },
      CLEAR_AUTH: function (s) {
        s.token = '';
        s.user = null;
        s.unread = 0;
      },
      SET_UNREAD: function (s, value) {
        s.unread = value || 0;
      },
      SET_API_MODE: function (s, value) {
        s.apiMode = value;
      }
    },
    actions: {
      login: function (context, form) {
        return api.login(form.username, form.password, form.role).then(function (res) {
          Auth.setSession(res.token, res.user);
          context.commit('SET_AUTH', res);
          return res.user;
        });
      },
      logout: function (context) {
        Auth.clearSession();
        context.commit('CLEAR_AUTH');
      },
      refreshUnread: function (context) {
        var user = context.state.user;
        if (!user) return Promise.resolve(0);
        return api.messages({ userId: user.id, role: user.role, pageSize: 0 })
          .then(function (res) {
            context.commit('SET_UNREAD', res.unread || 0);
            return res.unread || 0;
          })
          .catch(function () { return 0; });
      }
    }
  });

  window.store = store;
})();
