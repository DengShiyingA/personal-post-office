/* ═══════════════════════════════════════
   全局状态管理
═══════════════════════════════════════ */
(function () {
  const _state = {
    currentView: 'dashboard',
    user: null,
    unreadCount: 0
  };
  const _listeners = [];

  window.store = {
    getState() { return { ..._state }; },
    setState(patch) {
      Object.assign(_state, patch);
      _listeners.forEach(fn => fn({ ..._state }));
    },
    subscribe(fn) { _listeners.push(fn); }
  };

  /* 工具：显示 Toast */
  window.showToast = function (msg, duration = 2500) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
  };

  /* 初始化用户信息 */
  const user = api.getCurrentUser();
  if (!user || !user.loggedIn) {
    window.location.href = 'index.html';
    return;
  }
  _state.user = user;

  // 更新侧边栏用户信息
  document.getElementById('userAvatar').textContent = user.avatar || user.name.charAt(0);
  document.getElementById('userName').textContent = user.name;
  document.getElementById('userEmail').textContent = user.email;

  // 更新未读数
  api.getUnreadCount().then(count => {
    _state.unreadCount = count;
    const badge = document.getElementById('inboxBadge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? '' : 'none';
    }
  });

  // 退出登录
  document.getElementById('userInfoBtn').addEventListener('click', () => {
    if (confirm('确定要退出登录吗？')) api.logout();
  });

  // 写信按钮
  document.getElementById('composeBtn').addEventListener('click', () => {
    window.router && window.router.go('compose');
  });

})();
