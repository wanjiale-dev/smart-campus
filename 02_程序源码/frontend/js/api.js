/**
 * 统一数据访问层
 * 页面只调用 api.xxx()，不直接写 axios，也不直接读 localStorage。
 *
 * 两种模式：
 * - remote：后端 node server/app.js 已启动，走真实 HTTP 接口
 * - local ：后端没启动（或双击 index.html 打开），自动落到浏览器内 mock
 * 切换方式：URL 加 ?api=local 或 ?api=remote 强制指定，默认自动探测 /api/health
 */
(function () {
  var cfg = window.APP_CONFIG;
  var http = axios.create({ baseURL: cfg.API_BASE, timeout: 8000 });
  var mode = 'local';

  http.interceptors.request.use(function (config) {
    var token = localStorage.getItem(cfg.STORAGE.TOKEN);
    if (token) config.headers.Authorization = 'Bearer ' + token;
    return config;
  });

  http.interceptors.response.use(function (res) {
    return res;
  }, function (error) {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(cfg.STORAGE.TOKEN);
      localStorage.removeItem(cfg.STORAGE.USER);
      if (location.hash.indexOf('/login') === -1) location.hash = '#/login';
    }
    return Promise.reject(error);
  });

  function detect() {
    var forced = '';
    try { forced = new URLSearchParams(location.search).get('api') || ''; } catch (e) {}
    if (forced === 'local' || forced === 'remote') {
      mode = forced;
      return Promise.resolve(mode);
    }
    return new Promise(function (resolve) {
      axios.get(cfg.API_BASE + '/health', { timeout: cfg.HEALTH_TIMEOUT })
        .then(function (res) {
          mode = res.data && res.data.code === 0 ? 'remote' : 'local';
          resolve(mode);
        })
        .catch(function () {
          mode = 'local';
          resolve(mode);
        });
    });
  }

  function request(method, path, data) {
    if (mode === 'local') {
      return new Promise(function (resolve, reject) {
        // 模拟 120ms 网络延迟，方便组员把 loading 态做出来
        setTimeout(function () {
          var result = window.LocalApi.handle(method, path, data);
          if (result.code === 0) resolve(result.data);
          else reject(new Error(result.message || '操作失败'));
        }, 120);
      });
    }
    var config = { method: method, url: path };
    if (method === 'GET') config.params = data || {};
    else config.data = data || {};
    return http.request(config).then(function (res) {
      var body = res.data;
      if (body && body.code === 0) return body.data;
      throw new Error((body && body.message) || '接口返回异常');
    }, function (error) {
      var body = error.response && error.response.data;
      throw new Error((body && body.message) || error.message || '网络请求失败');
    });
  }

  var api = {
    detect: detect,
    isRemote: function () { return mode === 'remote'; },
    mode: function () { return mode; },

    login: function (username, password, role) {
      return request('POST', '/auth/login', { username: username, password: password, role: role });
    },
    stats: function (userId) {
      return request('GET', '/dashboard/stats', { userId: userId });
    },

    list: function (resource, params) {
      return request('GET', '/' + resource, params || {});
    },
    detail: function (resource, id) {
      return request('GET', '/' + resource + '/' + id);
    },
    create: function (resource, payload) {
      return request('POST', '/' + resource, payload);
    },
    update: function (resource, id, payload) {
      return request('PUT', '/' + resource + '/' + id, payload);
    },
    remove: function (resource, id) {
      return request('DELETE', '/' + resource + '/' + id);
    },

    messages: function (params) {
      return request('GET', '/messages', params || {});
    },
    readMessage: function (id, userId) {
      return request('POST', '/messages/' + id + '/read', { userId: userId });
    },
    readAll: function (userId, role) {
      return request('POST', '/messages/read-all', { userId: userId, role: role });
    },
    publishMessage: function (payload) {
      return request('POST', '/messages/publish', payload);
    },
    withdrawMessage: function (id) {
      return request('POST', '/messages/' + id + '/withdraw');
    },
    messageStats: function (id) {
      return request('GET', '/messages/' + id + '/stats');
    },

    createBooking: function (payload) {
      return request('POST', '/bookings', payload);
    },
    approveBooking: function (id, payload) {
      return request('POST', '/bookings/' + id + '/approve', payload);
    },
    cancelBooking: function (id, payload) {
      return request('POST', '/bookings/' + id + '/cancel', payload);
    },

    approveLeave: function (id, payload) {
      return request('POST', '/leaves/' + id + '/approve', payload);
    },

    borrowBook: function (bookId, payload) {
      return request('POST', '/books/' + bookId + '/borrow', payload);
    },
    returnBook: function (borrowId) {
      return request('POST', '/borrows/' + borrowId + '/return');
    },
    renewBorrow: function (borrowId) {
      return request('POST', '/borrows/' + borrowId + '/renew');
    },

    resetMock: function () {
      if (mode === 'remote') return request('POST', '/admin/reset');
      return Promise.resolve(window.LocalApi.reset().data);
    }
  };

  window.api = api;
})();
