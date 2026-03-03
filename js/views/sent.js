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
            <span>🔍</span>
            <input type="text" placeholder="搜索已发送…" id="sentSearch" />
          </div>
        </div>
        <div class="message-list" id="sentList">
          <div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:14px;">加载中…</div>
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
        m.body.toLowerCase().includes(q)
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
        <div class="msg-row1">
          <span class="msg-from">→ ${_escHtml(m.to)}</span>
          <span class="msg-time">${_formatDate(m.date)}</span>
        </div>
        <div class="msg-subject">${_escHtml(m.subject)}</div>
        <div class="msg-preview">${_escHtml(m.body.slice(0, 60))}…</div>
      </div>
    `).join('');
  },

  _showDetail(id) {
    this._selectedId = id;
    document.querySelectorAll('#sentList .message-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });

    api.getMessage(id).then(msg => {
      if (!msg) return;
      const det = document.getElementById('sentDetail');
      if (!det) return;

      const statusMap = { delivered: ['已送达', 'var(--success)'], transit: ['运输中', 'var(--warning)'], processing: ['处理中', 'var(--accent)'] };
      const [statusText, statusColor] = statusMap[msg.trackingStatus] || ['未知', 'var(--text-secondary)'];

      const trackHtml = msg.trackingId ? `
        <div class="detail-tracking-bar">
          <div class="tracking-bar-title" style="display:flex;justify-content:space-between">
            <span>📦 追踪编号：${msg.trackingId}</span>
            <span style="color:${statusColor};font-weight:600">${statusText}</span>
          </div>
          <div style="margin-top:10px;font-size:13px;color:var(--text-secondary)">
            ${msg.from_city || '寄出地'} → ${msg.to_city || '目的地'}
            ${msg.package ? ` · ${msg.package}套餐` : ''}
          </div>
          <div style="margin-top:8px">
            <span style="font-size:12px;color:var(--accent);cursor:pointer" onclick="router.go('tracking')">查看追踪详情 ›</span>
          </div>
        </div>
      ` : '';

      det.innerHTML = `
        <div class="detail-header">
          <div class="detail-subject">${_escHtml(msg.subject)}</div>
          <div class="detail-meta">
            <div class="detail-meta-row"><span class="meta-label">收件人</span><span class="meta-value">${_escHtml(msg.to)}</span></div>
            <div class="detail-meta-row"><span class="meta-label">发送时间</span><span class="meta-value">${new Date(msg.date).toLocaleString('zh-CN')}</span></div>
            ${msg.package ? `<div class="detail-meta-row"><span class="meta-label">套餐</span><span class="meta-value">${_escHtml(msg.package)}</span></div>` : ''}
          </div>
          <div class="detail-actions">
            <button class="btn btn-danger" onclick="sentView._delete('${msg.id}')">🗑 删除</button>
            ${msg.trackingId ? `<button class="btn btn-ghost" onclick="router.go('tracking')">📦 追踪</button>` : ''}
          </div>
        </div>
        ${trackHtml}
        <div class="detail-body">${_escHtml(msg.body)}</div>
      `;
    });
  },

  _delete(id) {
    if (!confirm('确定删除这封发送记录吗？')) return;
    api.deleteMessage(id).then(() => {
      this._messages = this._messages.filter(m => m.id !== id);
      this._selectedId = null;
      this._renderList(this._messages);
      document.getElementById('sentDetail').innerHTML = `
        <div class="detail-empty"><div class="di-icon">📤</div><p>选择一封已发信件查看详情</p></div>`;
      showToast('✓ 记录已删除');
    });
  }
};
