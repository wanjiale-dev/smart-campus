/**
 * Mock 数据内核（前后端共用，UMD）
 * - 浏览器：<script src="js/mock/core.js"> 挂到 window.MockCore
 * - Node：require('../frontend/js/mock/core.js')
 *
 * 这里只放"业务规则 + 数据读写"，不碰 localStorage / HTTP，
 * 具体运行环境由 js/mock/local-api.js（浏览器）与 server/app.js（Node）分别适配。
 *
 * 新增一个实体（例如 scholarship 奖学金）需要三步：
 * 1. seed.js 里加数组；2. 下面的 RESOURCES 加一条关键字字段；3. 页面里 api.list('scholarship')。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MockCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var RESOURCES = {
    users: ['name', 'username', 'dept'],
    students: ['name', 'id', 'className', 'major', 'phone'],
    teachers: ['name', 'dept', 'title'],
    courses: ['name', 'code', 'dept'],
    offerings: ['courseName', 'teacherName', 'room', 'className'],
    selections: ['courseName', 'studentName'],
    grades: ['studentName', 'courseName', 'term'],
    exams: ['courseName', 'className', 'room', 'invigilator'],
    leaves: ['studentName', 'reason', 'type'],
    venues: ['name', 'building', 'type'],
    bookings: ['venueName', 'applicantName', 'purpose'],
    books: ['title', 'author', 'isbn', 'category'],
    borrows: ['bookTitle', 'userName'],
    messages: ['title', 'content', 'senderName'],
    receipts: []
  };

  var DEFAULT_KEYWORD_FIELDS = ['name', 'title', 'id'];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function nowText() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function nowTime() {
    var d = new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function createStore(seed) {
    var db = clone(seed);

    function ok(data, message) { return { code: 0, data: data, message: message || 'ok' }; }
    function fail(message, code) { return { code: code || 400, data: null, message: message }; }

    function nextId(prefix, rows) {
      var max = 0;
      rows.forEach(function (row) {
        var n = Number(String(row.id).replace(/\D/g, '')) || 0;
        if (n > max) max = n;
      });
      return prefix + ('000' + (max + 1)).slice(-4);
    }

    function filterRows(rows, query, keywordFields) {
      var skip = ['page', 'pageSize', 'keyword', 'role', 'userId'];
      return rows.filter(function (row) {
        if (query.keyword) {
          var kw = String(query.keyword).toLowerCase();
          var fields = keywordFields && keywordFields.length ? keywordFields : DEFAULT_KEYWORD_FIELDS;
          var hit = fields.some(function (f) {
            return String(row[f] === undefined ? '' : row[f]).toLowerCase().indexOf(kw) > -1;
          });
          if (!hit) return false;
        }
        for (var key in query) {
          if (skip.indexOf(key) > -1) continue;
          if (query[key] === '' || query[key] === undefined || query[key] === null) continue;
          if (String(row[key]) !== String(query[key])) return false;
        }
        return true;
      });
    }

    function paginate(rows, query) {
      var page = Number(query.page || 1);
      var size = Number(query.pageSize || 0);
      if (!size) return { list: rows, total: rows.length, page: 1, pageSize: rows.length };
      var start = (page - 1) * size;
      return { list: rows.slice(start, start + size), total: rows.length, page: page, pageSize: size };
    }

    /* ---------- 登录 ---------- */
    function login(payload) {
      payload = payload || {};
      var user = db.users.filter(function (u) { return u.username === payload.username; })[0];
      if (!user) return fail('账号不存在，请检查用户名', 401);
      if (user.password !== payload.password) return fail('密码错误，请重新输入', 401);
      if (payload.role && payload.role !== user.role) return fail('该账号不属于所选角色', 403);
      var data = clone(user);
      delete data.password;
      return ok({ token: 'mock-token-' + user.role + '-' + user.id, user: data }, '登录成功');
    }

    /* ---------- 数据总览 ---------- */
    function dashboardStats(query) {
      query = query || {};
      var totalEnrolled = db.offerings.reduce(function (sum, o) { return sum + Number(o.enrolled || 0); }, 0);
      var buckets = [
        { label: '90 分以上', value: 0 },
        { label: '80-89 分', value: 0 },
        { label: '70-79 分', value: 0 },
        { label: '60-69 分', value: 0 },
        { label: '60 分以下', value: 0 }
      ];
      db.grades.forEach(function (g) {
        var v = Number(g.total || 0);
        if (v >= 90) buckets[0].value++;
        else if (v >= 80) buckets[1].value++;
        else if (v >= 70) buckets[2].value++;
        else if (v >= 60) buckets[3].value++;
        else buckets[4].value++;
      });
      var hotCourses = db.offerings.map(function (o) {
        return { name: o.courseName, value: o.enrolled, capacity: o.capacity };
      }).sort(function (a, b) { return b.value - a.value; }).slice(0, 6);

      var userId = query.userId;
      var current = null;
      db.users.some(function (u) { if (u.id === userId) { current = u; return true; } return false; });
      var role = current ? current.role : '';
      // 未读口径必须和消息中心、顶栏角标一致：已撤回不算，只算发给自己角色的
      var unread = db.messages.filter(function (m) {
        if (m.status === 'withdrawn') return false;
        if (role && role !== 'admin' && m.targetRoles.indexOf(role) === -1 && m.targetRoles.indexOf('all') === -1) return false;
        return !db.receipts.some(function (r) { return r.messageId === m.id && r.userId === userId; });
      }).length;

      var alerts = [];
      db.bookings.filter(function (b) { return b.status === '待审批'; }).forEach(function (b) {
        alerts.push({ level: 'warning', text: b.applicantName + ' 提交的「' + b.venueName + '」预约待审批', time: b.createdAt, to: '/campus/venue' });
      });
      db.leaves.filter(function (l) { return l.status === '待审批'; }).forEach(function (l) {
        alerts.push({ level: 'info', text: l.studentName + ' 的' + l.type + '申请待审批', time: l.createdAt, to: '/student-affairs' });
      });
      db.offerings.forEach(function (o) {
        if (o.capacity && o.enrolled / o.capacity >= 0.9) {
          alerts.push({ level: 'danger', text: o.courseName + '（' + o.className + '）选课率已达 ' + Math.round(o.enrolled / o.capacity * 100) + '%', time: '实时', to: '/courses' });
        }
      });

      return ok({
        cards: {
          students: db.students.length,
          teachers: db.teachers.length,
          courses: db.courses.length,
          selections: totalEnrolled,
          pendingBookings: db.bookings.filter(function (b) { return b.status === '待审批'; }).length,
          unread: unread
        },
        gradeBuckets: buckets,
        hotCourses: hotCourses,
        alerts: alerts.slice(0, 6)
      });
    }

    /* ---------- 消息 ---------- */
    function listMessages(query) {
      query = query || {};
      var userId = query.userId;
      var role = query.role;

      var visible = db.messages.filter(function (m) {
        if (m.status === 'withdrawn') return false;
        if (!role) return true;
        // 管理员是消息的全局管理者，可以看到所有通知，便于统计与撤回
        if (role === 'admin') return true;
        return m.targetRoles.indexOf(role) > -1 || m.targetRoles.indexOf('all') > -1;
      }).map(function (m) {
        var item = clone(m);
        item.read = db.receipts.some(function (r) { return r.messageId === m.id && r.userId === userId; });
        return item;
      });

      visible.sort(function (a, b) { return a.publishAt < b.publishAt ? 1 : -1; });
      var unread = visible.filter(function (m) { return !m.read; }).length;

      var rows = visible;
      if (query.category && query.category !== '全部') {
        rows = rows.filter(function (m) { return m.category === query.category; });
      }
      if (query.keyword) {
        var kw = String(query.keyword).toLowerCase();
        rows = rows.filter(function (m) {
          return (m.title + m.content + m.senderName).toLowerCase().indexOf(kw) > -1;
        });
      }
      var paged = paginate(rows, query);
      paged.unread = unread;
      return ok(paged);
    }

    function readMessage(id, payload) {
      var userId = (payload && payload.userId) || '';
      if (!userId) return fail('缺少 userId');
      var exists = db.receipts.some(function (r) { return r.messageId === id && r.userId === userId; });
      if (!exists) {
        db.receipts.push({ id: nextId('R', db.receipts), messageId: id, userId: userId, readAt: nowText() });
      }
      return ok({ messageId: id, read: true }, '已读');
    }

    function readAll(payload) {
      var userId = (payload && payload.userId) || '';
      var role = (payload && payload.role) || '';
      var added = 0;
      db.messages.forEach(function (m) {
        if (m.status === 'withdrawn') return;
        if (role && role !== 'admin' && m.targetRoles.indexOf(role) === -1 && m.targetRoles.indexOf('all') === -1) return;
        var exists = db.receipts.some(function (r) { return r.messageId === m.id && r.userId === userId; });
        if (!exists) {
          db.receipts.push({ id: nextId('R', db.receipts), messageId: m.id, userId: userId, readAt: nowText() });
          added++;
        }
      });
      return ok({ added: added }, '已全部标记为已读');
    }

    function publishMessage(payload) {
      payload = payload || {};
      if (!payload.title) return fail('请填写消息标题');
      if (!payload.content) return fail('请填写消息正文');
      if (!payload.targetRoles || !payload.targetRoles.length) return fail('请选择接收对象');
      var row = {
        id: nextId('M', db.messages),
        category: payload.category || '系统',
        title: payload.title,
        content: payload.content,
        senderName: payload.senderName || '系统管理员',
        senderRole: payload.senderRole || 'admin',
        targetRoles: payload.targetRoles,
        publishAt: nowText(),
        attachments: payload.attachments || [],
        status: 'published',
        pinned: !!payload.pinned
      };
      db.messages.unshift(row);
      return ok(clone(row), '发布成功');
    }

    function withdrawMessage(id) {
      var msg = db.messages.filter(function (m) { return m.id === id; })[0];
      if (!msg) return fail('消息不存在', 404);
      msg.status = 'withdrawn';
      return ok(clone(msg), '已撤回');
    }

    function messageStats(id) {
      var msg = db.messages.filter(function (m) { return m.id === id; })[0];
      if (!msg) return fail('消息不存在', 404);
      var total = db.students.length + db.teachers.length;
      var read = db.receipts.filter(function (r) { return r.messageId === id; }).length;
      return ok({ messageId: id, total: total, read: read, unread: Math.max(total - read, 0) });
    }

    /* ---------- 场地预约 ---------- */
    function createBooking(payload) {
      payload = payload || {};
      var venue = db.venues.filter(function (v) { return v.id === payload.venueId; })[0];
      if (!venue) return fail('场地不存在');
      if (venue.status !== '可用') return fail('该场地正在维护，暂不可预约');
      if (!payload.date || !payload.startTime || !payload.endTime) return fail('请选择日期与时间段');
      if (payload.startTime >= payload.endTime) return fail('开始时间必须早于结束时间');
      if (payload.date < today()) return fail('不能预约过去的日期');
      if (payload.date === today() && payload.startTime < nowTime()) return fail('该时段已经过去，请重新选择');
      if (Number(payload.attendees) > Number(venue.capacity)) {
        return fail('预约人数超过场地容量（' + venue.capacity + ' 人）');
      }
      var conflict = db.bookings.filter(function (b) {
        return b.venueId === payload.venueId &&
          b.date === payload.date &&
          ['待审批', '已通过'].indexOf(b.status) > -1 &&
          b.startTime < payload.endTime &&
          payload.startTime < b.endTime;
      });
      if (conflict.length) {
        return fail('该时段刚被占用，请换一个时段', 409);
      }
      var row = {
        id: nextId('BK', db.bookings),
        venueId: venue.id,
        venueName: venue.name,
        applicantId: payload.applicantId || '',
        applicantName: payload.applicantName || '',
        applicantRole: payload.applicantRole || '',
        date: payload.date,
        startTime: payload.startTime,
        endTime: payload.endTime,
        purpose: payload.purpose || '',
        attendees: Number(payload.attendees || 0),
        contact: payload.contact || '',
        status: '待审批',
        approver: '',
        remark: '',
        createdAt: nowText()
      };
      db.bookings.unshift(row);
      return ok(clone(row), '预约申请已提交，等待审批');
    }

    function approveBooking(id, payload) {
      payload = payload || {};
      var booking = db.bookings.filter(function (b) { return b.id === id; })[0];
      if (!booking) return fail('预约单不存在', 404);
      if (booking.status !== '待审批') return fail('该预约单已处理，请勿重复操作');
      if (payload.status !== '已通过' && payload.status !== '已驳回') return fail('审批结果不合法');
      if (payload.status === '已驳回' && !payload.remark) return fail('驳回时必须填写原因');
      booking.status = payload.status;
      booking.approver = payload.approverName || '管理员';
      booking.remark = payload.remark || '';

      db.messages.unshift({
        id: nextId('M', db.messages),
        category: '审批',
        title: '场地预约审批结果：' + booking.venueName,
        content: '你提交的 ' + booking.venueName + ' 预约（' + booking.date + ' ' + booking.startTime + '-' + booking.endTime +
          '）审批结果：' + payload.status + '。' + (payload.remark ? '审批意见：' + payload.remark : ''),
        senderName: booking.approver,
        senderRole: 'admin',
        targetRoles: [booking.applicantRole || 'all'],
        publishAt: nowText(),
        attachments: [],
        status: 'published',
        pinned: false
      });
      return ok(clone(booking), '审批完成');
    }

    function cancelBooking(id, payload) {
      var booking = db.bookings.filter(function (b) { return b.id === id; })[0];
      if (!booking) return fail('预约单不存在', 404);
      if (booking.applicantId !== (payload && payload.applicantId) && (payload && payload.role) !== 'admin') {
        return fail('只能取消自己的预约', 403);
      }
      if (booking.status !== '待审批' && booking.status !== '已通过') return fail('当前状态不可取消');
      booking.status = '已取消';
      return ok(clone(booking), '已取消预约');
    }

    /* ---------- 请假审批 ---------- */
    function approveLeave(id, payload) {
      payload = payload || {};
      var leave = db.leaves.filter(function (l) { return l.id === id; })[0];
      if (!leave) return fail('请假单不存在', 404);
      if (leave.status !== '待审批') return fail('该申请已处理');
      if (['已通过', '已驳回'].indexOf(payload.status) === -1) return fail('审批结果不合法');
      leave.status = payload.status;
      leave.approver = payload.approverName || '辅导员';
      return ok(clone(leave), '审批完成');
    }

    /* ---------- 图书借阅 ---------- */
    var MAX_BORROW = 3;      // 单个读者同时借阅上限
    var BORROW_DAYS = 30;    // 借期（天）
    var MAX_RENEW = 1;       // 最多续借次数

    function dateAdd(base, days) {
      var d = base ? new Date(String(base).replace(/-/g, '/')) : new Date();
      d.setDate(d.getDate() + Number(days || 0));
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    function borrowBook(payload) {
      payload = payload || {};
      var book = db.books.filter(function (b) { return b.id === payload.bookId; })[0];
      if (!book) return fail('图书不存在', 404);
      if (!payload.userId) return fail('缺少借阅人信息');
      if (Number(book.available) <= 0) return fail('该书已全部借出，请稍后再试');
      var borrowing = db.borrows.filter(function (r) {
        return r.userId === payload.userId && r.status === '借阅中';
      });
      if (borrowing.length >= MAX_BORROW) {
        return fail('每位读者最多同时借阅 ' + MAX_BORROW + ' 本，请先归还');
      }
      var duplicated = borrowing.filter(function (r) { return r.bookId === book.id; })[0];
      if (duplicated) return fail('你已借阅《' + book.title + '》，尚未归还');

      var row = {
        id: nextId('BR', db.borrows),
        bookId: book.id,
        bookTitle: book.title,
        userId: payload.userId,
        userName: payload.userName || '',
        userRole: payload.userRole || '',
        borrowDate: today(),
        dueDate: dateAdd(today(), BORROW_DAYS),
        returnDate: '',
        status: '借阅中',
        renewCount: 0
      };
      db.borrows.unshift(row);
      book.available = Number(book.available) - 1;
      return ok(clone(row), '借阅成功，请于 ' + row.dueDate + ' 前归还');
    }

    function returnBook(id) {
      var borrow = db.borrows.filter(function (r) { return r.id === id; })[0];
      if (!borrow) return fail('借阅记录不存在', 404);
      if (borrow.status !== '借阅中') return fail('该记录已归还，请勿重复操作');
      borrow.status = '已归还';
      borrow.returnDate = today();
      var book = db.books.filter(function (b) { return b.id === borrow.bookId; })[0];
      if (book) book.available = Math.min(Number(book.available) + 1, Number(book.total));
      return ok(clone(borrow), '归还成功');
    }

    function renewBorrow(id) {
      var borrow = db.borrows.filter(function (r) { return r.id === id; })[0];
      if (!borrow) return fail('借阅记录不存在', 404);
      if (borrow.status !== '借阅中') return fail('只有借阅中的记录可以续借');
      if (Number(borrow.renewCount || 0) >= MAX_RENEW) {
        return fail('每本图书最多续借 ' + MAX_RENEW + ' 次');
      }
      var base = borrow.dueDate && borrow.dueDate > today() ? borrow.dueDate : today();
      borrow.dueDate = dateAdd(base, BORROW_DAYS);
      borrow.renewCount = Number(borrow.renewCount || 0) + 1;
      return ok(clone(borrow), '续借成功，应还日期延至 ' + borrow.dueDate);
    }

    /* ---------- 通用 CRUD ---------- */
    function listResource(resource, query) {
      var rows = db[resource];
      if (!rows) return fail('未知资源：' + resource, 404);
      var filtered = filterRows(rows, query || {}, RESOURCES[resource]);
      filtered = filtered.slice().reverse();
      return ok(paginate(filtered, query || {}));
    }

    function createResource(resource, payload) {
      var rows = db[resource];
      if (!rows) return fail('未知资源：' + resource, 404);
      var row = clone(payload || {});
      row.id = row.id || nextId(resource.slice(0, 2).toUpperCase(), rows);
      rows.push(row);
      return ok(clone(row), '新增成功');
    }

    function updateResource(resource, id, payload) {
      var rows = db[resource];
      if (!rows) return fail('未知资源：' + resource, 404);
      var row = rows.filter(function (r) { return String(r.id) === String(id); })[0];
      if (!row) return fail('记录不存在：' + id, 404);
      Object.keys(payload || {}).forEach(function (key) {
        if (key !== 'id') row[key] = payload[key];
      });
      return ok(clone(row), '保存成功');
    }

    function removeResource(resource, id) {
      var rows = db[resource];
      if (!rows) return fail('未知资源：' + resource, 404);
      var index = -1;
      rows.forEach(function (r, i) { if (String(r.id) === String(id)) index = i; });
      if (index < 0) return fail('记录不存在：' + id, 404);
      rows.splice(index, 1);
      return ok({ id: id }, '删除成功');
    }

    /* ---------- 路由分发 ---------- */
    function handle(method, path, payload) {
      var parts = String(path || '').split('?')[0].split('/').filter(Boolean);
      method = String(method || 'GET').toUpperCase();
      var query = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};

      if (method === 'GET' && (path === '/health' || parts[0] === 'health')) {
        return ok({ status: 'up', time: nowText() });
      }
      if (method === 'POST' && parts[0] === 'auth' && parts[1] === 'login') return login(payload);
      if (method === 'GET' && parts[0] === 'dashboard') return dashboardStats(query);

      if (parts[0] === 'messages') {
        if (method === 'GET') return listMessages(query);
        if (method === 'POST' && parts[1] === 'read-all') return readAll(payload);
        if (method === 'POST' && parts[1] && parts[2] === 'read') return readMessage(parts[1], payload);
        if (method === 'POST' && parts[1] === 'publish') return publishMessage(payload);
        if (method === 'POST' && parts[1] && parts[2] === 'withdraw') return withdrawMessage(parts[1]);
        if (method === 'GET' && parts[1] && parts[2] === 'stats') return messageStats(parts[1]);
      }

      if (parts[0] === 'bookings') {
        if (method === 'POST' && !parts[1]) return createBooking(payload);
        if (method === 'POST' && parts[1] && parts[2] === 'approve') return approveBooking(parts[1], payload);
        if (method === 'POST' && parts[1] && parts[2] === 'cancel') return cancelBooking(parts[1], payload);
      }

      if (parts[0] === 'leaves' && method === 'POST' && parts[1] && parts[2] === 'approve') {
        return approveLeave(parts[1], payload);
      }

      if (parts[0] === 'books' && method === 'POST' && parts[1] && parts[2] === 'borrow') {
        return borrowBook(payload);
      }
      if (parts[0] === 'borrows' && method === 'POST' && parts[1] && parts[2] === 'return') {
        return returnBook(parts[1]);
      }
      if (parts[0] === 'borrows' && method === 'POST' && parts[1] && parts[2] === 'renew') {
        return renewBorrow(parts[1]);
      }

      if (parts[0] === 'admin' && parts[1] === 'reset') {
        db = clone(seed);
        return ok({ reset: true }, '演示数据已重置');
      }

      var resource = parts[0];
      if (!resource) return fail('接口不存在', 404);
      if (method === 'GET' && !parts[1]) return listResource(resource, query);
      if (method === 'GET' && parts[1]) {
        var found = (db[resource] || []).filter(function (r) { return String(r.id) === String(parts[1]); })[0];
        return found ? ok(clone(found)) : fail('记录不存在', 404);
      }
      if (method === 'POST' && !parts[1]) return createResource(resource, payload);
      if ((method === 'PUT' || method === 'PATCH') && parts[1]) return updateResource(resource, parts[1], payload);
      if (method === 'DELETE' && parts[1]) return removeResource(resource, parts[1]);

      return fail('接口不存在：' + method + ' ' + path, 404);
    }

    return {
      handle: handle,
      getState: function () { return clone(db); },
      reset: function () { db = clone(seed); return ok({ reset: true }); }
    };
  }

  return { createStore: createStore, RESOURCES: RESOURCES };
});
