const admin = require('firebase-admin');
const axios = require('axios');
require('dotenv').config();

const serviceAccount = require("../serviceAccountKey.json"); 

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://smart-trash-bin-test-default-rtdb.asia-southeast1.firebasedatabase.app/"
});
const db = admin.database();

const LINE_TOKEN = process.env.LINE_TOKEN; 
let hasNotified = false;
let cachedTrashStatus = { percentage: 0, is_near: false };

async function sendLine(msg) {
    if (!LINE_TOKEN || LINE_TOKEN === "ใส่_TOKEN_ของจริงที่นี่") return;
    try {
        await axios.post('https://notify-api.line.me/api/notify', `message=${encodeURIComponent(msg)}`, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Bearer ${LINE_TOKEN}` }
        });
    } catch (e) { console.log("LINE Error"); }
}

db.ref('trash_status').on('value', (snap) => {
    cachedTrashStatus = snap.val() || cachedTrashStatus;

    if (cachedTrashStatus.percentage >= 90 && !hasNotified) {
        sendLine(`⚠️ แจ้งเตือน: ถังขยะเต็มแล้ว (${cachedTrashStatus.percentage}%)`);
        hasNotified = true;
    } else if (cachedTrashStatus.percentage < 30) {
        hasNotified = false;
    }
});

// บรรทัดนี้สำคัญมาก! ส่งออกไปให้ไฟล์อื่นใช้งานได้
module.exports = { 
    db, 
    getCachedStatus: () => cachedTrashStatus 
};