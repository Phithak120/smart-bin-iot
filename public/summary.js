/* ================================================================
   SMART BIN · SUMMARY.JS · Tab system + dual chart rendering
   ================================================================ */

// ── Chart.js Defaults (Cyber Terminal theme) ──────────────────
Chart.defaults.color = '#7a9ab0';
Chart.defaults.font.family = "'Share Tech Mono', monospace";
Chart.defaults.scale.grid.color = 'rgba(0, 100, 160, 0.07)';

// Dark mode grid
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    Chart.defaults.color = '#6a9ab0';
    Chart.defaults.scale.grid.color = 'rgba(0, 229, 255, 0.05)';
}

// ── Chart instances ──────────────────────────────────────────
let trashChartInst = null;
let lidChartInst   = null;

// ── Refresh intervals ────────────────────────────────────────
let trashInterval = null;
let lidInterval   = null;

// Active tab
let activeTab = 'trash';

// ── CSS variable helper ──────────────────────────────────────
function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/* ============================================================
   TAB SYSTEM
   ============================================================ */
function switchTab(tab) {
    activeTab = tab;

    // Toggle panes
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
    });

    const pane = document.getElementById('pane-' + tab);
    if (pane) pane.classList.add('active');

    const btn = document.getElementById('tab-' + tab + '-btn');
    if (btn) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
    }

    // Lazy render charts on first visit
    if (tab === 'trash') {
        renderTrashChart();
    } else if (tab === 'lid') {
        renderLidChart();
    }
}

/* ============================================================
   CHART 1: TRASH LEVEL (line)
   ============================================================ */
async function renderTrashChart() {
    const spinner = document.getElementById('trash-spinner');
    try {
        const res  = await fetch('/api/history');
        const data = await res.json();

        const labels = [];
        const points = [];

        // data is now an Array of history items
        data.forEach((item, index) => {
            const p = (typeof item === 'object' && item !== null) ? item.percentage : item;
            if (typeof p === 'number') {
                labels.push('ครั้งที่ ' + (index + 1));
                points.push(p);
            }
        });

        const wrap = document.querySelector('#pane-trash .chart-wrap');
        const existingEmpty = wrap.querySelector('.chart-empty');
        if (existingEmpty) existingEmpty.remove();

        if (points.length === 0) {
            wrap.insertAdjacentHTML('beforeend',
                `<div class="chart-empty"><span class="chart-empty-icon">📭</span>ยังไม่มีข้อมูลประวัติขยะ</div>`);
            if (spinner) spinner.style.display = 'none';
            updateAnalysisBox('analysis-text', '<span class="text-muted">— ไม่มีข้อมูล —</span>');
            updateStatCards({ avg: '—', latest: '—', trend: 'ไม่มีข้อมูล' }, 'trash');
            return;
        }

        const sum    = points.reduce((a, b) => a + b, 0);
        const avg    = sum / points.length;
        const latest = points[points.length - 1];
        const trend  = latest > avg ? '📈 แนวโน้มเพิ่มขึ้น' : '📊 ค่อนข้างคงที่';

        updateStatCards({ avg: avg.toFixed(1) + '%', latest: latest + '%', trend }, 'trash');
        updateAnalysisBox('analysis-text',
            `<div>เฉลี่ย: <strong>${avg.toFixed(1)}%</strong> <span class="mx-3 text-muted">|</span> ล่าสุด: <strong>${latest}%</strong></div>`);

        const ctx = document.getElementById('trashChart').getContext('2d');
        if (trashChartInst) trashChartInst.destroy();

        const cyan = cssVar('--cyan') || '#0088cc';
        trashChartInst = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'ระดับขยะ (%)',
                    data: points,
                    borderColor: cyan,
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(0,136,204,0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        });

        if (spinner) spinner.style.display = 'none';
    } catch (err) {
        console.error('Trash chart error:', err);
        if (spinner) spinner.style.display = 'none';
    }
}

/* ============================================================
   CHART 2: LID OPEN FREQUENCY (bar)
   ============================================================ */
async function renderLidChart() {
    const spinner = document.getElementById('lid-spinner');
    try {
        const res    = await fetch('/api/lid-history');
        const counts = await res.json();

        const totalOpens = counts.reduce((a, b) => a + b, 0);
        const peakHour   = counts.indexOf(Math.max(...counts));

        const wrap = document.querySelector('#pane-lid .chart-wrap');
        const existingEmpty = wrap.querySelector('.chart-empty');
        if (existingEmpty) existingEmpty.remove();

        if (totalOpens === 0) {
            wrap.insertAdjacentHTML('beforeend', `<div class="chart-empty">ยังไม่มีข้อมูลการเปิดฝา</div>`);
            if (spinner) spinner.style.display = 'none';
            return;
        }

        updateStatCards({ total: totalOpens + ' ครั้ง', peak: peakHour + ':00 น.', lidStatus: 'ปกติ' }, 'lid');

        const ctx = document.getElementById('lidChart').getContext('2d');
        if (lidChartInst) lidChartInst.destroy();

        lidChartInst = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({ length: 24 }, (_, i) => i + ':00'),
                datasets: [{ label: 'ครั้งที่เปิด', data: counts, backgroundColor: '#0088cc' }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        if (spinner) spinner.style.display = 'none';
    } catch (err) {
        if (spinner) spinner.style.display = 'none';
    }
}

/* ============================================================
   HELPERS & AUTH
   ============================================================ */
function updateAnalysisBox(id, html) {
    const box = document.getElementById(id);
    if (box) box.innerHTML = html;
}

function updateStatCards(vals, tab) {
    if (tab === 'trash') {
        setTextSafe('stat-avg', vals.avg);
        setTextSafe('stat-latest', vals.latest);
        setTextSafe('stat-trend', vals.trend);
    } else {
        setTextSafe('stat-lid-total', vals.total);
        setTextSafe('stat-lid-peak', vals.peak);
        setTextSafe('stat-lid-status', vals.lidStatus);
    }
}

function setTextSafe(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function startRefresh() {
    setInterval(() => { if (activeTab === 'trash') renderTrashChart(); }, 5000);
    setInterval(() => { if (activeTab === 'lid') renderLidChart(); }, 5000);
}

// 🟢 ส่วนจัดการ Auth บน Navbar และ Init
document.addEventListener('DOMContentLoaded', async () => {
    renderTrashChart();
    startRefresh();

    const authBtn = document.getElementById('auth-btn');
    if (!authBtn) return;

    try {
        const res = await fetch('/api/check-auth');
        const data = await res.json();
        if (data.isLoggedIn) {
            authBtn.textContent = 'ออกจากระบบ';
            authBtn.className = 'btn-nav btn-danger';
            authBtn.href = '/api/logout';
        } else {
            authBtn.textContent = 'เข้าสู่ระบบ';
            authBtn.className = 'btn-nav btn-accent';
            authBtn.href = '/login.html';
        }
        authBtn.style.display = 'inline-flex';
    } catch (e) { console.error(e); }
});