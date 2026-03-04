/* ═══════════════════════════════════════
   仪表盘视图
═══════════════════════════════════════ */
window.dashboardView = {
  render() {
    const hour = new Date().getHours();
    const greeting = hour < 6 ? '夜深了' : hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';
    return `
    <div class="dashboard-body" id="dashboardBody">

      <!-- 欢迎横幅 -->
      <div class="welcome-banner">
        <h2>${greeting}，<span id="dashUserName">朋友</span> 👋</h2>
        <p>你有 <b id="dashUnread">0</b> 封未读信件</p>
        <button class="btn" onclick="router.go('compose')"
          style="background:rgba(255,255,255,.2);border:1.5px solid rgba(255,255,255,.35);color:#fff;font-weight:600;backdrop-filter:blur(8px)">
          ✍️ 立即写信
        </button>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-icon">📥</span>
          <div class="stat-value" id="statInbox">–</div>
          <div class="stat-name">收件总数</div>
          <div class="stat-trend" id="statUnreadHint"></div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">📤</span>
          <div class="stat-value" id="statSent">–</div>
          <div class="stat-name">已发送</div>
          <div class="stat-trend" style="color:var(--text-tertiary)">保持联系中</div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">👥</span>
          <div class="stat-value" id="statContacts">–</div>
          <div class="stat-name">联系人</div>
          <div class="stat-trend" style="color:var(--text-tertiary)">地址簿</div>
        </div>
      </div>

      <div class="dash-grid">

        <!-- 最近信件 -->
        <div class="section-card">
          <div class="section-card-header">
            <div class="section-card-title">最近信件</div>
            <span class="section-card-link" onclick="router.go('inbox')">查看全部 →</span>
          </div>
          <div class="recent-list" id="recentList">
            <div style="padding:36px;text-align:center;color:var(--text-tertiary);font-size:13px">加载中…</div>
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="section-card">
          <div class="section-card-header">
            <div class="section-card-title">快速操作</div>
          </div>
          <div class="quick-actions">
            <button class="quick-btn" onclick="router.go('compose')">
              <span class="qb-icon">✍️</span>
              <div>
                <div>写一封信</div>
                <div class="qb-desc">寄给最重要的人</div>
              </div>
            </button>
            <button class="quick-btn" onclick="router.go('contacts')">
              <span class="qb-icon">👥</span>
              <div>
                <div>地址簿</div>
                <div class="qb-desc">管理联系人</div>
              </div>
            </button>
            <button class="quick-btn" onclick="router.go('settings')">
              <span class="qb-icon">⚙️</span>
              <div>
                <div>设置</div>
                <div class="qb-desc">账号信息与外观</div>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>`;
  },

  init() {
    const user = store.getState().user;
    if (user) {
      document.getElementById('dashUserName').textContent = user.name;
    }

    Promise.all([
      api.getMessages('inbox'),
      api.getMessages('sent'),
      api.getContacts()
    ]).then(([inbox, sent, contacts]) => {
      const unread = inbox.filter(m => m.unread).length;

      document.getElementById('dashUnread').textContent = unread;
      document.getElementById('statInbox').textContent = inbox.length;
      document.getElementById('statSent').textContent = sent.length;
      document.getElementById('statContacts').textContent = contacts.length;
      document.getElementById('statUnreadHint').textContent = unread > 0 ? `● ${unread} 封未读` : '全部已读';
      document.getElementById('statUnreadHint').style.color = unread > 0 ? 'var(--accent)' : 'var(--success)';

      const all = [...inbox.map(m => ({...m, dir:'inbox'})), ...sent.map(m => ({...m, dir:'sent'}))]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6);

      document.getElementById('recentList').innerHTML = all.length ? all.map(msg => {
        const who = msg.dir === 'inbox' ? msg.from : msg.to;
        return `
        <div class="recent-item" onclick="router.go('${msg.dir}')">
          <div class="recent-avatar" style="background:${avatarColor(who)}">${(who || '?').charAt(0).toUpperCase()}</div>
          <div class="recent-info">
            <div class="recent-name">${msg.dir === 'inbox' ? _escHtml(msg.from) : '→ ' + _escHtml(msg.to)}</div>
            <div class="recent-preview">${_escHtml(msg.subject)}</div>
          </div>
          <div class="recent-meta">
            <div class="recent-time">${formatDate(msg.date)}</div>
            <span class="recent-tag ${msg.dir === 'inbox' ? 'tag-inbox' : 'tag-sent'}">
              ${msg.dir === 'inbox' ? '收件' : '已发'}
            </span>
          </div>
        </div>`;
      }).join('') : `<div class="empty-state" style="padding:36px"><div class="empty-icon">📭</div><p>暂无邮件</p></div>`;
    });
  }
};

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  if (diff < 86400000 * 7) {
    const days = ['日','一','二','三','四','五','六'];
    return '周' + days[d.getDay()];
  }
  return `${d.getMonth()+1}/${d.getDate()}`;
}

const COLORS = ['#0071e3','#34aadc','#5e5ce6','#ff9f0a','#34c759','#ff6b6b','#af52de'];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h += name.charCodeAt(i);
  return COLORS[h % COLORS.length];
}
function _escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function _skeletonList(n) {
  n = n || 4;
  const item = `
    <div class="skeleton-item">
      <div class="skeleton skeleton-avatar"></div>
      <div class="skeleton-lines">
        <div class="skeleton skeleton-line w-60"></div>
        <div class="skeleton skeleton-line w-80"></div>
        <div class="skeleton skeleton-line w-40"></div>
      </div>
    </div>`;
  return Array(n).fill(item).join('');
}
window._avatarColor = avatarColor;
window._formatDate = formatDate;
window._escHtml = _escHtml;
window._skeletonList = _skeletonList;
