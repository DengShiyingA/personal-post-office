/* ═══════════════════════════════════════
   回收站视图
═══════════════════════════════════════ */
window.trashView = {
  _messages: [],
  _selectedId: null,

  render() {
    return `
    <div class="list-detail" id="trashLayout">
      <div class="message-list-pane">
        <div class="list-toolbar">
          <div class="search-bar" style="flex:1">
            <span style="font-size:13px;opacity:.5">🔍</span>
            <input type="text" placeholder="搜索回收站…" id="trashSearch" />
          </div>
        </div>
        <div class="message-list" id="trashList">${_skeletonList()}</div>
      </div>
      <div class="message-detail-pane" id="trashDetail">
        <div class="detail-empty">
          <div class="di-icon">🗑️</div>
          <p>选择一封信件查看详情</p>
        </div>
      </div>
    </div>`;
  },

  init() {
    api.getMessages('trash').then(msgs => {
      this._messages = msgs;
      this._renderList(msgs);
      if (msgs.length > 0) this._showDetail(msgs[0].id);
    });

    document.getElementById('trashSearch').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = this._messages.filter(m =>
        (m.from || m.to || '').toLowerCase().includes(q) ||
        (m.subject || '').toLowerCase().includes(q) ||
        (m.body || '').toLowerCase().includes(q)
      );
      this._renderList(filtered);
    });
  },

  _renderList(msgs) {
    const el = document.getElementById('trashList');
    if (!el) return;
    if (!msgs.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">🗑️</div><h3>回收站为空</h3><p>删除的邮件会暂存于此</p></div>`;
      return;
    }
    el.innerHTML = msgs.map(m => {
      const who = m.from || m.to || '未知';
      return `
      <div class="message-item ${this._selectedId === m.id ? 'active' : ''}"
           data-id="${m.id}" onclick="trashView._showDetail('${m.id}')">
        <div class="msg-avatar" style="background:${_avatarColor(who)};opacity:.75">${who.charAt(0).toUpperCase()}</div>
        <div class="msg-content">
          <div class="msg-row1">
            <span class="msg-from" style="opacity:.75">${m.from ? _escHtml(m.from) : '→ ' + _escHtml(m.to || '')}</span>
            <span class="msg-time">${_formatDate(m.date)}</span>
          </div>
          <div class="msg-subject" style="opacity:.75">${_escHtml(m.subject || '（无主题）')}</div>
          <div class="msg-preview">${_escHtml((m.preview || m.body || '').slice(0, 60))}</div>
        </div>
      </div>`;
    }).join('');
  },

  _showDetail(id) {
    this._selectedId = id;
    document.querySelectorAll('#trashList .message-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });

    api.getMessage(id, 'trash').then(msg => {
      if (!msg) return;
      const det = document.getElementById('trashDetail');
      if (!det) return;

      const isReceived = !!msg.from;

      det.innerHTML = `
        <div class="detail-header">
          <div class="detail-subject">${_escHtml(msg.subject || '（无主题）')}</div>
          <div class="detail-meta">
            ${isReceived
              ? `<div class="detail-meta-row"><span class="meta-label">发件人</span><span class="meta-value">${_escHtml(msg.from)}${msg.fromEmail ? ' &lt;' + _escHtml(msg.fromEmail) + '&gt;' : ''}</span></div>`
              : `<div class="detail-meta-row"><span class="meta-label">收件人</span><span class="meta-value">${_escHtml(msg.to || '')}</span></div>`
            }
            <div class="detail-meta-row"><span class="meta-label">时间</span><span class="meta-value">${new Date(msg.date).toLocaleString('zh-CN')}</span></div>
          </div>
          <div class="detail-actions">
            <button class="btn btn-secondary" onclick="trashView._restore('${msg.id}')">↩ 恢复</button>
            <button class="btn btn-danger" onclick="trashView._purge('${msg.id}')">🗑 永久删除</button>
          </div>
        </div>
        <div class="detail-body">${_escHtml(msg.body || '')}</div>
      `;
    });
  },

  _restore(id) {
    api.restoreMessage(id).then(() => {
      this._messages = this._messages.filter(m => m.id !== id);
      this._selectedId = null;
      this._renderList(this._messages);
      document.getElementById('trashDetail').innerHTML = `
        <div class="detail-empty"><div class="di-icon">🗑️</div><p>选择一封信件查看详情</p></div>`;
      showToast('✓ 已恢复到原始文件夹');
    }).catch(e => showToast('✗ 恢复失败：' + (e.message || '未知错误')));
  },

  _purge(id) {
    if (!confirm('永久删除后无法恢复，确定吗？')) return;
    api.purgeMessage(id).then(() => {
      this._messages = this._messages.filter(m => m.id !== id);
      this._selectedId = null;
      this._renderList(this._messages);
      document.getElementById('trashDetail').innerHTML = `
        <div class="detail-empty"><div class="di-icon">🗑️</div><p>选择一封信件查看详情</p></div>`;
      showToast('✓ 已永久删除');
    }).catch(e => showToast('✗ 删除失败：' + (e.message || '未知错误')));
  }
};
