const express = require('express');
const router = express.Router();
const firebaseService = require('../services/firebaseService');

// ... (โค้ดดึงข้อมูล /latest, /history, /control, /lid-history เหมือนเดิม) ...

/* =========================
   LOGIN
========================= */
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        res.cookie('isLoggedIn', 'true', { 
            maxAge: 86400000, 
            httpOnly: true, 
            path: '/', 
            sameSite: 'lax' 
        });
        return res.json({ success: true });
    }
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

router.get('/history', async (req, res) => {
    try {
        // ตรวจสอบใน Firebase ว่าคุณเก็บประวัติไว้ในชื่อ 'trash_history' หรือไม่
        const snapshot = await firebaseService.db.ref('trash_history').limitToLast(50).once('value');
        const data = snapshot.val() || {};
        // ส่งออกไปเป็น Array เพื่อให้ history.js วนลูปง่ายๆ
        res.json(Object.values(data));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🟢 สำหรับหน้า Summary (กราฟการเปิดฝา)
router.get('/lid-history', async (req, res) => {
    try {
        const snapshot = await firebaseService.db.ref('lid_history').once('value');
        const data = snapshot.val() || {};
        
        // สร้าง Array 24 ช่อง (0-23 น.) เพื่อวาดกราฟ
        const hourlyCounts = new Array(24).fill(0);
        Object.values(data).forEach(item => {
            const time = new Date(item.timestamp);
            if (!isNaN(time.getTime())) {
                hourlyCounts[time.getHours()]++;
            }
        });
        res.json(hourlyCounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/* =========================
   CHECK AUTH
========================= */
router.get('/check-auth', (req, res) => {
    const isLoggedIn = req.cookies && req.cookies.isLoggedIn === 'true';
    res.json({ isLoggedIn });
});

/* =========================
   LOGOUT (เปลี่ยนเป็น GET)
========================= */
router.get('/logout', (req, res) => {
    // ลบกุญแจออกจากเบราว์เซอร์
    res.clearCookie('isLoggedIn');
    // เด้งกลับไปหน้าหลัก
    res.redirect('/');
});

router.get('/latest', (req, res) => {
    // 🟢 ดึงค่าล่าสุดมาส่งให้หน้าเว็บ
    const data = firebaseService.getCachedStatus();
    res.json(data);
});

module.exports = router;