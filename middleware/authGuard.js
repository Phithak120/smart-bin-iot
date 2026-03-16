/* ================================================================
   authGuard.js  —  Smart Bin · Auth Middleware
   ================================================================
   ปกป้องทั้ง:
     • หน้าเว็บ (Protected HTML pages)
     • API เฉพาะผู้ที่ล็อกอินแล้วเท่านั้น

   สาธารณะ (ไม่ต้องล็อกอิน):
     HTML : /  /login.html
     API  : /api/login  /api/logout  /api/check-auth  /api/latest
   ================================================================ */

const PROTECTED_PAGES = ['/control.html', '/history.html', '/summary.html'];

// API ที่เปิดให้สาธารณะเข้าถึงได้ (whitelist)
const PUBLIC_API_PATHS = [
    '/api/login',
    '/api/logout',
    '/api/check-auth',
    '/api/latest',
];

function isAuthenticated(req) {
    // ตรวจสอบ Signed Cookie — จะ return false ถ้าถูกแก้ไข
    return req.signedCookies && req.signedCookies.authToken === 'authenticated';
}

module.exports = (req, res, next) => {
    const path = req.path;

    // 1. ปกป้องหน้า HTML (redirect → login)
    if (PROTECTED_PAGES.includes(path)) {
        if (!isAuthenticated(req)) {
            return res.redirect(`/login.html?redirect=${encodeURIComponent(path)}`);
        }
        return next();
    }

    // 2. ปกป้อง API routes ทั้งหมด ยกเว้น whitelist
    if (path.startsWith('/api/')) {
        const isPublic = PUBLIC_API_PATHS.some(p => path === p || path.startsWith(p + '?'));
        if (!isPublic && !isAuthenticated(req)) {
            return res.status(401).json({ error: 'Unauthorized', message: 'กรุณาเข้าสู่ระบบก่อน' });
        }
    }

    next();
};