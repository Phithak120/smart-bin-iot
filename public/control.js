// ฟังก์ชันส่งคำสั่งไปที่ API
async function sendControl(type, value) {
    try {
        const res = await fetch('/api/control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: type, value: value }) 
        });
        
        if (res.ok) {
            updateStatus(); 
        } else {
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
        }
    } catch (err) {
        console.error("Control Error:", err);
    }
}

// ฟังก์ชันสำหรับเลื่อนแถบความดังเสียง
function sendVolume(val) {
    document.getElementById('vol-label').innerText = val;
    sendControl('volume', val);
}

// ฟังก์ชันดึงสถานะล่าสุดมาโชว์บนแผงควบคุม
async function updateStatus() {
    try {
        const res = await fetch('/api/latest');
        const data = await res.json();
        
        // 1. อัปเดตข้อความสถานะฝาถัง
        const lidEl = document.getElementById('lid-status');
        if (data.lid_command === 'OPEN') {
            lidEl.innerText = 'OPEN (เปิด)';
            lidEl.className = 'fw-bold text-success';
        } else {
            lidEl.innerText = 'CLOSE (ปิด)';
            lidEl.className = 'fw-bold text-danger';
        }

        // 2. อัปเดตข้อความสถานะเสียงเตือน (ที่เพิ่มมาใหม่)
        const buzzerEl = document.getElementById('buzzer-status');
        if (data.buzzer_mode === 'ON') {
            buzzerEl.innerText = 'ON (เปิด)';
            buzzerEl.className = 'fw-bold text-warning'; // สีเหลืองเข้ากับปุ่ม
        } else {
            buzzerEl.innerText = 'OFF (ปิด)';
            buzzerEl.className = 'fw-bold text-danger'; // สีแดงแจ้งเตือนว่าปิด
        }

        // 3. อัปเดตแถบ Slider ความดังเสียง (ถ้าไม่ได้ถูกลากอยู่)
        const slider = document.getElementById('vol-slider');
        const label = document.getElementById('vol-label');
        if (data.buzzer_volume !== undefined && document.activeElement !== slider) {
            slider.value = data.buzzer_volume;
            label.innerText = data.buzzer_volume;
        }

    } catch (err) {
        console.error("Update Status Error:", err);
    }
}

// รีเฟรชสถานะทุกๆ 3 วินาที
setInterval(updateStatus, 3000);
// โหลดสถานะครั้งแรกเมื่อเปิดหน้า
updateStatus();