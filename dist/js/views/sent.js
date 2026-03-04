/* ═══════════════════════════════════════
   已发送视图
═══════════════════════════════════════ */
window.sentView = {
  _messages: [],
  _selectedId: null,

  render() {
    return `
    <div class="list-detail" id="sentLayout">
      <div class="message-list-pane">
        <div class="list-toolbar">
          <div class="search-bar" style="flex:1">
            <span style="font-size:13px;opacity:.5">🔍</span>
            <input type="text" placeholder="搜索已发送…" id="sentSearch" />
          </div>
        </div>
        <div class="message-list" id="sentList">
          <div style="padding:36px;text-align:center;color:var(--text-tertiary);font-size:13px">加载中…</div>
        </div>
      </div>
      <div class="message-detail-pane" id="sentDetail">
        <div class="detail-empty">
          <div class="di-icon">📤</div>
          <p>选择一封已发信件查看详情</p>
        </div>
      </div>
    </div>`;
  },

  init() {
    api.getMessages('sent').then(msgs => {
      this._messages = msgs;
      this._renderList(msgs);
      if (msgs.length > 0) this._showDetail(msgs[0].id);
    });

    document.getElementById('sentSearch').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = this._messages.filter(m =>
        m.to.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        (m.body || '').toLowerCase().includes(q)
      );
      this._renderList(filtered);
    });
  },

  _renderList(msgs) {
    const el = document.getElementById('sentList');
    if (!el) return;
    if (!msgs.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">📤</div><h3>暂无已发信件</h3><p>发出你的第一封信吧</p></div>`;
      return;
    }
    el.innerHTML = msgs.map(m => `
      <div class="message-item ${this._selectedId === m.id ? 'active' : ''}"
           data-id="${m.id}" onclick="sentView._showDetail('${m.id}')">
        <div class="msg-avatar" style="background:${_avatarColor(m.to)}">${(m.to || '?').charAt(0).toUpperCase()}</div>
        <div class="msg-content">
          <div class="msg-row1">
            <span class="msg-from">→ ${_escHtml(m.to)}</span>
            <span class="msg-time">${_formatDate(m.date)}</span>
          </div>
          <div class="msg-subject">${_escHtml(m.subject)}</div>
          <div class="msg-preview">${_escHtml((m.preview || m.body || '').slice(0, 60))}</div>
        </div>
      </div>
    `).join('');
  },

  _showDetail(id) {
    this._selectedId = id;
    document.querySelectorAll('#sentList .message-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });

    api.getMessage(id, 'sent').then(msg => {
      if (!msg) return;
      const det = document.getElementById('sentDetail');
      if (!det) return;

      det.innerHTML = `
        <div class="detail-header">
          <div class="detail-subject">${_escHtml(msg.subject)}</div>
          <div class="detail-meta">
            <div class="detail-meta-row">
              <span class="meta-label">收件人</span>
              <span class="meta-value">${_escHtml(msg.to)}</span>
            </div>
            <div class="detail-meta-row">
              <span class="meta-label">时间</span>
              <span class="meta-value">${new Date(msg.date).toLocaleString('zh-CN')}</span>
            </div>
          </div>
          <div class="detail-actions">
            <button class="btn btn-danger" onclick="sentView._delete('${msg.id}')">🗑 删除</button>
          </div>
        </div>
        <div class="detail-body">${_escHtml(msg.body || '')}</div>
      `;
    });
  },

  _delete(id) {
    if (!confirm('确定删除这封发送记录吗？')) return;
    api.deleteMessage(id, 'sent').then(() => {
      this._messages = this._messages.filter(m => m.id !== id);
      this._selectedId = null;
      this._renderList(this._messages);
      document.getElementById('sentDetail').innerHTML = `
        <div class="detail-empty"><div class="di-icon">📤</div><p>选择一封已发信件查看详情</p></div>`;
      showToast('✓ 已移入回收站');
    });
  }
};
