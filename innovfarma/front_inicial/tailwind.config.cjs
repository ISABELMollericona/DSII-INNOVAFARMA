/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './**/*.html',
    './**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f766e',
          600: '#0f766e',
          700: '#0b6b60'
        }
      }
    }
  },
  plugins: []
}
