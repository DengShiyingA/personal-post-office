/* ═══════════════════════════════════════
   写信视图
═══════════════════════════════════════ */
window.composeView = {
  _selectedPkg: '心意',

  render() {
    return `
    <div class="compose-body">
      <div class="compose-card">

        <div class="compose-toolbar">
          <div class="compose-toolbar-title">✍️ 新建信件</div>
          <button class="btn btn-secondary btn-icon" title="草稿箱" onclick="showToast('草稿已保存 ✓')">💾</button>
        </div>

        <!-- 收件人 -->
        <div class="compose-field">
          <span class="compose-field-label">收件人</span>
          <input class="input" id="composeTo" type="text" placeholder="姓名或邮箱" list="contactSuggest" />
          <datalist id="contactSuggest"></datalist>
        </div>

        <!-- 寄件地 / 目的地 -->
        <div class="compose-field">
          <span class="compose-field-label">寄件地</span>
          <input class="input" id="composeFrom" type="text" placeholder="例：上海" style="max-width:140px" />
          <span style="padding:0 8px;color:var(--text-secondary);font-size:18px">→</span>
          <span class="compose-field-label" style="min-width:auto">目的地</span>
          <input class="input" id="composeTo2" type="text" placeholder="例：北京" style="max-width:140px" />
        </div>

        <!-- 主题 -->
        <div class="compose-field">
          <span class="compose-field-label">主题</span>
          <input class="input" id="composeSubject" type="text" placeholder="信件主题（选填）" />
        </div>

        <!-- 正文编辑器 -->
        <div class="compose-editor-wrap">
          <div class="compose-editor" id="composeBody" contenteditable="true"
               data-placeholder="在这里写下你想说的话…"></div>
        </div>

        <!-- 套餐选择 -->
        <div class="compose-options">
          <div class="compose-options-title">选择套餐</div>
          <div class="package-grid">
            <div class="package-option ${this._selectedPkg === '信笺' ? 'selected' : ''}" data-pkg="信笺" onclick="composeView._selectPkg(this)">
              <div class="pkg-icon">📃</div>
              <div class="pkg-name">信笺</div>
              <div class="pkg-price">¥19/封</div>
            </div>
            <div class="package-option ${this._selectedPkg === '心意' ? 'selected' : ''}" data-pkg="心意" onclick="composeView._selectPkg(this)">
              <div class="pkg-icon">💌</div>
              <div class="pkg-name">心意</div>
              <div class="pkg-price">¥39/封</div>
            </div>
            <div class="package-option ${this._selectedPkg === '珍藏' ? 'selected' : ''}" data-pkg="珍藏" onclick="composeView._selectPkg(this)">
              <div class="pkg-icon">🎁</div>
              <div class="pkg-name">珍藏</div>
              <div class="pkg-price">¥89/封</div>
            </div>
          </div>

          <!-- 附加选项 -->
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary);cursor:pointer">
              <input type="checkbox" id="addFlower" style="accent-color:var(--accent)"> 🌸 附加干花
            </label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary);cursor:pointer">
              <input type="checkbox" id="addSeal" style="accent-color:var(--accent)"> 🔒 封蜡印章
            </label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary);cursor:pointer">
              <input type="checkbox" id="addAroma" style="accent-color:var(--accent)"> 🌿 香薰纸
            </label>
          </div>
        </div>

        <!-- 发送栏 -->
        <div class="compose-send-bar">
          <div style="font-size:13px;color:var(--text-secondary)">
            套餐：<b id="selectedPkgLabel" style="color:var(--text)">心意 ¥39</b>
          </div>
          <div style="display:flex;gap:10px">
            <button class="btn btn-secondary" onclick="composeView._clear()">清空</button>
            <button class="btn btn-primary" id="sendBtn" onclick="composeView._send()">
              📮 发送信件
            </button>
          </div>
        </div>

      </div>
    </div>`;
  },

  init() {
    // 加载联系人建议
    api.getContacts().then(contacts => {
      const dl = document.getElementById('contactSuggest');
      if (dl) dl.innerHTML = contacts.map(c => `<option value="${c.name}">${c.name} &lt;${c.email}&gt;</option>`).join('');
    });
  },

  _selectPkg(el) {
    document.querySelectorAll('.package-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    this._selectedPkg = el.dataset.pkg;
    const prices = { '信笺': '¥19', '心意': '¥39', '珍藏': '¥89' };
    const label = document.getElementById('selectedPkgLabel');
    if (label) label.textContent = `${this._selectedPkg} ${prices[this._selectedPkg]}`;
  },

  _clear() {
    if (!confirm('确定清空内容吗？')) return;
    ['composeTo','composeFrom','composeTo2','composeSubject'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const body = document.getElementById('composeBody');
    if (body) body.innerHTML = '';
    ['addFlower','addSeal','addAroma'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });
  },

  _send() {
    const to = document.getElementById('composeTo').value.trim();
    const fromCity = document.getElementById('composeFrom').value.trim();
    const toCity = document.getElementById('composeTo2').value.trim();
    const subject = document.getElementById('composeSubject').value.trim();
    const body = document.getElementById('composeBody').innerText.trim();

    if (!to) { showToast('⚠️ 请填写收件人'); return; }
    if (!body) { showToast('⚠️ 请填写信件内容'); return; }

    const btn = document.getElementById('sendBtn');
    btn.textContent = '发送中…';
    btn.disabled = true;

    api.sendMessage({
      to, fromCity, toCity,
      subject: subject || `来自${fromCity || '我'}的一封信`,
      body,
      package: this._selectedPkg
    }).then(res => {
      showToast(`✓ 信件已发送！追踪编号：${res.trackingId}`);
      this._clear();
      btn.textContent = '📮 发送信件';
      btn.disabled = false;
      setTimeout(() => router.go('sent'), 1500);
    });
  }
};
