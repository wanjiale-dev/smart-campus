/**
 * 浏览器端本地数据适配器
 * 作用：没有启动后端时，页面照样可以跑起来（双击 index.html 也能看到完整数据）。
 * 数据落在 localStorage，刷新不丢；点顶栏「重置演示数据」恢复 seed。
 */
(function () {
  var KEY = window.APP_CONFIG.STORAGE.MOCK_DB;
  var seed = window.MOCK_SEED;
  var saved = null;
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) saved = JSON.parse(raw);
  } catch (e) {
    saved = null;
  }
  // 旧版本缓存可能缺少后来新增的集合（如 books / borrows），用 seed 补齐，避免页面报「未知资源」
  if (saved) {
    Object.keys(seed).forEach(function (key) {
      if (!saved[key]) saved[key] = JSON.parse(JSON.stringify(seed[key]));
    });
  }

  var store = window.MockCore.createStore(saved || seed);

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(store.getState()));
    } catch (e) {
      /* 隐私模式下 localStorage 可能不可用，忽略即可，数据仍在内存里 */
    }
  }

  window.LocalApi = {
    handle: function (method, path, payload) {
      var result = store.handle(method, path, payload);
      if (String(method).toUpperCase() !== 'GET') persist();
      return result;
    },
    reset: function () {
      store = window.MockCore.createStore(seed);
      try { localStorage.removeItem(KEY); } catch (e) {}
      return { code: 0, data: { reset: true }, message: '演示数据已重置' };
    }
  };
})();
