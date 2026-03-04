/* ═══════════════════════════════════════
   设置视图
═══════════════════════════════════════ */
window.settingsView = {
  _activeSection: 'profile',

  render() {
    const user = store.getState().user || {};
    return `
    <div class="settings-body">
      <div class="settings-layout">

        <!-- 左侧导航 -->
        <div class="settings-sidebar-nav">
          <div class="settings-nav-item active" data-section="profile" onclick="settingsView._switchSection('profile', this)">
            <span class="sni-icon">👤</span> 账号信息
          </div>
          <div class="settings-nav-item" data-section="appearance" onclick="settingsView._switchSection('appearance', this)">
            <span class="sni-icon">🎨</span> 外观
          </div>
          <div class="settings-nav-item" data-section="about" onclick="settingsView._switchSection('about', this)">
            <span class="sni-icon">ℹ️</span> 关于
          </div>
        </div>

        <!-- 右侧内容 -->
        <div>

          <!-- 账号信息 -->
          <div class="settings-section active" id="section-profile">
            <div class="settings-card">
              <div class="settings-card-title">账号信息</div>
              <div class="settings-row">
                <div>
                  <div class="settings-row-label">头像</div>
                </div>
                <div class="settings-row-control">
                  <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#34aadc);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff">
                    ${user.avatar || (user.name || 'U').charAt(0)}
                  </div>
                </div>
              </div>
              <div class="settings-row">
                <div class="settings-row-label">姓名</div>
                <input class="input" id="settingName" value="${_escHtml(user.name || '')}" style="max-width:240px" />
              </div>
              <div class="settings-row">
                <div class="settings-row-label">邮箱</div>
                <div style="font-size:14px;color:var(--text-secondary)">${_escHtml(user.email || '')}</div>
              </div>
              <div class="settings-row" style="border-bottom:none">
                <div></div>
                <button class="btn btn-primary" onclick="settingsView._saveProfile()">保存信息</button>
              </div>
            </div>
            <div class="settings-card">
              <div class="settings-card-title">账号操作</div>
              <div class="settings-row" style="border-bottom:none">
                <div>
                  <div class="settings-row-label">退出登录</div>
                  <div class="settings-row-desc">将清除本地登录状态</div>
                </div>
                <button class="btn btn-danger" onclick="api.logout()">退出登录</button>
              </div>
            </div>
          </div>

          <!-- 外观 -->
          <div class="settings-section" id="section-appearance">
            <div class="settings-card">
              <div class="settings-card-title">外观</div>
              <div class="settings-row">
                <div>
                  <div class="settings-row-label">主题色</div>
                  <div class="settings-row-desc">当前：苹果蓝</div>
                </div>
                <div style="display:flex;gap:8px">
                  ${['#0071e3','#34c759','#ff9f0a','#ff3b30','#af52de'].map(c => `
                    <div onclick="settingsView._setAccent('${c}')"
                      style="width:28px;height:28px;border-radius:50%;background:${c};cursor:pointer;
                             border:2px solid transparent;transition:.15s"
                      onmouseover="this.style.borderColor='#888'" onmouseout="this.style.borderColor='transparent'">
                    </div>`).join('')}
                </div>
              </div>
              <div class="settings-row" style="border-bottom:none">
                <div>
                  <div class="settings-row-label">侧边栏宽度</div>
                  <div class="settings-row-desc">拖动调整侧边栏</div>
                </div>
                <input type="range" min="180" max="280" value="220"
                  oninput="document.documentElement.style.setProperty('--sidebar-w', this.value + 'px')" />
              </div>
            </div>
          </div>

          <!-- 关于 -->
          <div class="settings-section" id="section-about">
            <div class="settings-card">
              <div class="settings-card-title">关于个人邮局</div>
              <div style="padding:28px 20px;text-align:center">
                <div style="font-size:48px;margin-bottom:12px">✉️</div>
                <div style="font-size:20px;font-weight:700;letter-spacing:-.02em;margin-bottom:4px">个人邮局</div>
                <div style="font-size:13px;color:var(--text-secondary);margin-bottom:20px">Personal Post Office · v1.0.0</div>
                <div style="font-size:14px;color:var(--text-secondary);line-height:1.8;max-width:360px;margin:0 auto">
                  让每一封信都有温度。<br/>
                  支持对接宝塔邮局管理器，<br/>
                  在数字时代重新找回写信的仪式感。
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>`;
  },

  init() {},

  _switchSection(name, el) {
    document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.settings-nav-item').forEach(n => n.classList.remove('active'));
    const sec = document.getElementById('section-' + name);
    if (sec) sec.classList.add('active');
    el.classList.add('active');
  },

  _saveProfile() {
    const name = document.getElementById('settingName').value.trim();
    if (!name) { showToast('⚠️ 姓名不能为空'); return; }
    const user = store.getState().user;
    user.name = name;
    user.avatar = name.charAt(0).toUpperCase();
    localStorage.setItem('ppo_user', JSON.stringify(user));
    store.setState({ user });
    document.getElementById('userName').textContent = name;
    document.getElementById('userAvatar').textContent = user.avatar;
    showToast('✓ 信息已保存');
  },

  _setAccent(color) {
    document.documentElement.style.setProperty('--accent', color);
    showToast('✓ 主题色已更新');
  }
};
