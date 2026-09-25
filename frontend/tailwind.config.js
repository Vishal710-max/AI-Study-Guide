/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f6ff',
          100: '#e6edff',
          200: '#c3d4ff',
          300: '#9fb8ff',
          400: '#6f8bff',
          500: '#4a63f7',
          600: '#3a4bdb',
          700: '#2e3bb0',
          800: '#242e87',
          900: '#1c2469',
        },
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        soft: '0 8px 30px -8px rgba(30, 41, 59, 0.15)',
      },
    },
  },
  plugins: [],
}
