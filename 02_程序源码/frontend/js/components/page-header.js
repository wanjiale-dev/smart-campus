/**
 * 公共页面头部组件：统一展示「页面归属 + 必做/选做清单」
 * 这样每个组员打开自己的页面就知道要做什么，答辩时也能直接对照 PDF 要求。
 *
 * 用法：
 * <page-header title="学生信息管理页" owner="B 组员"
 *              desc="..." :must="['学生列表', '增删改查']" :optional="['批量导入']">
 *   <el-button type="primary">新增</el-button>
 * </page-header>
 */
(function () {
  Vue.component('page-header', {
    props: {
      title: { type: String, required: true },
      desc: { type: String, default: '' },
      owner: { type: String, default: '' },
      must: { type: Array, default: function () { return []; } },
      optional: { type: Array, default: function () { return []; } }
    },
    template: [
      '<div class="page-header">',
      '  <div class="ph-main">',
      '    <h2>',
      '      {{ title }}',
      '      <el-tag v-if="owner" size="mini" type="info">主责 {{ owner }}</el-tag>',
      '    </h2>',
      '    <p v-if="desc" class="ph-desc">{{ desc }}</p>',
      '    <div v-if="must.length" class="ph-tags">',
      '      <span class="ph-label">必做</span>',
      '      <el-tag v-for="item in must" :key="item" size="mini" class="mr6">{{ item }}</el-tag>',
      '    </div>',
      '    <div v-if="optional.length" class="ph-tags">',
      '      <span class="ph-label">选做</span>',
      '      <el-tag v-for="item in optional" :key="item" size="mini" type="warning" class="mr6">{{ item }}</el-tag>',
      '    </div>',
      '  </div>',
      '  <div class="ph-extra"><slot></slot></div>',
      '</div>'
    ].join('')
  });
})();
