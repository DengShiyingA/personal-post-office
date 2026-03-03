/* ═══════════════════════════════════════
   地址簿视图
═══════════════════════════════════════ */
window.contactsView = {
  _contacts: [],

  render() {
    return `
    <div class="contacts-body">
      <div id="contactsGrid" class="contacts-grid">
        <div style="padding:40px;text-align:center;color:var(--text-secondary)">加载中…</div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div class="modal-overlay" id="contactModal" style="display:none">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title" id="contactModalTitle">添加联系人</div>
          <div class="modal-close" onclick="contactsView._closeModal()">×</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px">
          <input type="hidden" id="contactId" />
          <div>
            <div class="form-label">姓名 *</div>
            <input class="input" id="contactName" placeholder="联系人姓名" />
          </div>
          <div>
            <div class="form-label">邮箱</div>
            <input class="input" id="contactEmail" type="email" placeholder="邮箱地址" />
          </div>
          <div>
            <div class="form-label">电话</div>
            <input class="input" id="contactPhone" type="tel" placeholder="手机号码" />
          </div>
          <div>
            <div class="form-label">所在城市</div>
            <input class="input" id="contactCity" placeholder="例：上海" />
          </div>
          <div>
            <div class="form-label">备注</div>
            <input class="input" id="contactNote" placeholder="例：大学同学" />
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
            <button class="btn btn-secondary" onclick="contactsView._closeModal()">取消</button>
            <button class="btn btn-primary" onclick="contactsView._save()">保存</button>
          </div>
        </div>
      </div>
    </div>`;
  },

  init() {
    this._load();
  },

  _load() {
    api.getContacts().then(contacts => {
      this._contacts = contacts;
      this._renderGrid(contacts);
    });
  },

  _renderGrid(contacts) {
    const el = document.getElementById('contactsGrid');
    if (!el) return;

    const cards = contacts.map(c => `
      <div class="contact-card">
        <div class="contact-avatar" style="background:${_avatarColor(c.name)}">${c.name.charAt(0)}</div>
        <div class="contact-name">${_escHtml(c.name)}</div>
        <div class="contact-email">${_escHtml(c.email || '—')}</div>
        <div class="contact-city">${c.city ? '📍 ' + _escHtml(c.city) : ''} ${c.note ? '· ' + _escHtml(c.note) : ''}</div>
        <div class="contact-actions">
          <button class="btn btn-secondary" style="font-size:12px;padding:5px 10px"
            onclick="contactsView._compose('${c.name}')">✍️ 写信</button>
          <button class="btn btn-ghost" style="font-size:12px;padding:5px 10px"
            onclick="contactsView._edit('${c.id}')">编辑</button>
          <button class="btn btn-danger" style="font-size:12px;padding:5px 10px"
            onclick="contactsView._delete('${c.id}')">删除</button>
        </div>
      </div>
    `).join('');

    el.innerHTML = cards + `
      <div class="add-contact-card" onclick="contactsView._openModal()">
        <div class="add-icon">＋</div>
        <span>添加联系人</span>
      </div>`;
  },

  _compose(name) {
    localStorage.setItem('ppo_compose_to', name);
    router.go('compose');
    setTimeout(() => {
      const el = document.getElementById('composeTo');
      if (el) { el.value = name; }
    }, 100);
  },

  _openModal(contact = null) {
    document.getElementById('contactId').value = contact ? contact.id : '';
    document.getElementById('contactName').value = contact ? contact.name : '';
    document.getElementById('contactEmail').value = contact ? contact.email : '';
    document.getElementById('contactPhone').value = contact ? contact.phone : '';
    document.getElementById('contactCity').value = contact ? contact.city : '';
    document.getElementById('contactNote').value = contact ? contact.note : '';
    document.getElementById('contactModalTitle').textContent = contact ? '编辑联系人' : '添加联系人';
    document.getElementById('contactModal').style.display = 'flex';
  },

  _closeModal() {
    document.getElementById('contactModal').style.display = 'none';
  },

  _edit(id) {
    const c = this._contacts.find(c => c.id === id);
    if (c) this._openModal(c);
  },

  _save() {
    const name = document.getElementById('contactName').value.trim();
    if (!name) { showToast('⚠️ 请填写姓名'); return; }

    const contact = {
      id: document.getElementById('contactId').value || null,
      name,
      email: document.getElementById('contactEmail').value.trim(),
      phone: document.getElementById('contactPhone').value.trim(),
      city:  document.getElementById('contactCity').value.trim(),
      note:  document.getElementById('contactNote').value.trim()
    };

    api.saveContact(contact).then(() => {
      this._closeModal();
      this._load();
      showToast('✓ 联系人已保存');
    });
  },

  _delete(id) {
    if (!confirm('确定删除这位联系人吗？')) return;
    api.deleteContact(id).then(() => {
      this._load();
      showToast('✓ 联系人已删除');
    });
  }
};
