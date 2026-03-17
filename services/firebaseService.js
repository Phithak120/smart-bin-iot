const admin = require("firebase-admin");
const path = require("path");
require('dotenv').config();

// ✅ กลับมาเรียกใช้จากไฟล์กุญแจ (JSON) 
// โดยถอยออกจากโฟลเดอร์ services (../) ไปหาไฟล์ที่อยู่ด้านนอก
const serviceAccount = require(path.join(__dirname, "../serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://smart-trash-bin-test-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();
let cachedTrashStatus = { percentage: 0, is_near: false };

// ดึงข้อมูล Real-time จาก Firebase
db.ref('trash_status').on('value', (snap) => {
    cachedTrashStatus = snap.val() || { percentage: 0, is_near: false };
    console.log("🔥 ข้อมูลใหม่จาก Firebase:", cachedTrashStatus);
}, (error) => {
    console.error("❌ Firebase Error:", error.message);
});

// ส่งออก db และฟังก์ชันดึงค่าล่าสุด
module.exports = { 
    db, 
    getCachedStatus: () => cachedTrashStatus 
};