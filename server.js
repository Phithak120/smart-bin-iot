require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const authGuard = require('./middleware/authGuard');
const apiRoutes = require('./routes/api');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 1. ด่านตรวจสิทธิ์
app.use(authGuard);

// 2. เส้นทาง API
app.use('/api', apiRoutes);

// 3. ไฟล์ Static และหน้าหลัก
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// 4. ระบบซ่อน Error ยาวๆ
app.use((err, req, res, next) => {
    console.log(`❌ ระบบสะดุด: ${err.message}`);
    res.status(500).json({ success: false, message: 'ระบบขัดข้องชั่วคราว' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Smart Bin Online at http://localhost:${PORT}`);
});