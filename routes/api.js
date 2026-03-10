const express = require('express');
const router = express.Router();
require('dotenv').config();

const { db, getCachedStatus } = require('../services/firebaseService');

// --- API ระบบ Login / Logout ---
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // ดึงค่า User/Pass จากไฟล์ .env
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        res.cookie('isLoggedIn', 'true', { maxAge: 86400000, httpOnly: true }); 
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'ACCESS DENIED: ข้อมูลไม่ถูกต้อง' });
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('isLoggedIn');
    res.redirect('/');
});

// --- API ข้อมูลและการควบคุม ---
router.post('/control', (req, res) => {
    if (req.cookies.isLoggedIn !== 'true') return res.status(401).json({ error: "Unauthorized" });

    const { type, value } = req.body;
    let updateData = {};
    if (type === 'lid') updateData = { lid_command: value };
    if (type === 'buzzer') updateData = { buzzer_mode: value };
    if (type === 'volume') updateData = { buzzer_volume: parseInt(value) };
    
    db.ref('trash_status').update(updateData);
    res.json({ success: true });
});

router.get('/latest', (req, res) => {
    res.json(getCachedStatus()); // ดึงข้อมูลจาก Cache ทันที
});

router.get('/history', (req, res) => {
    db.ref('trash_history').limitToLast(50).once('value', (snap) => {
        res.json(snap.val() || {});
    });
});

// บรรทัดนี้สำคัญที่สุด! ส่งออก Router ไปให้ server.js
module.exports = router;