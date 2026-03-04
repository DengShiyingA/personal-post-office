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
    contacts:  window.contactsView,
    settings:  window.settingsView
  };

  const pageTitles = {
    dashboard: '仪表盘',
    compose:   '写信',
    inbox:     '收件箱',
    sent:      '已发送',
    trash:     '回收站',
    contacts:  '地址簿',
    settings:  '设置'
  };

  const container = document.getElementById('viewContainer');
  let _currentView = null;

  function go(viewName) {
    const name = views[viewName] ? viewName : 'dashboard';
    window.location.hash = name;
  }

  function render(hash) {
    const name = (hash || '').replace('#', '') || 'dashboard';
    const viewName = views[name] ? name : 'dashboard';

    if (viewName === _currentView) return;
    _currentView = viewName;

    // 更新侧边栏高亮
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === viewName);
    });

    // 标题淡入
    const titleEl = document.getElementById('pageTitle');
    titleEl.style.cssText = 'opacity:0;transform:translateY(-4px);transition:none';
    setTimeout(() => {
      titleEl.textContent = pageTitles[viewName] || viewName;
      titleEl.style.cssText = 'opacity:1;transform:translateY(0);transition:opacity .2s ease,transform .2s ease';
    }, 60);

    // 内容淡出 → 渲染 → 淡入
    container.style.cssText = 'opacity:0;transform:translateY(8px);transition:opacity .1s ease,transform .1s ease';

    setTimeout(() => {
      const view = views[viewName];
      if (view) {
        container.innerHTML = view.render();
        view.init && view.init();
      }
      store.setState({ currentView: viewName });
      // rAF 确保 DOM 已渲染再触发淡入
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          container.style.cssText = 'opacity:1;transform:translateY(0);transition:opacity .2s ease,transform .2s ease';
        });
      });
    }, 110);
  }

  window.addEventListener('hashchange', () => {
    _currentView = null;
    render(location.hash);
  });
  render(location.hash);

  window.router = { go };

})();
