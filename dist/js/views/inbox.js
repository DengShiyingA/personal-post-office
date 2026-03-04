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
            <span style="font-size:13px;opacity:.5">🔍</span>
            <input type="text" placeholder="搜索收件箱…" id="inboxSearch" />
          </div>
        </div>
        <div class="message-list" id="inboxList">
          <div style="padding:36px;text-align:center;color:var(--text-tertiary);font-size:13px">加载中…</div>
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
        (m.body || '').toLowerCase().includes(q)
      );
      this._renderList(filtered);
    });
  },

  _renderList(msgs) {
    const el = document.getElementById('inboxList');
    if (!el) return;
    if (!msgs.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><h3>收件箱为空</h3><p>还没有收到任何信件</p></div>`;
      return;
    }
    el.innerHTML = msgs.map(m => `
      <div class="message-item ${m.unread ? 'unread' : ''} ${this._selectedId === m.id ? 'active' : ''}"
           data-id="${m.id}" onclick="inboxView._showDetail('${m.id}')">
        <div class="msg-avatar" style="background:${_avatarColor(m.from)}">${(m.from || '?').charAt(0).toUpperCase()}</div>
        <div class="msg-content">
          <div class="msg-row1">
            <span class="msg-from">${escHtml(m.from)}</span>
            <span class="msg-time">${_formatDate(m.date)}</span>
          </div>
          <div class="msg-subject">${escHtml(m.subject)}</div>
          <div class="msg-preview">${escHtml((m.preview || m.body || '').slice(0, 60))}</div>
        </div>
      </div>
    `).join('');
  },

  _showDetail(id) {
    this._selectedId = id;
    document.querySelectorAll('#inboxList .message-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });

    api.getMessage(id).then(msg => {
      if (!msg) return;
      api.markRead(id).then(() => {
        const item = document.querySelector(`#inboxList [data-id="${id}"]`);
        if (item) item.classList.remove('unread');
        const idx = this._messages.findIndex(m => m.id === id);
        if (idx >= 0) this._messages[idx].unread = false;
        const unread = this._messages.filter(m => m.unread).length;
        const badge = document.getElementById('inboxBadge');
        if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? '' : 'none'; }
      });

      const det = document.getElementById('inboxDetail');
      if (!det) return;

      det.innerHTML = `
        <div class="detail-header">
          <div class="detail-subject">${escHtml(msg.subject)}</div>
          <div class="detail-meta">
            <div class="detail-meta-row">
              <span class="meta-label">发件人</span>
              <span class="meta-value">${escHtml(msg.from)}${msg.fromEmail ? ' &lt;' + escHtml(msg.fromEmail) + '&gt;' : ''}</span>
            </div>
            <div class="detail-meta-row">
              <span class="meta-label">时间</span>
              <span class="meta-value">${new Date(msg.date).toLocaleString('zh-CN')}</span>
            </div>
          </div>
          <div class="detail-actions">
            <button class="btn btn-secondary" onclick="composeView._replyTo('${escHtml(msg.fromEmail || msg.from)}');router.go('compose')">↩ 回复</button>
            <button class="btn btn-danger" onclick="inboxView._delete('${msg.id}')">🗑 删除</button>
          </div>
        </div>
        <div class="detail-body">${escHtml(msg.body || '')}</div>
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
      showToast('✓ 已移入回收站');
    });
  }
};

// _escHtml 由 dashboard.js 定义并挂载到 window
var escHtml = window._escHtml || function(s){ return String(s||''); };
