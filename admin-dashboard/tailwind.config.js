/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        accent: '#22d3ee',
        background: '#0F172A',
        surface: '#1E293B',
        surfaceLight: '#F8FAFC',
        borderLight: '#E2E8F0',
      },
    },
  },
  plugins: [],
}

