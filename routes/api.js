const express = require('express');
const router = express.Router();
require('dotenv').config();

const firebaseService = require('../services/firebaseService');


router.get('/latest', (req, res) => {
    const data = firebaseService.getCachedStatus();
    res.json(data);
});


router.get('/history', async (req, res) => {
    try {

        const snapshot = await firebaseService
            .db
            .ref('trash_history')
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

        res.status(500).json({
            error: "Failed to fetch history data"
        });
    }
});


router.post('/control', async (req, res) => {
    try {

        const { type, value } = req.body;
        const updates = {};

        if (type === 'lid') updates['lid_command'] = value;
        else if (type === 'buzzer') updates['buzzer_mode'] = value;
        else if (type === 'volume') updates['buzzer_volume'] = parseInt(value, 10);

        await firebaseService
            .db
            .ref('trash_status')
            .update(updates);

        res.json({ success: true });

    } catch (error) {

        console.error("Control Error:", error);

        res.status(500).json({
            success: false,
            error: "Failed to send command"
        });
    }
});


router.get('/lid-history', async (req, res) => {

    try {

        const snapshot = await firebaseService
            .db
            .ref('lid_history')
            .once('value');

        const data = snapshot.val() || {};

        const hourlyCounts = new Array(24).fill(0);

        Object.values(data).forEach(item => {

            const ts = (typeof item === 'object' && item.timestamp)
                ? item.timestamp
                : item;

            if (ts) {

                const dateObj = new Date(ts);

                if (!isNaN(dateObj.getTime())) {

                    const hour = dateObj.getHours();
                    hourlyCounts[hour]++;

                }
            }
        });

        res.json(hourlyCounts);

    } catch (error) {

        console.error("Error fetching lid history:", error);

        res.status(500).json({
            error: "Failed to fetch lid history data"
        });
    }
});


/* =========================
   LOGIN
========================= */
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        // ✅ เพิ่ม path: '/' เพื่อให้คุกกี้ใช้ได้ทุกหน้า
        res.cookie('isLoggedIn', 'true', { maxAge: 86400000, httpOnly: true, path: '/' });
        return res.json({ success: true });
    }
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

/* =========================
   CHECK AUTH
========================= */
router.get('/check-auth', (req, res) => {
    const isLoggedIn = req.cookies && req.cookies.isLoggedIn === 'true';
    res.json({ isLoggedIn });
});

/* =========================
   LOGOUT (GET)
========================= */
router.get('/logout', (req, res) => {
    // ✅ ลบคุกกี้ด้วย path เดียวกับตอนสร้าง และ redirect ไปหน้าล็อกอิน
    res.clearCookie('isLoggedIn', { path: '/' });
    res.redirect('/login.html');
});


module.exports = router;