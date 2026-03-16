module.exports = (req, res, next) => {
    const publicPaths = [
        '/login.html',
        '/style.css',
        '/api/login',
        '/api/logout',
        '/api/check-auth'
    ];

    if (publicPaths.includes(req.path)) {
        return next();
    }

    if (req.cookies && req.cookies.isLoggedIn === 'true') {
        return next();
    }

    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // ✅ ป้องกัน Browser Cache เพื่อแก้ปัญหา Login Loop
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.redirect('/login.html');
};