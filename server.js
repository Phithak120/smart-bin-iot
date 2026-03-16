require('dotenv').config(); // 🟢 1. ดึงค่าจาก .env ไว้ตรงนี้

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const authGuard = require('./middleware/authGuard');
const apiRoutes = require('./routes/api');

const app = express();

// 1. ตั้งค่าพื้นฐาน (Parsers)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ✅ ต้องมาก่อน authGuard

// 2. ใช้งานด่านตรวจสิทธิ์
app.use(authGuard);

// 3. ให้บริการไฟล์หน้าเว็บ (Frontend)
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'home.html')));

// 4. เชื่อมต่อเส้นทาง API (Backend)
app.use('/api', apiRoutes);

// 🟢 5. Global Error Handler (ซ่อน stack trace ยาวๆ)
app.use((err, req, res, next) => {
    console.log(`❌ ระบบสะดุด: ${err.message}`);
    res.status(500).json({ success: false, message: 'ระบบเกิดข้อผิดพลาดชั่วคราว' });
});

// 6. เปิดเครื่อง Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`=================================`);
});