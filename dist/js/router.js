/* ═══════════════════════════════════════
   Hash 路由
═══════════════════════════════════════ */
(function () {

  const views = {
    dashboard: window.dashboardView,
    compose:   window.composeView,
    inbox:     window.inboxView,
    sent:      window.sentView,
    trash:     window.trashView,
    tracking:  window.trackingView,
    contacts:  window.contactsView,
    settings:  window.settingsView
  };

  const pageTitles = {
    dashboard: '仪表盘',
    compose:   '写信',
    inbox:     '收件箱',
    sent:      '已发送',
    trash:     '回收站',
    tracking:  '实时追踪',
    contacts:  '地址簿',
    settings:  '设置'
  };

  const container = document.getElementById('viewContainer');

  function go(viewName) {
    const name = views[viewName] ? viewName : 'dashboard';
    window.location.hash = name;
  }

  function render(hash) {
    const name = (hash || '').replace('#', '') || 'dashboard';
    const viewName = views[name] ? name : 'dashboard';

    // 更新侧边栏高亮
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === viewName);
    });

    // 更新页面标题
    document.getElementById('pageTitle').textContent = pageTitles[viewName] || viewName;

    // 渲染视图
    const view = views[viewName];
    if (view) {
      container.innerHTML = view.render();
      view.init && view.init();
    }

    store.setState({ currentView: viewName });
  }

  window.addEventListener('hashchange', () => render(location.hash));
  render(location.hash);

  window.router = { go };

})();
