/* ═══════════════════════════════════════
   仪表盘视图
═══════════════════════════════════════ */
window.dashboardView = {
  render() {
    return `
    <div class="dashboard-body" id="dashboardBody">

      <!-- 欢迎横幅 -->
      <div class="welcome-banner" id="welcomeBanner">
        <h2>早上好，<span id="dashUserName">朋友</span> 👋</h2>
        <p>你有 <b id="dashUnread">0</b> 封未读信件，<b id="dashTransit">0</b> 封信件在途中。</p>
        <button class="btn btn-primary" onclick="router.go('compose')" style="background:rgba(255,255,255,.25);border:1.5px solid rgba(255,255,255,.4);">
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
          <div class="stat-trend">↑ 保持联系中</div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">📦</span>
          <div class="stat-value" id="statTransit">–</div>
          <div class="stat-name">在途信件</div>
          <div class="stat-trend" style="color:var(--warning)">实时追踪中</div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">👥</span>
          <div class="stat-value" id="statContacts">–</div>
          <div class="stat-name">联系人</div>
          <div class="stat-trend">地址簿</div>
        </div>
      </div>

      <div class="dash-grid">

        <!-- 最近信件 -->
        <div class="section-card">
          <div class="section-card-header">
            <div class="section-card-title">最近信件</div>
            <span class="section-card-link" onclick="router.go('inbox')">查看全部</span>
          </div>
          <div class="recent-list" id="recentList">
            <div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:14px;">加载中…</div>
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
            <button class="quick-btn" onclick="router.go('tracking')">
              <span class="qb-icon">📦</span>
              <div>
                <div>追踪信件</div>
                <div class="qb-desc">查看在途状态</div>
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
                <div>服务器设置</div>
                <div class="qb-desc">配置宝塔邮局连接</div>
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

    // 加载统计数据
    Promise.all([
      api.getMessages('inbox'),
      api.getMessages('sent'),
      api.getAllTracking(),
      api.getContacts()
    ]).then(([inbox, sent, tracking, contacts]) => {
      const unread = inbox.filter(m => m.unread).length;
      const transit = tracking.filter(t => t.status === 'transit').length;

      document.getElementById('dashUnread').textContent = unread;
      document.getElementById('dashTransit').textContent = transit;
      document.getElementById('statInbox').textContent = inbox.length;
      document.getElementById('statSent').textContent = sent.length;
      document.getElementById('statTransit').textContent = transit;
      document.getElementById('statContacts').textContent = contacts.length;
      document.getElementById('statUnreadHint').textContent = unread > 0 ? `● ${unread} 封未读` : '全部已读';
      document.getElementById('statUnreadHint').style.color = unread > 0 ? 'var(--accent)' : 'var(--success)';

      // 最近信件列表（合并 inbox + sent，取最新6条）
      const all = [...inbox.map(m => ({...m, dir:'inbox'})), ...sent.map(m => ({...m, dir:'sent'}))]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6);

      document.getElementById('recentList').innerHTML = all.length ? all.map(msg => `
        <div class="recent-item" onclick="router.go('${msg.dir}')">
          <div class="recent-avatar" style="background:${avatarColor(msg.dir === 'inbox' ? msg.from : msg.to)}">
            ${(msg.dir === 'inbox' ? msg.from : msg.to).charAt(0)}
          </div>
          <div class="recent-info">
            <div class="recent-name">${msg.dir === 'inbox' ? msg.from : '→ ' + msg.to}</div>
            <div class="recent-preview">${msg.subject}</div>
          </div>
          <div class="recent-meta">
            <div class="recent-time">${formatDate(msg.date)}</div>
            <span class="recent-tag ${msg.dir === 'inbox' ? 'tag-inbox' : 'tag-sent'}">
              ${msg.dir === 'inbox' ? '收件' : '已发'}
            </span>
          </div>
        </div>
      `).join('') : '<div class="empty-state" style="padding:40px"><p>暂无邮件</p></div>';
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
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return COLORS[h % COLORS.length];
}
window._avatarColor = avatarColor;
window._formatDate = formatDate;
