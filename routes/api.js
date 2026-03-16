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

// 🟢 เพิ่ม Endpoint: /api/history สำหรับดึงข้อมูลประวัติการบันทึกขยะ
router.get('/history', async (req, res) => {
    try {
        const snapshot = await firebaseService.db.ref('trash_history').once('value');
        const data = snapshot.val() || {};
        res.json(data);
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

// ... โค้ดเดิมของคุณที่เริ่มด้วย router.post('/login', ... ...
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    // 🟢 ตรวจสอบค่าจาก Environment Variables
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        // ตั้งคุกกี้ให้อยู่ได้ 1 วัน
        res.cookie('isLoggedIn', 'true', { maxAge: 86400000, httpOnly: true });
        return res.json({ success: true });
    }
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});
module.exports = router; // 🟢 เพื่อส่งออกไปให้ไฟล์ server.js ใช้งาน