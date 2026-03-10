let myChart;

// ปรับแต่งสีพื้นฐานของกราฟให้เข้ากับ Dark Theme
Chart.defaults.color = '#a0a5b5';
Chart.defaults.font.family = "'DM Mono', monospace";
Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)';

async function renderSummary() {
    try {
        const res = await fetch('/api/history');
        const data = await res.json();
        
        const labels = [];
        const points = [];
        
        Object.keys(data).forEach((key, index) => {
            const item = data[key];
            let p = (typeof item === 'object') ? item.percentage : item;
            labels.push("ครั้งที่ " + (index + 1));
            points.push(p);
        });

        // --- ส่วนการสรุปผล ---
        const analysisBox = document.getElementById('analysis-text');
        if (points.length > 0) {
            const sum = points.reduce((a, b) => a + b, 0);
            const avg = sum / points.length;
            const latest = points[points.length - 1];
            
            let trend = (latest > avg) ? "มีแนวโน้มขยะเพิ่มขึ้น" : "ปริมาณขยะยังคงที่";
            
            // ใส่ข้อมูลใหม่ลงไปในกล่องแจ้งเตือน
            analysisBox.innerHTML = `
                <div>
                    เฉลี่ย: <strong>${avg.toFixed(1)}%</strong> <span class="mx-3 text-muted">|</span> 
                    ล่าสุด: <strong>${latest}%</strong> 
                    <div class="mt-2 text-muted" style="font-size: 12px;">สถานะ: ${trend}</div>
                </div>
            `;
            analysisBox.className = "alert mt-4"; // เอา Spinner ออก
        }

        // --- วาดกราฟ ---
        const ctx = document.getElementById('myChart').getContext('2d');
        if (myChart) myChart.destroy();

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'ระดับขยะ (%)',
                    data: points,
                    borderColor: '#00ffb3', // สีเขียว Neon
                    pointBackgroundColor: '#050608',
                    pointBorderColor: '#00ffb3',
                    pointHoverBackgroundColor: '#00ffb3',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4, // ทำให้เส้นโค้งสวยๆ
                    fill: true,
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) return null;
                        // ใส่ลูกเล่นไล่สีใต้กราฟ (Gradient)
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, 'rgba(0, 255, 179, 0)');
                        gradient.addColorStop(1, 'rgba(0, 255, 179, 0.25)');
                        return gradient;
                    }
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: { display: false } // ซ่อน Legend ให้ดูคลีนๆ
                },
                scales: { 
                    y: { beginAtZero: true, max: 100 },
                    x: { ticks: { maxTicksLimit: 10 } } // ไม่ให้ข้อความแกน X แน่นเกินไป
                }
            }
        });
    } catch (err) {
        console.error("Error updating summary:", err);
    }
}

setInterval(renderSummary, 5000); 
renderSummary();