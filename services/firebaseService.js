// services/firebaseService.js
const admin = require("firebase-admin");
const path = require("path");
require('dotenv').config();

const serviceAccount = require(path.join(__dirname, "../serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://smart-trash-bin-test-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();
let cachedTrashStatus = { percentage: 0, is_near: false };

// หน้าหลักใช้ตัวนี้ (เรียลไทม์)
db.ref('trash_status').on('value', (snap) => {
    cachedTrashStatus = snap.val() || { percentage: 0, is_near: false };
});

// ✅ ต้องส่ง db ออกไปด้วยเพื่อให้หน้า History/Summary ดึงข้อมูลย้อนหลังได้
module.exports = { 
    db, 
    getCachedStatus: () => cachedTrashStatus 
};