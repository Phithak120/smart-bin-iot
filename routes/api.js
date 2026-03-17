const express = require('express');
const router = express.Router();
const firebaseService = require('../services/firebaseService');

/* ============================================================
   1. DATA API (ดึงข้อมูลแสดงผล)
   ============================================================ */

// ดึงสถานะปัจจุบัน (ใช้ในหน้า Home และ Control)
router.get('/latest', (req, res) => {
    const data = firebaseService.getCachedStatus();
    res.json(data);
});

// ดึงประวัติระดับขยะ (ใช้ในหน้า History และ Summary กราฟเส้น)
router.get('/history', async (req, res) => {
    try {
        const snapshot = await firebaseService.db.ref('trash_history').limitToLast(50).once('value');
        const data = snapshot.val() || {};
        res.json(Object.values(data));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ดึงสถิติการเปิดฝาแยกตามชั่วโมง (ใช้ในหน้า Summary กราฟแท่ง)
router.get('/lid-history', async (req, res) => {
    try {
        const snapshot = await firebaseService.db.ref('lid_history').once('value');
        const data = snapshot.val() || {};
        
        const hourlyCounts = new Array(24).fill(0);
        Object.values(data).forEach(item => {
            if (item.timestamp) {
                const time = new Date(item.timestamp);
                if (!isNaN(time.getTime())) {
                    hourlyCounts[time.getHours()]++;
                }
            }
        });
        res.json(hourlyCounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* ============================================================
   2. CONTROL API (สั่งงานจากหน้าเว็บ)
   ============================================================ */

router.post('/control', async (req, res) => {
    const { type, value } = req.body;
    try {
        let updateData = {};
        
        if (type === 'lid') {
            updateData = { lid_command: value }; 
        } else if (type === 'buzzer') {
            updateData = { buzzer_mode: value }; 
        } else if (type === 'volume') {
            updateData = { buzzer_volume: parseInt(value) }; 
        }

        // 🟢 อัปเดตลง Firebase Path 'trash_status'
        await firebaseService.db.ref('trash_status').update(updateData);
        res.json({ success: true });
    } catch (error) {
        console.error("Control Error:", error);
        res.status(500).json({ success: false });
    }
});

/* ============================================================
   3. AUTH API (ระบบสมาชิก)
   ============================================================ */

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

router.get('/check-auth', (req, res) => {
    const isLoggedIn = req.cookies && req.cookies.isLoggedIn === 'true';
    res.json({ isLoggedIn });
});

router.get('/logout', (req, res) => {
    res.clearCookie('isLoggedIn', { path: '/' });
    res.redirect('/');
});

module.exports = router;