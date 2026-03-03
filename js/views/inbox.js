/* ═══════════════════════════════════════
   收件箱视图
═══════════════════════════════════════ */
window.inboxView = {
  _messages: [],
  _selectedId: null,

  render() {
    return `
    <div class="list-detail" id="inboxLayout">
      <!-- 列表面板 -->
      <div class="message-list-pane">
        <div class="list-toolbar">
          <div class="search-bar" style="flex:1">
            <span>🔍</span>
            <input type="text" placeholder="搜索收件箱…" id="inboxSearch" />
          </div>
        </div>
        <div class="message-list" id="inboxList">
          <div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:14px;">加载中…</div>
        </div>
      </div>

      <!-- 详情面板 -->
      <div class="message-detail-pane" id="inboxDetail">
        <div class="detail-empty">
          <div class="di-icon">📬</div>
          <p>选择一封信件查看详情</p>
        </div>
      </div>
    </div>`;
  },

  init() {
    api.getMessages('inbox').then(msgs => {
      this._messages = msgs;
      this._renderList(msgs);
      if (msgs.length > 0) this._showDetail(msgs[0].id);
    });

    document.getElementById('inboxSearch').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = this._messages.filter(m =>
        m.from.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q)
      );
      this._renderList(filtered);
    });
  },

  _renderList(msgs) {
    const el = document.getElementById('inboxList');
    if (!el) return;
    if (!msgs.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><h3>收件箱为空</h3><p>你还没有收到任何信件</p></div>`;
      return;
    }
    el.innerHTML = msgs.map(m => `
      <div class="message-item ${m.unread ? 'unread' : ''} ${this._selectedId === m.id ? 'active' : ''}"
           data-id="${m.id}" onclick="inboxView._showDetail('${m.id}')">
        <div class="msg-row1">
          <span class="msg-from">${escHtml(m.from)}</span>
          <span class="msg-time">${_formatDate(m.date)}</span>
        </div>
        <div class="msg-subject">${escHtml(m.subject)}</div>
        <div class="msg-preview">${escHtml(m.body.slice(0, 60))}…</div>
      </div>
    `).join('');
  },

  _showDetail(id) {
    this._selectedId = id;
    // 高亮选中
    document.querySelectorAll('#inboxList .message-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });

    api.getMessage(id).then(msg => {
      if (!msg) return;
      api.markRead(id).then(() => {
        // 更新未读标记
        const item = document.querySelector(`#inboxList [data-id="${id}"]`);
        if (item) item.classList.remove('unread');
        const idx = this._messages.findIndex(m => m.id === id);
        if (idx >= 0) this._messages[idx].unread = false;
        // 更新 badge
        const unread = this._messages.filter(m => m.unread).length;
        const badge = document.getElementById('inboxBadge');
        if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? '' : 'none'; }
      });

      const det = document.getElementById('inboxDetail');
      if (!det) return;

      const trackingHtml = msg.trackingId ? `
        <div class="detail-tracking-bar">
          <div class="tracking-bar-title">📦 追踪编号：${msg.trackingId}</div>
          <div class="tracking-steps-mini" id="trackMini">
            ${[0,1,2,3,4].map(i => `
              <div class="ts-dot ${i < 3 ? 'done' : i === 3 ? 'active' : ''}"></div>
              ${i < 4 ? '<div class="ts-line ' + (i < 2 ? 'done' : '') + '"></div>' : ''}
            `).join('')}
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:6px">
            <span style="font-size:11px;color:var(--text-secondary)">
              ${msg.from_city || '寄出地'} → ${msg.to_city || '目的地'}
            </span>
            <span style="font-size:11px;color:var(--accent);cursor:pointer"
                  onclick="router.go('tracking')">查看详情 ›</span>
          </div>
        </div>
      ` : '';

      det.innerHTML = `
        <div class="detail-header">
          <div class="detail-subject">${escHtml(msg.subject)}</div>
          <div class="detail-meta">
            <div class="detail-meta-row"><span class="meta-label">发件人</span><span class="meta-value">${escHtml(msg.from)} &lt;${escHtml(msg.fromEmail)}&gt;</span></div>
            <div class="detail-meta-row"><span class="meta-label">日期</span><span class="meta-value">${new Date(msg.date).toLocaleString('zh-CN')}</span></div>
            ${msg.package ? `<div class="detail-meta-row"><span class="meta-label">套餐</span><span class="meta-value">${escHtml(msg.package)}</span></div>` : ''}
          </div>
          <div class="detail-actions">
            <button class="btn btn-secondary" onclick="router.go('compose')">↩ 回复</button>
            <button class="btn btn-danger" onclick="inboxView._delete('${msg.id}')">🗑 删除</button>
            ${msg.trackingId ? `<button class="btn btn-ghost" onclick="router.go('tracking')">📦 追踪</button>` : ''}
          </div>
        </div>
        ${trackingHtml}
        <div class="detail-body">${escHtml(msg.body)}</div>
      `;
    });
  },

  _delete(id) {
    if (!confirm('确定删除这封信件吗？')) return;
    api.deleteMessage(id).then(() => {
      this._messages = this._messages.filter(m => m.id !== id);
      this._selectedId = null;
      this._renderList(this._messages);
      document.getElementById('inboxDetail').innerHTML = `
        <div class="detail-empty"><div class="di-icon">📬</div><p>选择一封信件查看详情</p></div>`;
      showToast('✓ 信件已删除');
    });
  }
};

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
window._escHtml = escHtml;
