async function loadHistory() {
    try {
        const res = await fetch('/api/history');
        const data = await res.json();
        const table = document.getElementById('history-table');
        if (!table) return;

        table.innerHTML = "";
        const dateFilter = document.getElementById('date-filter').value;

        // ข้อมูลจาก API เป็น Array อยู่แล้ว สามารถวนลูปได้เลย
        // .reverse() เพื่อเอาข้อมูลล่าสุดขึ้นก่อน
        data.reverse().forEach(item => {
            let p = (typeof item === 'object' && item !== null) ? item.percentage : item;
            let t = (typeof item === 'object' && item.timestamp) ? item.timestamp : "บันทึกเก่า";
            let n = (typeof item === 'object') ? item.is_near : false;

            // กรองวันที่
            if (dateFilter && !t.includes(dateFilter)) return;

            table.innerHTML += `
                <tr>
                    <td>${t}</td>
                    <td class="fw-bold text-primary">${p}%</td>
                    <td>
                        <span class="badge ${n ? 'bg-warning text-dark' : 'bg-secondary'}">
                            ${n ? 'พบคน' : 'ไม่มี'}
                        </span>
                    </td>
                </tr>`;
        });
    } catch (err) {
        console.error("Error loading history:", err);
    }
}

// ระบบจัดการปุ่ม Navbar (Login/Logout)
document.addEventListener('DOMContentLoaded', async () => {
    loadHistory();

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
    } catch (err) {
        console.error("Auth check failed:", err);
    }
});