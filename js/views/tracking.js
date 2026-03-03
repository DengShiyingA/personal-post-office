/* ═══════════════════════════════════════
   实时追踪视图
═══════════════════════════════════════ */
window.trackingView = {
  render() {
    return `
    <div class="tracking-body">

      <!-- 搜索框 -->
      <div class="tracking-search-card">
        <h3>📦 信件追踪</h3>
        <p>输入追踪编号，实时查看信件所在位置和配送状态</p>
        <div class="tracking-input-row">
          <input class="input" id="trackInput" type="text"
            placeholder="例：PPO-20260303-8821" style="flex:1;font-family:var(--font-mono)" />
          <button class="btn btn-primary" onclick="trackingView._search()">查询</button>
        </div>
      </div>

      <!-- 结果区域 -->
      <div id="trackResult"></div>

      <!-- 在途列表 -->
      <div class="track-result-card" id="trackList" style="margin-top:0">
        <div class="track-result-header">
          <div>
            <div style="font-size:15px;font-weight:600">我的信件</div>
            <div class="track-result-id">所有寄出和收到的信件追踪记录</div>
          </div>
        </div>
        <div id="trackAllList" style="padding:8px 0">
          <div style="padding:30px;text-align:center;color:var(--text-secondary);font-size:14px">加载中…</div>
        </div>
      </div>

    </div>`;
  },

  init() {
    document.getElementById('trackInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._search();
    });

    api.getAllTracking().then(list => {
      const el = document.getElementById('trackAllList');
      if (!el) return;
      if (!list.length) {
        el.innerHTML = `<div class="empty-state" style="padding:40px"><p>暂无追踪记录</p></div>`;
        return;
      }
      el.innerHTML = list.map(t => {
        const stMap = { delivered: ['已签收', 'var(--success)'], transit: ['运输中', 'var(--warning)'], processing: ['处理中', 'var(--accent)'] };
        const [st, sc] = stMap[t.status] || ['未知', 'var(--text-secondary)'];
        return `
        <div style="display:flex;align-items:center;gap:16px;padding:14px 24px;border-bottom:1px solid var(--divider);cursor:pointer"
             onclick="trackingView._fill('${t.id}')">
          <div style="font-size:24px">${t.status === 'delivered' ? '✅' : t.status === 'transit' ? '✈️' : '📦'}</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:600">${t.sender} → ${t.recipient}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${t.from} → ${t.to} · ${t.package || '标准'}</div>
            <div style="font-size:11px;color:var(--text-tertiary);font-family:var(--font-mono);margin-top:2px">${t.id}</div>
          </div>
          <div style="font-size:13px;font-weight:600;color:${sc}">${st}</div>
        </div>`;
      }).join('');
    });
  },

  _fill(id) {
    const input = document.getElementById('trackInput');
    if (input) { input.value = id; this._search(); }
  },

  _search() {
    const id = (document.getElementById('trackInput').value || '').trim();
    if (!id) { showToast('⚠️ 请输入追踪编号'); return; }

    const el = document.getElementById('trackResult');
    el.innerHTML = `<div class="track-result-card" style="margin-bottom:16px"><div style="padding:30px;text-align:center;color:var(--text-secondary)">查询中…</div></div>`;

    api.trackPackage(id).then(t => {
      if (!t) {
        el.innerHTML = `
          <div class="track-result-card" style="margin-bottom:16px">
            <div class="track-result-header">
              <div style="color:var(--destructive);font-weight:600">未找到追踪信息</div>
            </div>
            <div style="padding:20px 24px;font-size:14px;color:var(--text-secondary)">
              未找到编号为 <b>${_escHtml(id)}</b> 的信件，请检查编号是否正确。
            </div>
          </div>`;
        return;
      }

      const stMap = {
        delivered: ['已签收', 'ts-delivered'],
        transit:   ['运输中', 'ts-transit'],
        processing:['处理中', 'ts-processing']
      };
      const [stText, stClass] = stMap[t.status] || ['未知', ''];

      const activeIdx = t.steps.findIndex(s => !s.done);

      el.innerHTML = `
        <div class="track-result-card" style="margin-bottom:16px">
          <div class="track-result-header">
            <div>
              <div style="font-size:16px;font-weight:700">${t.sender} → ${t.recipient}</div>
              <div class="track-result-id">${t.id}</div>
            </div>
            <span class="track-status-badge ${stClass}">${stText}</span>
          </div>
          <div class="track-route">
            <span class="track-city">📍 ${t.from}</span>
            <span class="track-arrow">——✈——</span>
            <span class="track-city">📍 ${t.to}</span>
            ${t.package ? `<span style="margin-left:auto;font-size:12px;color:var(--text-secondary)">${t.package}套餐</span>` : ''}
          </div>
          <div class="track-timeline">
            <div class="timeline-title">配送进度</div>
            ${t.steps.map((step, i) => {
              const isDone = step.done;
              const isActive = !isDone && i === activeIdx;
              const isPending = !isDone && !isActive;
              return `
              <div class="timeline-step ${isDone ? 'done' : isActive ? 'active' : 'pending'}">
                <div class="timeline-dot">${isDone ? '✓' : isActive ? '●' : ''}</div>
                <div class="timeline-info">
                  <div class="timeline-event">${_escHtml(step.event)}</div>
                  ${step.location ? `<div class="timeline-location">📍 ${_escHtml(step.location)}</div>` : ''}
                  ${step.time ? `<div class="timeline-time">${step.time}</div>` : ''}
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>`;
    });
  }
};
