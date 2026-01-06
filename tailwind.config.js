/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hengdian': {
          'gold': '#D4AF37',
          'red': '#C41E3A',
          'dark': '#1A1A2E',
          'light': '#F5F5DC'
        }
      },
      fontFamily: {
        'game': ['PingFang SC', 'Microsoft YaHei', 'sans-serif']
      }
    },
  },
  plugins: [],
}
