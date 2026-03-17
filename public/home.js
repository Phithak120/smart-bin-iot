/* ============================================================
   ฟังก์ชันหลัก: ดึงข้อมูลจาก API และอัปเดตหน้าจอ (Real-time)
   ============================================================ */
async function fetchSensorData() {
    try {
        const res = await fetch('/api/latest');
        if (!res.ok) throw new Error('Network response was not ok');
        
        const data = await res.json();
        console.log("📡 ข้อมูลที่รับมาที่หน้าเว็บ:", data);

        // 1. อัปเดตระดับขยะ (Progress Bar)
        const bar = document.getElementById('trash-bar');
        if (bar && typeof data.percentage !== 'undefined') {
            const p = data.percentage;
            
            // ปรับความกว้างและตัวเลข %
            bar.style.width = p + '%';
            bar.innerText = p + '%';
            
            // ปรับสีตามความจุ (Success: เขียว, Warning: ส้ม, Danger: แดง)
            bar.classList.remove('bg-success', 'bg-warning', 'bg-danger');
            if (p >= 90) {
                bar.classList.add('bg-danger');
            } else if (p >= 50) {
                bar.classList.add('bg-warning');
            } else {
                bar.classList.add('bg-success');
            }
        }

        // 2. อัปเดตเซนเซอร์ตรวจจับคน (Badge Status)
        const personEl = document.getElementById('person-status');
        if (personEl) {
            // ตรวจสอบค่า is_near จาก Firebase (รองรับทั้ง boolean และ string)
            if (data.is_near === true || data.is_near === "true") {
                personEl.innerText = 'พบคนใกล้ถัง';
                personEl.className = 'badge bg-warning text-dark'; 
                // ถ้ามี CSS Animation สามารถเพิ่ม class animate-pulse ได้ที่นี่
            } else {
                personEl.innerText = 'ปกติ';
                personEl.className = 'badge bg-light text-muted';
            }
        }
        
    } catch (err) {
        console.error("❌ ดึงข้อมูลเซนเซอร์ล้มเหลว:", err);
    }
}

/* ============================================================
   ระบบนาฬิกาและวันที่ (Real-time Clock)
   ============================================================ */
function updateClock() {
    const clockEl = document.getElementById('realtime-clock');
    const dateEl = document.getElementById('realtime-date');
    if (!clockEl || !dateEl) return;

    const now = new Date();
    
    // แสดงเวลาแบบ HH:mm:ss
    clockEl.innerText = now.toLocaleTimeString('th-TH');
    
    // แสดงวันที่แบบเต็ม (วัน, วันที่ เดือน ปี)
    dateEl.innerText = now.toLocaleDateString('th-TH', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

/* ============================================================
   ฟังก์ชันจัดการสถานะปุ่มบน Navbar (Auth System)
   ============================================================ */
async function checkAuthStatus() {
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
    } catch (err) {
        console.error("❌ ตรวจสอบสถานะการเข้าสู่ระบบล้มเหลว:", err);
    }
}

/* ============================================================
   Main Entry Point: ทำงานเมื่อโหลดหน้าเว็บเสร็จ
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    // 1. รันทันทีเมื่อเปิดหน้า
    fetchSensorData();
    updateClock();
    checkAuthStatus();

    // 2. ตั้งเวลาการอัปเดตอัตโนมัติ
    // อัปเดตข้อมูลขยะและเซนเซอร์ทุก 3 วินาที
    setInterval(fetchSensorData, 3000);
    
    // อัปเดตนาฬิกาทุก 1 วินาที
    setInterval(updateClock, 1000);
});