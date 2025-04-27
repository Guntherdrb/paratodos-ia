/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fade1: {
          '0%,45%': { opacity: '1' },
          '55%,100%': { opacity: '0' },
        },
        fade2: {
          '0%,45%': { opacity: '0' },
          '55%,100%': { opacity: '1' },
        },
      },
      animation: {
        fade1: 'fade1 10s ease-in-out infinite',
        fade2: 'fade2 10s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
