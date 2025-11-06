/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        background: '#0A0A0A',
        surface: '#1A1A1A',
      },
    },
  },
  plugins: [],
}

