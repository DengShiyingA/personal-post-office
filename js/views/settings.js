/* ═══════════════════════════════════════
   设置视图
═══════════════════════════════════════ */
window.settingsView = {
  _activeSection: 'profile',

  render() {
    const user = store.getState().user || {};
    const cfg = api.getServerConfig();
    return `
    <div class="settings-body">
      <div class="settings-layout">

        <!-- 左侧导航 -->
        <div class="settings-sidebar-nav">
          <div class="settings-nav-item active" data-section="profile" onclick="settingsView._switchSection('profile', this)">
            <span class="sni-icon">👤</span> 账号信息
          </div>
          <div class="settings-nav-item" data-section="server" onclick="settingsView._switchSection('server', this)">
            <span class="sni-icon">🖥</span> 服务器配置
          </div>
          <div class="settings-nav-item" data-section="notify" onclick="settingsView._switchSection('notify', this)">
            <span class="sni-icon">🔔</span> 通知设置
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

          <!-- 服务器配置 -->
          <div class="settings-section" id="section-server">
            <div class="settings-card">
              <div class="settings-card-title">宝塔邮局服务器配置</div>

              <div class="settings-row">
                <div>
                  <div class="settings-row-label">连接状态</div>
                  <div class="settings-row-desc">实时检测服务器连接</div>
                </div>
                <div class="server-status" id="serverStatus">
                  <div class="status-dot disconnected" id="statusDot"></div>
                  <span id="statusText">未连接</span>
                </div>
              </div>

              <div class="settings-row">
                <div class="settings-row-label">服务器地址</div>
                <input class="input" id="cfgHost" value="${_escHtml(cfg.host)}"
                  placeholder="mail.example.com 或 IP 地址" style="max-width:280px" />
              </div>
              <div class="settings-row">
                <div class="settings-row-label">SMTP 端口</div>
                <input class="input" id="cfgSmtp" type="number" value="${cfg.smtpPort}"
                  placeholder="465 (SSL) / 587 (TLS)" style="max-width:120px" />
              </div>
              <div class="settings-row">
                <div class="settings-row-label">IMAP 端口</div>
                <input class="input" id="cfgImap" type="number" value="${cfg.imapPort}"
                  placeholder="993 (SSL) / 143" style="max-width:120px" />
              </div>
              <div class="settings-row">
                <div class="settings-row-label">SSL/TLS</div>
                <label class="toggle">
                  <input type="checkbox" id="cfgSsl" ${cfg.ssl ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="settings-row">
                <div class="settings-row-label">邮箱账号</div>
                <input class="input" id="cfgUser" value="${_escHtml(cfg.username)}"
                  placeholder="your@domain.com" style="max-width:280px" />
              </div>
              <div class="settings-row">
                <div class="settings-row-label">密码</div>
                <input class="input" id="cfgPass" type="password" value="${_escHtml(cfg.password)}"
                  placeholder="邮箱密码或应用专用密码" style="max-width:280px" />
              </div>
              <div class="settings-row" style="border-bottom:none">
                <div style="font-size:12px;color:var(--text-secondary);line-height:1.6">
                  💡 配置完成后点击「测试连接」验证，成功后保存即可对接宝塔邮局管理器。
                </div>
                <div style="display:flex;gap:10px">
                  <button class="btn btn-secondary" onclick="settingsView._testConn()">测试连接</button>
                  <button class="btn btn-primary" onclick="settingsView._saveServer()">保存配置</button>
                </div>
              </div>
            </div>

            <div class="settings-card">
              <div class="settings-card-title">如何查找宝塔邮局配置</div>
              <div style="padding:16px 20px;font-size:14px;line-height:1.8;color:var(--text-secondary)">
                <div>1. 登录宝塔面板 → 左侧菜单 → <b>邮局管理器</b></div>
                <div>2. 查看 SMTP/IMAP 端口和服务器地址</div>
                <div>3. 使用面板中创建的邮箱账号和密码</div>
                <div>4. 若开启了 SSL，端口通常为 <b>SMTP: 465</b>，<b>IMAP: 993</b></div>
                <div style="margin-top:10px;padding:10px 14px;background:var(--bg);border-radius:var(--r-sm);font-family:var(--font-mono);font-size:12px">
                  服务器：mail.你的域名.com<br/>
                  SMTP：465 (SSL) 或 587 (TLS)<br/>
                  IMAP：993 (SSL) 或 143
                </div>
              </div>
            </div>
          </div>

          <!-- 通知设置 -->
          <div class="settings-section" id="section-notify">
            <div class="settings-card">
              <div class="settings-card-title">通知设置</div>
              ${[
                ['新邮件通知', '收到新信件时推送通知'],
                ['信件签收提醒', '信件被对方签收时通知'],
                ['在途状态更新', '追踪状态变更时通知'],
                ['每日摘要', '每天早上汇总未读信件']
              ].map(([label, desc], i) => `
              <div class="settings-row" ${i === 3 ? 'style="border-bottom:none"' : ''}>
                <div>
                  <div class="settings-row-label">${label}</div>
                  <div class="settings-row-desc">${desc}</div>
                </div>
                <label class="toggle settings-row-control">
                  <input type="checkbox" ${i < 3 ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </label>
              </div>`).join('')}
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
            <div class="settings-card">
              <div class="settings-card-title">数据管理</div>
              <div class="settings-row" style="border-bottom:none">
                <div>
                  <div class="settings-row-label">重置演示数据</div>
                  <div class="settings-row-desc">清空并重新初始化 Mock 数据</div>
                </div>
                <button class="btn btn-danger" onclick="settingsView._resetData()">重置数据</button>
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

  _saveServer() {
    const config = {
      host: document.getElementById('cfgHost').value.trim(),
      smtpPort: parseInt(document.getElementById('cfgSmtp').value) || 465,
      imapPort: parseInt(document.getElementById('cfgImap').value) || 993,
      ssl: document.getElementById('cfgSsl').checked,
      username: document.getElementById('cfgUser').value.trim(),
      password: document.getElementById('cfgPass').value
    };
    api.saveServerConfig(config).then(() => showToast('✓ 服务器配置已保存'));
  },

  _testConn() {
    const dot = document.getElementById('statusDot');
    const txt = document.getElementById('statusText');
    if (!dot || !txt) return;
    dot.className = 'status-dot connecting';
    txt.textContent = '连接中…';
    const config = {
      host: document.getElementById('cfgHost').value.trim(),
      smtpPort: parseInt(document.getElementById('cfgSmtp').value) || 465,
      imapPort: parseInt(document.getElementById('cfgImap').value) || 993,
      ssl: document.getElementById('cfgSsl').checked,
      username: document.getElementById('cfgUser').value.trim(),
      password: document.getElementById('cfgPass').value
    };
    api.testConnection(config).then(res => {
      if (res.success) {
        dot.className = 'status-dot connected';
        txt.textContent = '已连接';
        showToast('✓ 连接成功！');
      } else {
        dot.className = 'status-dot disconnected';
        txt.textContent = '连接失败';
        showToast('⚠️ ' + res.message);
      }
    });
  },

  _setAccent(color) {
    document.documentElement.style.setProperty('--accent', color);
    showToast('✓ 主题色已更新');
  },

  _resetData() {
    if (!confirm('确定重置所有演示数据吗？此操作不可撤销。')) return;
    localStorage.removeItem('ppo_mock_initialized');
    localStorage.removeItem('ppo_inbox');
    localStorage.removeItem('ppo_sent');
    localStorage.removeItem('ppo_contacts');
    localStorage.removeItem('ppo_tracking');
    window.location.reload();
  }
};
