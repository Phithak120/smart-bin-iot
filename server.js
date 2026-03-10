const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

// นำเข้าไฟล์ที่เราแยกไว้
const authGuard = require('./middleware/authGuard');
const apiRoutes = require('./routes/api');

const app = express();

// 1. ตั้งค่าพื้นฐาน (Parsers)
app.use(express.json());
app.use(cookieParser());

// 2. ใช้งานด่านตรวจสิทธิ์
app.use(authGuard);

// 3. ให้บริการไฟล์หน้าเว็บ (Frontend)
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'home.html')));

// 4. เชื่อมต่อเส้นทาง API (Backend)
app.use('/api', apiRoutes);

// 5. เปิดเครื่อง Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 System Online at Port: ${PORT}`);
    console.log(`🌐 Dashboard: http://localhost:${PORT}`);
    console.log(`=================================`);
});