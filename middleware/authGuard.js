// รายชื่อหน้าที่ต้องล็อกอินก่อนถึงจะเข้าได้
const PROTECTED_PAGES = ['/control.html', '/history.html', '/summary.html'];

// รายชื่อ API ที่เปิดให้ทุกคนเข้าถึงได้
const PUBLIC_API_PATHS = [
    '/api/login',
    '/api/logout',
    '/api/check-auth',
    '/api/latest',
];

module.exports = (req, res, next) => {
    const path = req.path;
    // 🟢 แก้ไข: ตรวจสอบคุกกี้ชื่อ 'isLoggedIn' ให้ตรงกับใน api.js
    const isUserLoggedIn = req.cookies && req.cookies.isLoggedIn === 'true';

    // 1. ปกป้องหน้า HTML
    if (PROTECTED_PAGES.includes(path)) {
        if (!isUserLoggedIn) {
            return res.redirect(`/login.html?redirect=${encodeURIComponent(path)}`);
        }
        return next();
    }

    // 2. ปกป้อง API routes ทั้งหมด ยกเว้น whitelist
    if (path.startsWith('/api/')) {
        const isPublic = PUBLIC_API_PATHS.some(p => path === p || path.startsWith(p + '?'));
        if (!isPublic && !isUserLoggedIn) {
            return res.status(401).json({ error: 'Unauthorized', message: 'กรุณาเข้าสู่ระบบก่อน' });
        }
    }

    next();
};