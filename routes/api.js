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