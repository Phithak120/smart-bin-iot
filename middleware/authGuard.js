module.exports = (req, res, next) => {
    const protectedPages = ['/control.html', '/history.html', '/summary.html'];
    
    // ถ้าพยายามเข้าหน้าที่มีการป้องกัน
    if (protectedPages.includes(req.path)) {
        if (req.cookies.isLoggedIn !== 'true') {
            // 🟢 ส่ง path ไปกับ redirect เพื่อให้ล็อกอินเสร็จแล้วเด้งกลับมาถูกหน้า
            return res.redirect(`/login.html?redirect=${req.path}`);
        }
    }
    next();
};