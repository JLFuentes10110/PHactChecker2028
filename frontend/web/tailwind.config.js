/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        red: { DEFAULT: '#E24B4A', light: '#FCEBEB' },
        green: { DEFAULT: '#639922' },
        amber: { DEFAULT: '#BA7517' },
        coral: { DEFAULT: '#D85A30' },
        gray: { DEFAULT: '#5F5E5A', light: '#F1EFE8' },
      }
    },
  },
  plugins: [],
};