const express = require('express'); // 🟢 ต้องมีบรรทัดนี้
const router = express.Router();    // 🟢 และบรรทัดนี้ เพื่อสร้างตัวแปร router
require('dotenv').config();

// 🟢 นำเข้า Firebase Service เพื่อใช้ดึงข้อมูลขยะ
const firebaseService = require('../services/firebaseService');

// 🟢 เพิ่ม Endpoint: /api/latest สำหรับดึงข้อมูลจากตัวแปร cache ใน Firebase 
router.get('/latest', (req, res) => {
    const data = firebaseService.getCachedStatus();
    res.json(data);
});

// 🟢 เพิ่ม Endpoint: /api/history สำหรับดึงข้อมูลประวัติการบันทึกขยะ (ลิมิต 30 รายการล่าสุด)
router.get('/history', async (req, res) => {
    try {
        const snapshot = await firebaseService.db.ref('trash_history')
                                               .orderByKey()
                                               .limitToLast(30)
                                               .once('value');
        const dataArray = [];
        snapshot.forEach(child => {
            dataArray.push(child.val());
        });
        res.json(dataArray);
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ error: "Failed to fetch history data" });
    }
});

// 🟢 เพิ่ม Endpoint: /api/control สำหรับส่งคำสั่งควบคุมถังขยะ
router.post('/control', async (req, res) => {
    try {
        const { type, value } = req.body;
        const updates = {};
        
        if (type === 'lid') {
            updates['lid_command'] = value;
        } else if (type === 'buzzer') {
            updates['buzzer_mode'] = value;
        } else if (type === 'volume') {
            updates['buzzer_volume'] = parseInt(value, 10);
        }
        
        await firebaseService.db.ref('trash_status').update(updates);
        res.json({ success: true });
    } catch (error) {
        console.error("Control Error:", error);
        res.status(500).json({ success: false, error: "Failed to send command" });
    }
});

// 🟡 เพิ่ม Endpoint: /api/lid-history สำหรับดึงข้อมูลความถี่การเปิดฝาถัง
router.get('/lid-history', async (req, res) => {
    try {
        const snapshot = await firebaseService.db.ref('lid_history').once('value');
        const data = snapshot.val() || {};

        // สร้างอาร์เรย์ 24 ชั่วโมง (0–23) และนับจำนวนครั้งที่เปิดฝาในแต่ละชั่วโมง
        const hourlyCounts = new Array(24).fill(0);
        Object.values(data).forEach((item) => {
            const ts = (typeof item === 'object' && item.timestamp) ? item.timestamp : item;
            if (ts) {
                const dateObj = new Date(ts);
                if (!isNaN(dateObj.getTime())) { // ตรวจสอบว่าเป็นวันที่ที่ถูกต้อง
                    const hour = dateObj.getHours();
                    hourlyCounts[hour]++;
                }
            }
        });

        res.json(hourlyCounts);
    } catch (error) {
        console.error("Error fetching lid history:", error);
        res.status(500).json({ error: "Failed to fetch lid history data" });
    }
});

// ... โค้ดเดิมของคุณที่เริ่มด้วย router.post('/login', ... ...
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        res.cookie('isLoggedIn', 'true', { maxAge: 86400000, httpOnly: true });
        return res.json({ success: true });
    }
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Check Authentication Status
router.get('/check-auth', (req, res) => {
    const isLoggedIn = req.cookies.isLoggedIn === 'true';
    res.json({ isLoggedIn });
});

// Logout — clear cookie and return JSON success
router.post('/logout', (req, res) => {
    res.clearCookie('isLoggedIn');
    res.json({ success: true });
});

module.exports = router;
