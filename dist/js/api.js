/* ═══════════════════════════════════════════════════
   API 适配层 · 自动切换 Mock / 真实 PHP 模式
   ─────────────────────────────────────────────────
   演示模式（token 以 demo- 开头）: 使用 localStorage Mock 数据
   真实模式（IMAP token）       : 调用 dist/api/*.php 接口
═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Mock 数据初始化 ─────────────────────────── */
  function initMockData() {
    if (localStorage.getItem('ppo_mock_initialized') === 'v2') return;

    const inbox = [];
    const sent = [];
    const contacts = [];
    const tracking = [];

    localStorage.setItem('ppo_inbox', JSON.stringify(inbox));
    localStorage.setItem('ppo_sent', JSON.stringify(sent));
    localStorage.setItem('ppo_contacts', JSON.stringify(contacts));
    localStorage.setItem('ppo_tracking', JSON.stringify(tracking));
    localStorage.setItem('ppo_mock_initialized', 'v2');
  }

  /* ── API 核心 ──────────────────────────────── */
  window.api = {

    // 是否为演示模式
    _demo() {
      const token = localStorage.getItem('ppo_token');
      return !token || token.startsWith('demo-');
    },

    // 调用 PHP 接口（含 session token 鉴权）
    async _fetch(path, opts = {}) {
      const token = localStorage.getItem('ppo_token') || '';
      const headers = { 'Content-Type': 'application/json', 'X-Session-Token': token };
      const resp = await fetch('api/' + path, {
        ...opts,
        headers: { ...headers, ...(opts.headers || {}) }
      });
      const data = await resp.json();
      if (!data.ok) {
        if (resp.status === 401) {
          // 会话过期，退回登录页
          localStorage.removeItem('ppo_user');
          localStorage.removeItem('ppo_token');
          window.location.href = 'index.html';
          throw new Error('会话已过期');
        }
        throw new Error(data.error || '请求失败');
      }
      return data.data;
    },

    // ── 认证 ────────────────────────────────────
    getCurrentUser() {
      return JSON.parse(localStorage.getItem('ppo_user') || 'null');
    },
    logout() {
      localStorage.removeItem('ppo_user');
      localStorage.removeItem('ppo_token');
      window.location.href = 'index.html';
    },

    // ── 邮件列表 ──────────────────────────────
    async getMessages(folder = 'inbox') {
      if (this._demo()) {
        const key = folder === 'inbox' ? 'ppo_inbox' : 'ppo_sent';
        return JSON.parse(localStorage.getItem(key) || '[]');
      }
      try {
        const result = await this._fetch('messages.php?folder=' + folder);
        return result.messages || [];
      } catch (e) {
        console.error('getMessages 失败:', e);
        return [];
      }
    },

    // ── 单封邮件详情 ──────────────────────────
    async getMessage(id) {
      if (this._demo()) {
        const all = [
          ...JSON.parse(localStorage.getItem('ppo_inbox') || '[]'),
          ...JSON.parse(localStorage.getItem('ppo_sent') || '[]')
        ];
        return all.find(m => m.id === id) || null;
      }
      try {
        const result = await this._fetch('messages.php?id=' + encodeURIComponent(id));
        return result.message || null;
      } catch (e) {
        return null;
      }
    },

    // ── 标记已读 ──────────────────────────────
    async markRead(id) {
      if (this._demo()) {
        ['ppo_inbox', 'ppo_sent'].forEach(key => {
          const msgs = JSON.parse(localStorage.getItem(key) || '[]');
          const idx = msgs.findIndex(m => m.id === id);
          if (idx >= 0) {
            msgs[idx].unread = false;
            localStorage.setItem(key, JSON.stringify(msgs));
          }
        });
        return;
      }
      try {
        await this._fetch('messages.php?action=read&id=' + encodeURIComponent(id), { method: 'POST' });
      } catch (e) { /* 标记失败不中断流程 */ }
    },

    // ── 删除邮件 ──────────────────────────────
    async deleteMessage(id) {
      if (this._demo()) {
        ['ppo_inbox', 'ppo_sent'].forEach(key => {
          const msgs = JSON.parse(localStorage.getItem(key) || '[]');
          localStorage.setItem(key, JSON.stringify(msgs.filter(m => m.id !== id)));
        });
        return;
      }
      await this._fetch('messages.php?id=' + encodeURIComponent(id), { method: 'DELETE' });
    },

    // ── 发送邮件 ──────────────────────────────
    async sendMessage(data) {
      if (this._demo()) {
        const sent = JSON.parse(localStorage.getItem('ppo_sent') || '[]');
        const user = this.getCurrentUser();
        const trackingId = 'PPO-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 9000 + 1000);
        const newMsg = {
          id: 'sent-' + Date.now(), folder: 'sent', unread: false, starred: false,
          from: user ? user.name : '我', fromEmail: user ? user.email : '',
          to: data.to, toEmail: data.toEmail || data.to,
          subject: data.subject, body: data.body,
          date: new Date().toISOString(), trackingId,
          trackingStatus: 'processing', package: data.package,
          from_city: data.fromCity || '出发地', to_city: data.toCity || '目的地'
        };
        sent.unshift(newMsg);
        localStorage.setItem('ppo_sent', JSON.stringify(sent));
        const tracking = JSON.parse(localStorage.getItem('ppo_tracking') || '[]');
        tracking.unshift({
          id: trackingId, status: 'processing',
          from: data.fromCity || '出发地', to: data.toCity || '目的地',
          package: data.package, sender: user ? user.name : '我', recipient: data.to,
          steps: [
            { event: '已封装', location: '分拣中心', time: new Date().toLocaleString('zh-CN'), done: true },
            { event: '等待揽收', location: '待安排', time: null, done: false },
            { event: '运输中', location: null, time: null, done: false },
            { event: '派送中', location: null, time: null, done: false },
            { event: '已签收', location: null, time: null, done: false }
          ]
        });
        localStorage.setItem('ppo_tracking', JSON.stringify(tracking));
        return { success: true, trackingId };
      }
      const result = await this._fetch('send.php', {
        method: 'POST',
        body: JSON.stringify({
          to: data.to, toEmail: data.toEmail || data.to,
          subject: data.subject, body: data.body,
          package: data.package, fromCity: data.fromCity, toCity: data.toCity
        })
      });
      return { success: true, trackingId: result.trackingId };
    },

    // ── 未读数量 ──────────────────────────────
    async getUnreadCount() {
      if (this._demo()) {
        const inbox = JSON.parse(localStorage.getItem('ppo_inbox') || '[]');
        return inbox.filter(m => m.unread).length;
      }
      try {
        const result = await this._fetch('messages.php?folder=inbox');
        const msgs = result.messages || [];
        return msgs.filter(m => m.unread).length;
      } catch (e) {
        return 0;
      }
    },

    // ── 追踪（始终使用本地数据，IMAP 无追踪概念） ──
    trackPackage(trackingId) {
      const tracking = JSON.parse(localStorage.getItem('ppo_tracking') || '[]');
      return Promise.resolve(tracking.find(t => t.id === trackingId.trim().toUpperCase()) || null);
    },
    getAllTracking() {
      return Promise.resolve(JSON.parse(localStorage.getItem('ppo_tracking') || '[]'));
    },

    // ── 联系人 ────────────────────────────────
    async getContacts() {
      if (this._demo()) {
        return JSON.parse(localStorage.getItem('ppo_contacts') || '[]');
      }
      try {
        const result = await this._fetch('contacts.php');
        return Array.isArray(result) ? result : [];
      } catch (e) {
        return JSON.parse(localStorage.getItem('ppo_contacts') || '[]');
      }
    },
    async saveContact(contact) {
      if (this._demo()) {
        const contacts = JSON.parse(localStorage.getItem('ppo_contacts') || '[]');
        if (contact.id) {
          const idx = contacts.findIndex(c => c.id === contact.id);
          if (idx >= 0) contacts[idx] = contact; else contacts.push(contact);
        } else {
          contact.id = 'c-' + Date.now();
          contacts.push(contact);
        }
        localStorage.setItem('ppo_contacts', JSON.stringify(contacts));
        return contact;
      }
      const result = await this._fetch('contacts.php', {
        method: 'POST',
        body: JSON.stringify(contact)
      });
      return contact;
    },
    async deleteContact(id) {
      if (this._demo()) {
        const contacts = JSON.parse(localStorage.getItem('ppo_contacts') || '[]');
        localStorage.setItem('ppo_contacts', JSON.stringify(contacts.filter(c => c.id !== id)));
        return;
      }
      await this._fetch('contacts.php?id=' + encodeURIComponent(id), { method: 'DELETE' });
    },

    // ── 服务器配置 ────────────────────────────
    getServerConfig() {
      return JSON.parse(localStorage.getItem('ppo_server_config') || JSON.stringify({
        host: '', smtpPort: 465, imapPort: 993, ssl: true, username: '', password: ''
      }));
    },

    // 从 PHP 加载服务器配置（异步，供设置页调用）
    async loadServerConfig() {
      try {
        const result = await this._fetch('server-config.php');
        if (result && result.host) {
          const current = this.getServerConfig();
          localStorage.setItem('ppo_server_config', JSON.stringify({
            ...current, ...result, password: current.password
          }));
          return result;
        }
      } catch (e) { /* PHP 不可用时，继续用 localStorage */ }
      return this.getServerConfig();
    },

    async saveServerConfig(config) {
      localStorage.setItem('ppo_server_config', JSON.stringify(config));
      // 同步保存到 PHP
      try {
        await this._fetch('server-config.php', {
          method: 'POST',
          body: JSON.stringify(config)
        });
      } catch (e) {
        console.warn('PHP 服务器配置保存失败，仅保存到本地:', e.message);
      }
    },

    async testConnection(config) {
      try {
        const result = await this._fetch('server-config.php?action=test', {
          method: 'POST',
          body: JSON.stringify(config)
        });
        return {
          success: result.success,
          message: result.imap?.success
            ? (result.smtp?.success ? 'IMAP 和 SMTP 均连接成功！' : 'IMAP 成功，SMTP 失败：' + result.smtp?.message)
            : 'IMAP 连接失败：' + result.imap?.message
        };
      } catch (e) {
        return { success: false, message: e.message || '无法连接服务器，请确认后端 PHP 已启用' };
      }
    }
  };

  initMockData();

})();
