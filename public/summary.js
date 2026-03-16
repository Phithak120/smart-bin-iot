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

    document.getElementById('pane-' + tab).classList.add('active');

    const btn = document.getElementById('tab-' + tab + '-btn');
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

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

        // ── Empty state ──
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

        // ── Stats ──
        const sum    = points.reduce((a, b) => a + b, 0);
        const avg    = sum / points.length;
        const latest = points[points.length - 1];
        const trend  = latest > avg ? '📈 แนวโน้มเพิ่มขึ้น' : '📊 ค่อนข้างคงที่';

        updateStatCards({ avg: avg.toFixed(1) + '%', latest: latest + '%', trend }, 'trash');

        updateAnalysisBox('analysis-text',
            `<div>
                เฉลี่ย: <strong>${avg.toFixed(1)}%</strong>
                <span class="mx-3 text-muted">|</span>
                ล่าสุด: <strong>${latest}%</strong>
                <div class="mt-1 text-muted" style="font-size:12px;">สถานะ: ${trend}</div>
             </div>`);

        // ── Draw chart ──
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
                    pointBackgroundColor: cssVar('--bg') || '#eef2f7',
                    pointBorderColor: cyan,
                    pointHoverBackgroundColor: cyan,
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    tension: 0.4,
                    fill: true,
                    backgroundColor: (context) => {
                        const { chart } = context;
                        const { ctx: c, chartArea } = chart;
                        if (!chartArea) return null;
                        const g = c.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        g.addColorStop(0, 'rgba(0,136,204,0)');
                        g.addColorStop(1, 'rgba(0,136,204,0.2)');
                        return g;
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 500 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(8,14,24,0.85)',
                        borderColor: cyan,
                        borderWidth: 1,
                        titleFont: { family: "'Orbitron', sans-serif", size: 11 },
                        bodyFont: { family: "'Share Tech Mono', monospace" },
                        callbacks: {
                            label: ctx => ` ${ctx.parsed.y}%`
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } },
                    x: { ticks: { maxTicksLimit: 10, maxRotation: 0 } }
                }
            }
        });

        if (spinner) spinner.style.display = 'none';

    } catch (err) {
        console.error('Trash chart error:', err);
        updateAnalysisBox('analysis-text', '<span class="text-danger">⚠ ดึงข้อมูลล้มเหลว</span>');
        if (spinner) spinner.style.display = 'none';
    }
}

/* ============================================================
   CHART 2: LID OPEN FREQUENCY (bar — 24 hours)
   ============================================================ */
