async function fetchSensorData() {
    try {
        const res = await fetch('/api/latest');
        const data = await res.json();
        
        console.log("📡 ข้อมูลที่รับมาที่หน้าเว็บ:", data);

        const bar = document.getElementById('trash-bar');
        // ตรวจสอบว่ามีข้อมูล percentage ส่งมาจริงไหม
        if (bar && data && typeof data.percentage !== 'undefined') {
            const p = data.percentage;
            
            // อัปเดตความกว้างและตัวเลข
            bar.style.width = p + '%';
            bar.innerText = p + '%';
            
            // ปรับสีตามความจุ (อ้างอิงตาม Bootstrap Class)
            bar.classList.remove('bg-success', 'bg-warning', 'bg-danger');
            if (p >= 90) bar.classList.add('bg-danger');
            else if (p >= 50) bar.classList.add('bg-warning');
            else bar.classList.add('bg-success');
        }
    } catch (err) {
        console.error("❌ ดึงข้อมูลเซนเซอร์ล้มเหลว:", err);
    }
}

// ระบบนาฬิกา
function updateClock() {
    const clockEl = document.getElementById('realtime-clock');
    const dateEl = document.getElementById('realtime-date');
    if (!clockEl || !dateEl) return;

    const now = new Date();
    clockEl.innerText = now.toLocaleTimeString('th-TH');
    dateEl.innerText = now.toLocaleDateString('th-TH', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. เริ่มดึงข้อมูลทันทีที่โหลดหน้าจอ
    fetchSensorData();
    updateClock();

    // 2. ตั้งเวลาอัปเดตต่อเนื่อง
    setInterval(fetchSensorData, 3000);
    setInterval(updateClock, 1000);

    // 3. จัดการปุ่ม Login/Logout
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
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
        } catch (err) {
            console.error("Auth check failed:", err);
        }
    }
});