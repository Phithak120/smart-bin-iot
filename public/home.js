// ฟังก์ชันดึงข้อมูลเซนเซอร์แบบ Real-time
async function fetchSensorData() {
    try {
        const res = await fetch('/api/latest');
        const data = await res.json();
        
        // 1. อัปเดต Progress Bar ระดับขยะ
        const bar = document.getElementById('trash-bar');
        if (bar) {
            const p = data.percentage || 0;
            bar.style.width = p + '%';
            bar.innerText = p + '%';
            
            // เปลี่ยนสีตามความจุ
            if (p >= 90) bar.className = "progress-bar progress-bar-striped progress-bar-animated bg-danger";
            else if (p >= 50) bar.className = "progress-bar progress-bar-striped progress-bar-animated bg-warning text-dark";
            else bar.className = "progress-bar progress-bar-striped progress-bar-animated bg-success";
        }
        
        // 2. อัปเดตสถานะคน (Proximity)
        const prox = document.getElementById('proximity-status');
        if (prox) {
            prox.innerText = data.is_near ? 'พบคนใกล้ถัง' : 'ปกติ';
            prox.className = data.is_near ? 'badge bg-warning text-dark p-2' : 'badge bg-secondary p-2';
        }
    } catch (err) { 
        console.error("Update Error:", err); 
    }
}

// เริ่มต้นดึงข้อมูลและตั้งรอบอัปเดตทุก 3 วินาที
fetchSensorData();
setInterval(fetchSensorData, 3000);

// ระบบนาฬิกา Real-time
setInterval(() => {
    const clockEl = document.getElementById('realtime-clock');
    const dateEl = document.getElementById('realtime-date');
    if (!clockEl || !dateEl) return;

    const now = new Date();
    clockEl.innerText = now.toLocaleTimeString('th-TH');
    dateEl.innerText = now.toLocaleDateString('th-TH', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
}, 1000);

// จัดการสถานะ Navbar (เข้าสู่ระบบ / ออกจากระบบ)
document.addEventListener('DOMContentLoaded', async () => {
    const authBtn = document.getElementById('auth-btn');
    if (!authBtn) return;

    try {
        const res = await fetch('/api/check-auth');
        const data = await res.json();

        if (data.isLoggedIn) {
            // ✅ เปลี่ยนเป็น Logout Link (GET) ชี้ไปที่ API โดยตรง
            authBtn.textContent = 'ออกจากระบบ';
            authBtn.className = 'btn-nav btn-danger';
            authBtn.href = '/api/logout';
            authBtn.style.display = 'inline-flex';
        } else {
            // ปุ่ม Login ปกติ
            authBtn.textContent = 'เข้าสู่ระบบ';
            authBtn.className = 'btn-nav btn-accent';
            authBtn.href = '/login.html';
            authBtn.style.display = 'inline-flex';
        }
    } catch (err) {
        console.error("Auth check failed:", err);
    }
});