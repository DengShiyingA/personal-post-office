/* ═══════════════════════════════════════
   写信视图
═══════════════════════════════════════ */
window.composeView = {

  render() {
    return `
    <div class="compose-body">
      <div class="compose-card">

        <div class="compose-toolbar">
          <div class="compose-toolbar-title">✍️ 新建信件</div>
        </div>

        <!-- 收件人 -->
        <div class="compose-field">
          <span class="compose-field-label">收件人</span>
          <input class="input" id="composeTo" type="email" placeholder="收件人邮箱地址" />
        </div>

        <!-- 主题 -->
        <div class="compose-field">
          <span class="compose-field-label">主题</span>
          <input class="input" id="composeSubject" type="text" placeholder="邮件主题（选填）" />
        </div>

        <!-- 正文编辑器 -->
        <div class="compose-editor-wrap">
          <div class="compose-editor" id="composeBody" contenteditable="true"
               data-placeholder="在这里写下你想说的话…"></div>
        </div>

        <!-- 发送栏 -->
        <div class="compose-send-bar">
          <div></div>
          <div style="display:flex;gap:10px">
            <button class="btn btn-secondary" onclick="composeView._clear()">清空</button>
            <button class="btn btn-primary" id="sendBtn" onclick="composeView._send()">
              📮 发送
            </button>
          </div>
        </div>

      </div>
    </div>`;
  },

  _replyTo(email) {
    this._pendingTo = email;
  },

  init() {
    if (this._pendingTo) {
      const el = document.getElementById('composeTo');
      if (el) el.value = this._pendingTo;
      this._pendingTo = null;
    }
  },

  _clear() {
    ['composeTo', 'composeSubject'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const body = document.getElementById('composeBody');
    if (body) body.innerHTML = '';
  },

  _send() {
    const to = document.getElementById('composeTo').value.trim();
    const subject = document.getElementById('composeSubject').value.trim();
    const body = document.getElementById('composeBody').innerText.trim();

    if (!to) { showToast('⚠️ 请填写收件人邮箱'); return; }
    if (!body) { showToast('⚠️ 请填写邮件内容'); return; }

    const btn = document.getElementById('sendBtn');
    btn.textContent = '发送中…';
    btn.disabled = true;

    api.sendMessage({
      to,
      toEmail: to,
      subject: subject || '（无主题）',
      body
    }).then(res => {
      showToast('✓ 邮件已发送！');
      this._clear();
      btn.textContent = '📮 发送';
      btn.disabled = false;
      setTimeout(() => router.go('sent'), 1500);
    }).catch(e => {
      showToast('✗ 发送失败：' + (e.message || '未知错误'));
      btn.textContent = '📮 发送';
      btn.disabled = false;
    });
  }
};
