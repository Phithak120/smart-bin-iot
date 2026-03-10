// ฟังก์ชันดึงข้อมูลจาก Server
async function fetchSensorData() {
    try {
        const res = await fetch('/api/latest');
        const data = await res.json();
        
        // 1. อัปเดตระดับขยะ
        const bar = document.getElementById('trash-bar');
        const p = data.percentage || 0;
        
        bar.style.width = p + '%';
        bar.innerText = p + '%';
        
        if (p >= 90) bar.className = "progress-bar progress-bar-striped progress-bar-animated bg-danger";
        else if (p >= 50) bar.className = "progress-bar progress-bar-striped progress-bar-animated bg-warning text-dark";
        else bar.className = "progress-bar progress-bar-striped progress-bar-animated bg-success";
        
        // 2. อัปเดตสถานะคน
        const prox = document.getElementById('proximity-status');
        prox.innerText = data.is_near ? 'พบคนใกล้ถัง' : 'ปกติ';
        prox.className = data.is_near ? 'badge bg-warning text-dark p-2' : 'badge bg-secondary p-2';

    } catch (err) { 
        console.error("Update Error:", err); 
    }
}

// โหลดข้อมูลทันทีเมื่อเปิดหน้าเว็บ (แก้ปัญหาเว็บโหลดข้อมูลช้า)
fetchSensorData();

// จากนั้นค่อยให้มันอัปเดตเองทุกๆ 3 วินาที
setInterval(fetchSensorData, 3000);

// อัปเดตนาฬิกา
setInterval(() => {
    const now = new Date();
    document.getElementById('realtime-clock').innerText = now.toLocaleTimeString('th-TH');
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('realtime-date').innerText = now.toLocaleDateString('th-TH', dateOptions);
}, 1000);