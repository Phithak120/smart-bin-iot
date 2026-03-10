async function loadHistory() {
    try {
        const res = await fetch('/api/history');
        const data = await res.json();
        const table = document.getElementById('history-table');
        
        table.innerHTML = "";
        
        // กรองข้อมูลเฉพาะวันที่เลือก (ถ้ามี)
        const dateFilter = document.getElementById('date-filter').value;

        Object.keys(data).reverse().forEach(key => {
            const item = data[key];
            
            let p = (typeof item === 'object') ? item.percentage : item;
            let t = (typeof item === 'object' && item.timestamp) ? item.timestamp : "บันทึกเก่า";
            let n = (typeof item === 'object') ? item.is_near : false;

            // ถ้ามีการเลือกวันที่ และวันที่ไม่ตรงกัน ให้ข้ามไป
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

// โหลดครั้งแรกตอนเปิดหน้า
loadHistory();