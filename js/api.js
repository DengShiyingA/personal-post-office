/* ═══════════════════════════════════════════════════
   API 适配层 · 当前使用 localStorage Mock 数据
   后续对接宝塔邮局管理器：只需修改此文件
   ═══════════════════════════════════════════════════

   连接宝塔邮局配置（由设置页面写入）:
   localStorage['ppo_server_config'] = {
     host, smtpPort, imapPort, ssl, username, password
   }
══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Mock 数据初始化 ── */
  function initMockData() {
    if (localStorage.getItem('ppo_mock_initialized')) return;

    const inbox = [
      {
        id: 'msg-001', folder: 'inbox', unread: true, starred: false,
        from: '林小雨', fromEmail: 'lin@example.com',
        to: '我', toEmail: 'me@postoffice.com',
        subject: '好久不见，最近还好吗？',
        body: `亲爱的朋友，\n\n好久没有联系了，不知道你最近过得怎么样？\n\n前几天看到街上的梧桐叶落了，忽然想起我们一起走过那条街道的时光。那时候我们总是聊到很晚，对未来有着说不完的幻想。\n\n现在，我在一家小书店做店员，每天和书为伴，虽然薪水不高，但很安心。你呢？还在那家公司工作吗？\n\n希望你一切安好。期待你的回信。\n\n林小雨 敬上\n2026年3月1日，于成都`,
        date: '2026-03-01T09:12:00', trackingId: 'PPO-20260301-1234',
        trackingStatus: 'delivered', package: '心意', from_city: '成都', to_city: '上海'
      },
      {
        id: 'msg-002', folder: 'inbox', unread: true, starred: true,
        from: '张伟明', fromEmail: 'zhang@example.com',
        to: '我', toEmail: 'me@postoffice.com',
        subject: '生日快乐！来自纽约的祝福',
        body: `生日快乐！\n\n隔着太平洋，送上我最真诚的祝福。\n\n希望你的这一年，每一天都像今天一样特别。不管遇到什么困难，都要记得——你身后有一群爱你的朋友。\n\n我在纽约一切都好，这里的秋天很美，只是少了你们这群老朋友。等我回国，一定要好好聚一聚。\n\n附上一张中央公园的照片，愿你的生活也如这里的秋色一样绚烂。\n\n张伟明\n2026年2月28日，于纽约`,
        date: '2026-02-28T14:30:00', trackingId: 'PPO-20260228-5678',
        trackingStatus: 'delivered', package: '珍藏', from_city: '纽约', to_city: '上海'
      },
      {
        id: 'msg-003', folder: 'inbox', unread: true, starred: false,
        from: '个人邮局系统', fromEmail: 'system@postoffice.com',
        to: '我', toEmail: 'me@postoffice.com',
        subject: '你的信件已签收 · PPO-20260225-9012',
        body: `亲爱的用户，\n\n你于2026年2月25日发出的信件已成功签收！\n\n追踪编号：PPO-20260225-9012\n收件人：王芳芳\n签收时间：2026年3月2日 10:45\n\n感谢你使用个人邮局。每一封信，都是一段温暖的旅程。\n\n个人邮局团队\n2026年3月2日`,
        date: '2026-03-02T10:45:00', trackingId: 'PPO-20260225-9012',
        trackingStatus: 'delivered', package: null, from_city: null, to_city: null
      },
      {
        id: 'msg-004', folder: 'inbox', unread: false, starred: false,
        from: '陈思远', fromEmail: 'chen@example.com',
        to: '我', toEmail: 'me@postoffice.com',
        subject: '谢谢你的那封信',
        body: `你好，\n\n收到你上个月的来信，我激动了好久。\n\n现代社会里，还有人愿意用纸和笔写信，真的让我很感动。信纸的质感、墨水的气味，都是邮件和微信给不了的体验。\n\n我会好好保存这封信的。\n\n希望我们能继续这样通信。\n\n陈思远`,
        date: '2026-02-20T16:22:00', trackingId: null,
        trackingStatus: null, package: null, from_city: '北京', to_city: '上海'
      }
    ];

    const sent = [
      {
        id: 'sent-001', folder: 'sent', unread: false, starred: false,
        from: '我', fromEmail: 'me@postoffice.com',
        to: '王芳芳', toEmail: 'wang@example.com',
        subject: '致远方的你',
        body: `芳芳，\n\n见字如面。\n\n好久没有联系，却总是在某个安静的午后想起你。想起我们一起在图书馆备考的日子，想起毕业那天你哭得比谁都厉害。\n\n现在你在深圳还好吗？听说那边最近又有台风，要多注意安全。\n\n我最近开始学做面包，第一炉烤糊了，第二炉还算能吃。附上一张照片，虽然看起来不太好看，但味道真的还不错。\n\n期待你的回信。\n\n你的朋友 敬上`,
        date: '2026-02-25T11:00:00', trackingId: 'PPO-20260225-9012',
        trackingStatus: 'delivered', package: '心意', from_city: '上海', to_city: '深圳'
      },
      {
        id: 'sent-002', folder: 'sent', unread: false, starred: true,
        from: '我', fromEmail: 'me@postoffice.com',
        to: '爸爸妈妈', toEmail: 'parents@example.com',
        subject: '报平安，顺便说说近况',
        body: `爸爸妈妈，\n\n好久没打电话，想着写封信给你们，感觉更正式也更有仪式感。\n\n我在上海一切都好，工作虽然忙，但已经慢慢适应了。租的那个小单间采光不错，楼下有个早点摊，每天早上都能吃到热乎的豆浆油条。\n\n上个月发的奖金，我存了一部分，打算年底回家的时候带你们去吃顿好的。\n\n妈妈的腰要注意，不要总是久坐。爸爸的血压要按时量。你们健健康康的，才是我最大的心安。\n\n爱你们的孩子`,
        date: '2026-02-10T20:30:00', trackingId: 'PPO-20260210-3344',
        trackingStatus: 'delivered', package: '信笺', from_city: '上海', to_city: '武汉'
      },
      {
        id: 'sent-003', folder: 'sent', unread: false, starred: false,
        from: '我', fromEmail: 'me@postoffice.com',
        to: '李明', toEmail: 'li@example.com',
        subject: '元旦快乐！新年新开始',
        body: `明哥，\n\n元旦快乐！\n\n一晃又是新的一年了。去年我们说好要一起去云南的计划，不知道今年有没有机会实现？\n\n最近看了几本书，有本叫《岛上书店》的小说特别好看，推荐给你。\n\n新的一年，愿我们都能更靠近自己想要的生活。\n\n祝好`,
        date: '2026-01-01T09:00:00', trackingId: 'PPO-20260101-7788',
        trackingStatus: 'delivered', package: '信笺', from_city: '上海', to_city: '杭州'
      }
    ];

    const contacts = [
      { id: 'c-001', name: '林小雨', email: 'lin@example.com', phone: '138-0000-0001', city: '成都', note: '大学室友' },
      { id: 'c-002', name: '张伟明', email: 'zhang@example.com', phone: '138-0000-0002', city: '纽约', note: '留学好友' },
      { id: 'c-003', name: '王芳芳', email: 'wang@example.com', phone: '138-0000-0003', city: '深圳', note: '高中同学' },
      { id: 'c-004', name: '陈思远', email: 'chen@example.com', phone: '138-0000-0004', city: '北京', note: '网友' },
      { id: 'c-005', name: '李明', email: 'li@example.com', phone: '138-0000-0005', city: '杭州', note: '工作认识' }
    ];

    const tracking = [
      {
        id: 'PPO-20260301-1234', status: 'delivered',
        from: '成都', to: '上海', package: '心意',
        sender: '林小雨', recipient: '我',
        steps: [
          { event: '已封装', location: '成都分拣中心', time: '2026-03-01 09:12', done: true },
          { event: '已揽收', location: '成都顺丰快递', time: '2026-03-01 14:30', done: true },
          { event: '运输中', location: '成都→上海航空货运', time: '2026-03-01 20:00', done: true },
          { event: '派送中', location: '上海浦东配送站', time: '2026-03-02 08:30', done: true },
          { event: '已签收', location: '上海收件点', time: '2026-03-02 11:20', done: true }
        ]
      },
      {
        id: 'PPO-20260225-9012', status: 'delivered',
        from: '上海', to: '深圳', package: '心意',
        sender: '我', recipient: '王芳芳',
        steps: [
          { event: '已封装', location: '上海分拣中心', time: '2026-02-25 11:00', done: true },
          { event: '已揽收', location: '上海顺丰快递', time: '2026-02-25 15:00', done: true },
          { event: '运输中', location: '上海→深圳高铁货运', time: '2026-02-25 21:00', done: true },
          { event: '派送中', location: '深圳南山配送站', time: '2026-03-02 09:00', done: true },
          { event: '已签收', location: '深圳收件点', time: '2026-03-02 10:45', done: true }
        ]
      },
      {
        id: 'PPO-20260303-8821', status: 'transit',
        from: '上海', to: '巴黎', package: '珍藏',
        sender: '我', recipient: '好友 Emma',
        steps: [
          { event: '已封装', location: '上海分拣中心', time: '2026-03-03 09:12', done: true },
          { event: '已揽收', location: '上海国际快递', time: '2026-03-03 14:30', done: true },
          { event: '运输中', location: '浦东国际机场', time: '2026-03-03 22:00', done: true },
          { event: '海关清关', location: '法国海关', time: null, done: false },
          { event: '已签收', location: '巴黎收件点', time: null, done: false }
        ]
      }
    ];

    localStorage.setItem('ppo_inbox', JSON.stringify(inbox));
    localStorage.setItem('ppo_sent', JSON.stringify(sent));
    localStorage.setItem('ppo_contacts', JSON.stringify(contacts));
    localStorage.setItem('ppo_tracking', JSON.stringify(tracking));
    localStorage.setItem('ppo_mock_initialized', '1');
  }

  /* ══════════════════════════════════
     API 接口定义
     后续对接宝塔：将每个方法替换为 fetch() 调用
  ══════════════════════════════════ */
  window.api = {

    // ── 认证 ──
    getCurrentUser() {
      return JSON.parse(localStorage.getItem('ppo_user') || 'null');
    },
    logout() {
      localStorage.removeItem('ppo_user');
      window.location.href = 'index.html';
    },

    // ── 邮件 ──
    getMessages(folder = 'inbox') {
      const key = folder === 'inbox' ? 'ppo_inbox' : 'ppo_sent';
      return Promise.resolve(JSON.parse(localStorage.getItem(key) || '[]'));
    },
    getMessage(id) {
      const all = [
        ...JSON.parse(localStorage.getItem('ppo_inbox') || '[]'),
        ...JSON.parse(localStorage.getItem('ppo_sent') || '[]')
      ];
      return Promise.resolve(all.find(m => m.id === id) || null);
    },
    markRead(id) {
      ['ppo_inbox', 'ppo_sent'].forEach(key => {
        const msgs = JSON.parse(localStorage.getItem(key) || '[]');
        const idx = msgs.findIndex(m => m.id === id);
        if (idx >= 0) { msgs[idx].unread = false; localStorage.setItem(key, JSON.stringify(msgs)); }
      });
      return Promise.resolve();
    },
    deleteMessage(id) {
      ['ppo_inbox', 'ppo_sent'].forEach(key => {
        const msgs = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = msgs.filter(m => m.id !== id);
        localStorage.setItem(key, JSON.stringify(filtered));
      });
      return Promise.resolve();
    },
    sendMessage(data) {
      const sent = JSON.parse(localStorage.getItem('ppo_sent') || '[]');
      const user = this.getCurrentUser();
      const trackingId = 'PPO-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.floor(Math.random() * 9000 + 1000);
      const newMsg = {
        id: 'sent-' + Date.now(),
        folder: 'sent',
        unread: false, starred: false,
        from: user ? user.name : '我',
        fromEmail: user ? user.email : 'me@postoffice.com',
        to: data.to,
        toEmail: data.toEmail || data.to,
        subject: data.subject,
        body: data.body,
        date: new Date().toISOString(),
        trackingId,
        trackingStatus: 'processing',
        package: data.package,
        from_city: data.fromCity || '上海',
        to_city: data.toCity || '目的地'
      };
      sent.unshift(newMsg);
      localStorage.setItem('ppo_sent', JSON.stringify(sent));

      // 同时添加追踪记录
      const tracking = JSON.parse(localStorage.getItem('ppo_tracking') || '[]');
      tracking.unshift({
        id: trackingId,
        status: 'processing',
        from: data.fromCity || '上海',
        to: data.toCity || '目的地',
        package: data.package,
        sender: user ? user.name : '我',
        recipient: data.to,
        steps: [
          { event: '已封装', location: '分拣中心', time: new Date().toLocaleString('zh-CN'), done: true },
          { event: '等待揽收', location: '待安排', time: null, done: false },
          { event: '运输中', location: null, time: null, done: false },
          { event: '派送中', location: null, time: null, done: false },
          { event: '已签收', location: null, time: null, done: false }
        ]
      });
      localStorage.setItem('ppo_tracking', JSON.stringify(tracking));

      return Promise.resolve({ success: true, trackingId });
    },
    getUnreadCount() {
      const inbox = JSON.parse(localStorage.getItem('ppo_inbox') || '[]');
      return Promise.resolve(inbox.filter(m => m.unread).length);
    },

    // ── 追踪 ──
    trackPackage(trackingId) {
      const tracking = JSON.parse(localStorage.getItem('ppo_tracking') || '[]');
      const result = tracking.find(t => t.id === trackingId.trim().toUpperCase());
      return Promise.resolve(result || null);
    },
    getAllTracking() {
      return Promise.resolve(JSON.parse(localStorage.getItem('ppo_tracking') || '[]'));
    },

    // ── 联系人 ──
    getContacts() {
      return Promise.resolve(JSON.parse(localStorage.getItem('ppo_contacts') || '[]'));
    },
    saveContact(contact) {
      const contacts = JSON.parse(localStorage.getItem('ppo_contacts') || '[]');
      if (contact.id) {
        const idx = contacts.findIndex(c => c.id === contact.id);
        if (idx >= 0) contacts[idx] = contact;
        else contacts.push(contact);
      } else {
        contact.id = 'c-' + Date.now();
        contacts.push(contact);
      }
      localStorage.setItem('ppo_contacts', JSON.stringify(contacts));
      return Promise.resolve(contact);
    },
    deleteContact(id) {
      const contacts = JSON.parse(localStorage.getItem('ppo_contacts') || '[]');
      localStorage.setItem('ppo_contacts', JSON.stringify(contacts.filter(c => c.id !== id)));
      return Promise.resolve();
    },

    // ── 服务器配置（预留宝塔对接） ──
    getServerConfig() {
      return JSON.parse(localStorage.getItem('ppo_server_config') || JSON.stringify({
        host: '',
        smtpPort: 465,
        imapPort: 993,
        ssl: true,
        username: '',
        password: '',
        connected: false
      }));
    },
    saveServerConfig(config) {
      localStorage.setItem('ppo_server_config', JSON.stringify(config));
      return Promise.resolve();
    },
    testConnection(config) {
      // TODO: 对接宝塔后，在此发起真实连接测试
      return new Promise(resolve => {
        setTimeout(() => resolve({ success: false, message: '请配置宝塔邮局服务器信息后测试' }), 1000);
      });
    }
  };

  // 初始化 Mock 数据
  initMockData();

})();