async function renderLidChart() {
    const spinner = document.getElementById('lid-spinner');
    try {
        const res    = await fetch('/api/lid-history');
        const counts = await res.json(); // 24-element array

        const totalOpens = counts.reduce((a, b) => a + b, 0);
        const peakHour   = counts.indexOf(Math.max(...counts));

        // ── Empty state ──
        const wrap = document.querySelector('#pane-lid .chart-wrap');
        const existingEmpty = wrap.querySelector('.chart-empty');
        if (existingEmpty) existingEmpty.remove();

        if (totalOpens === 0) {
            wrap.insertAdjacentHTML('beforeend',
                `<div class="chart-empty"><span class="chart-empty-icon">🔒</span>ยังไม่มีข้อมูลการเปิดฝา</div>`);
            if (spinner) spinner.style.display = 'none';
            updateAnalysisBox('lid-analysis-text', '<span class="text-muted">— ยังไม่มีการบันทึกการเปิดฝา —</span>');
            updateStatCards({ total: '0 ครั้ง', peak: '—', lidStatus: 'ไม่มีข้อมูล' }, 'lid');
            return;
        }

        // ── Stats ──
        const peakLabel = peakHour + ':00 – ' + (peakHour + 1) + ':00 น.';
        updateStatCards({ total: totalOpens + ' ครั้ง', peak: peakLabel, lidStatus: '📋 มีข้อมูลแล้ว' }, 'lid');

        updateAnalysisBox('lid-analysis-text',
            `<div>
                เปิดฝาทั้งหมด: <strong>${totalOpens} ครั้ง</strong>
                <span class="mx-3 text-muted">|</span>
                ชั่วโมงที่บ่อยที่สุด: <strong>${peakLabel}</strong>
                <div class="mt-1 text-muted" style="font-size:12px;">${peakHour >= 6 && peakHour < 12 ? '🌅 ช่วงเช้า' : peakHour >= 12 && peakHour < 18 ? '☀️ ช่วงบ่าย' : peakHour >= 18 ? '🌙 ช่วงเย็น/คืน' : '🌃 ช่วงดึก'}</div>
             </div>`);

        // ── Draw chart ──
        const ctx = document.getElementById('lidChart').getContext('2d');
        if (lidChartInst) lidChartInst.destroy();

        const cyan = cssVar('--cyan') || '#0088cc';
        const warn = cssVar('--warn') || '#d97706';
        const cyanGlow = cssVar('--cyan-glow') || 'rgba(0,136,204,0.2)';

        const barColors = counts.map((_, i) => i === peakHour ? warn : cyan);
        const barGlows  = counts.map((_, i) => i === peakHour
            ? (cssVar('--warn-glow') || 'rgba(217,119,6,0.25)')
            : cyanGlow
        );

        const hourLabels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');

        lidChartInst = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: hourLabels,
                datasets: [{
                    label: 'ครั้งที่เปิดฝา',
                    data: counts,
                    backgroundColor: barColors.map((c, i) => {
                        const r = ctx.createLinearGradient(0, 0, 0, 300);
                        r.addColorStop(0, barColors[i]);
                        r.addColorStop(1, barGlows[i]);
                        return r;
                    }),
                    borderColor: barColors,
                    borderWidth: 1,
                    borderRadius: 2,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 600 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(8,14,24,0.85)',
                        borderColor: cyan,
                        borderWidth: 1,
                        titleFont: { family: "'Orbitron', sans-serif", size: 11 },
                        bodyFont: { family: "'Share Tech Mono', monospace" },
                        callbacks: {
                            label: ctx => ` ${ctx.parsed.y} ครั้ง`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, callback: v => Math.floor(v) === v ? v : '' }
                    },
                    x: {
                        ticks: {
                            maxTicksLimit: 12,
                            maxRotation: 45,
                            font: { size: 10 }
                        }
                    }
                }
            }
        });

        if (spinner) spinner.style.display = 'none';

    } catch (err) {
        console.error('Lid chart error:', err);
        updateAnalysisBox('lid-analysis-text', '<span class="text-danger">⚠ ดึงข้อมูลล้มเหลว</span>');
        if (spinner) spinner.style.display = 'none';
    }
}

/* ============================================================
   HELPERS
   ============================================================ */
function updateAnalysisBox(id, html) {
    const box = document.getElementById(id);
    if (!box) return;
    box.innerHTML = html;
    box.className = 'alert mt-3';
}

function updateStatCards(vals, tab) {
    if (tab === 'trash') {
        setTextSafe('stat-avg',    vals.avg    ?? '—');
        setTextSafe('stat-latest', vals.latest ?? '—');
        setTextSafe('stat-trend',  vals.trend  ?? '—');
    } else {
        setTextSafe('stat-lid-total',  vals.total     ?? '—');
        setTextSafe('stat-lid-peak',   vals.peak      ?? '—');
        setTextSafe('stat-lid-status', vals.lidStatus ?? '—');
    }
}

function setTextSafe(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

/* ============================================================
   INIT + AUTO-REFRESH
   ============================================================ */
function startRefresh() {
    clearInterval(trashInterval);
    clearInterval(lidInterval);

    trashInterval = setInterval(() => {
        if (activeTab === 'trash') renderTrashChart();
    }, 5000);

    lidInterval = setInterval(() => {
        if (activeTab === 'lid') renderLidChart();
    }, 5000);
}

// Boot
renderTrashChart();
startRefresh();