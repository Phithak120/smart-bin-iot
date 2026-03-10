🚀 ขั้นตอนหลังจากเซฟไฟล์ .gitignore

เมื่อคุณเซฟไฟล์นี้เสร็จแล้ว ให้ทำตามสเต็ปเดิมเพื่อส่งข้อมูลขึ้น GitHub ครับ:

    git add . (Git จะข้ามไฟล์ที่เราสั่งไว้ใน .gitignore เองอัตโนมัติ)

    git commit -m "update .gitignore and code"

    git push


ลบ
git add .
git commit -m "Security: Remove service account key from repo"
git push