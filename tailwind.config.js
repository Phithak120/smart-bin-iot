/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.{html,js}",
    "./views/**/*.ejs"
  ],
  darkMode: 'media', // ใช้ 'media' เพื่อเปลี่ยนตามธีมของ Windows/macOS/iOS/Android
  theme: {
    extend: {},
  },
  plugins: [],
}