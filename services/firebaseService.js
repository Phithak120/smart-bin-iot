const admin = require("firebase-admin");
const path = require("path");
require('dotenv').config();

let serviceAccount;

/**
 * 🛠 ส่วนการจัดการกุญแจ (Authentication)
 * ระบบจะตรวจเช็คว่าถ้ารันบน Render (มี Env) ให้ใช้ค่าจาก Env
 * แต่ถ้ารันในเครื่อง (ไม่มี Env) ให้ไปดึงจากไฟล์ JSON แทน
 */
try {
    if (process.env.FIREBASE_CONFIG) {
        // สำหรับใช้งานบน Render.com (ดึงจาก Environment Variable)
        serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
        console.log("☁️ Firebase: Using Environment Variables (Production Mode)");
    } else {
        // สำหรับใช้งานในเครื่องตัวเอง (ดึงจากไฟล์ config-db.json)
        serviceAccount = require(path.join(__dirname, "../config-db.json"));
        console.log("💻 Firebase: Using config-db.json (Local Mode)");
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://smart-trash-bin-test-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
} catch (error) {
    console.error("❌ Firebase Initialization Error:", error.message);
    process.exit(1); // หยุดการทำงานถ้าเชื่อมต่อฐานข้อมูลไม่ได้
}

const db = admin.database();
let cachedTrashStatus = { percentage: 0, is_near: false };

/**
 * 🛰 การดึงข้อมูล Real-time
 * ฟังคำสั่งจากก้อนข้อมูล 'trash_status' เมื่อมีการเปลี่ยนแปลง
 */
db.ref('trash_status').on('value', (snap) => {
    const data = snap.val();
    if (data) {
        cachedTrashStatus = data;
        console.log("🔥 ข้อมูลใหม่จาก Firebase:", cachedTrashStatus);
    }
}, (error) => {
    console.error("❌ Firebase Read Error:", error.message);
});

// ส่งออก db (สำหรับหน้า History/Summary) และฟังก์ชันดึงค่าล่าสุด (สำหรับหน้า Home)
module.exports = { 
    db, 
    getCachedStatus: () => cachedTrashStatus 
};