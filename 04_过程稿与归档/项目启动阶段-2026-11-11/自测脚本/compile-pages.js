// 临时校验脚本：用 Vue 完整版编译每个页面模板，捕获模板语法错误
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..', '..', '02_程序源码', 'frontend');
const errors = [];

const sandbox = {
  console: {
    log: () => {},
    info: () => {},
    warn: (...args) => errors.push('WARN ' + args.join(' ')),
    error: (...args) => errors.push('ERROR ' + args.join(' '))
  },
  setTimeout, clearTimeout, Date, JSON, Math, Object, Array, String, Number, Boolean, RegExp, Promise, Set
};
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.globalThis = sandbox;
sandbox.navigator = { userAgent: 'node' };
sandbox.document = {
  createElement: () => ({ style: {}, setAttribute() {} }),
  addEventListener() {},
  querySelector: () => null
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'vendor', 'vue.min.js'), 'utf8'), sandbox, { filename: 'vue.min.js' });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'components', 'page-header.js'), 'utf8'), sandbox, { filename: 'page-header.js' });

const pageDir = path.join(ROOT, 'js', 'pages');
const files = fs.readdirSync(pageDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  sandbox.window.Pages = {};
  try {
    vm.runInContext(fs.readFileSync(path.join(pageDir, file), 'utf8'), sandbox, { filename: file });
  } catch (e) {
    errors.push(`LOAD ${file}: ${e.message}`);
    return;
  }
  const keys = Object.keys(sandbox.window.Pages);
  if (!keys.length) {
    errors.push(`REGISTER ${file}: 没有注册 window.Pages`);
    return;
  }
  keys.forEach(key => {
    const comp = sandbox.window.Pages[key];
    const before = errors.length;
    try {
      sandbox.Vue.compile(comp.template);
    } catch (e) {
      errors.push(`COMPILE ${key}: ${e.message}`);
    }
    if (errors.length > before) {
      console.log(`FAIL ${file} -> ${key}`);
      errors.slice(before).forEach(e => console.log('   ' + e));
    } else {
      console.log(`OK   ${file} -> ${key}`);
    }
  });
  // 模板里常见的笔误：{{ }} 内出现中文引号、未闭合标签
  keys.forEach(key => {
    const tpl = sandbox.window.Pages[key].template || '';
    const braces = (tpl.match(/\{\{/g) || []).length - (tpl.match(/\}\}/g) || []).length;
    if (braces !== 0) console.log(`SUSPECT ${key}: 插值花括号不配对`);
  });
});

console.log('\n=== 汇总 ===');
console.log(errors.length ? errors.join('\n') : '模板编译全部通过，无告警');
