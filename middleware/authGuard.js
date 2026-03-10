module.exports = (req, res, next) => {
    // รายชื่อหน้าที่ต้อง Login ก่อนถึงจะเข้าได้
    const protectedPages = ['/control.html', '/history.html', '/summary.html'];
    
    if (protectedPages.includes(req.path)) {
        if (req.cookies.isLoggedIn !== 'true') {
            return res.redirect('/login.html'); // เด้งไปหน้า Login ทันที
        }
    }
    next(); // ถ้าเป็นหน้าอื่น หรือล็อคอินแล้ว ให้ผ่านได้
};